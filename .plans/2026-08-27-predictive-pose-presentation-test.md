# Predictive Pose Presentation Test

**Date:** 2026-08-27
**Status:** Draft / Awaiting Derrick Approval
**Agent:** cookie
**Umbrella Bead:** `aerobeat-web-cv-x85`
**Implementation Bead:** `aerobeat-web-cv-x85.1`
**Physical QA Bead:** `aerobeat-web-cv-x85.2`
**Final Audit Bead:** `aerobeat-web-cv-x85.3`

## Goal

Determine whether deliberately reducing synchronous MediaPipe inference from the current 15fps submission ceiling to 8fps can materially reduce browser main-thread pressure while a strictly render-only, short-horizon pose predictor preserves a visually smooth 30fps overlay. The experiment must not change scoring/input truth, model/provider/default selection, measured pose timestamps, or production behavior.

## Why This Experiment

The completed MediaPipe worker experiment proved that moving inference off-thread improves browser callback and overlay cadence but worsens total CV latency and pose freshness. On the moto g power, Direct-full GPU-WebGL remains best at 62/72ms total p50/p95, but approximately 62ms of synchronous work at 11–12 outputs per second can occupy most of each second on the main thread. A deliberate 8fps ceiling targets roughly one-third fewer inference calls. Presentation prediction may visually bridge the resulting 125ms measured-pose interval without claiming faster inference.

This is a presentation experiment, not a scoring-model change. Individual inference cost will remain approximately unchanged.

## References

- `.plans/2026-08-27-mediapipe-worker-mobile-test.md`
- `docs/telemetry/mediapipe-videoframe-mobile-moto-g-power-2026-08-27.md`
- `docs/telemetry/mediapipe-worker-mobile-moto-g-power-2026-08-27.md`
- `aerobeat-web-cv/src/index.js` — measured sampling, latest-frame-wins, configurable `submissionCadenceTargetFps`
- `aerobeat-web-assembly/src/index.js` — measured input routing and independent 30fps overlay cadence
- `aerobeat-web-ui/src/elements/aero-media-pose-preview/aero-media-pose-preview.js` — measured smoothing and overlay presentation

## Experiment Modes

Add a separate reload-persistent **Pose presentation** dropdown rather than overloading the existing CV-performance presets:

1. **Measured / current cadence (recommended)**
   - Existing 15fps submission ceiling.
   - Existing latest measured pose overlay.
   - Unchanged production/default path.
2. **Experimental measured / 8fps**
   - Direct-full main-thread MediaPipe with an 8fps submission ceiling.
   - Repeats the latest measured overlay with no prediction.
   - Isolates the effect of reduced inference duty from prediction.
3. **Experimental predicted overlay / 8fps**
   - Identical 8fps measured inference workload.
   - Uses two measured poses to extrapolate presentation landmarks at the existing 30fps overlay cadence.
   - Prediction is visual only; scoring/input still receives only new measured poses.

Persist the selection in a route parameter such as `posePresentation=measured|measured-8|predicted-8`. A reload must reproduce the selected mode exactly. Switching live may use the existing serialized service-replacement path, but every evidence packet starts after a reload.

The two experimental modes are applicable only to MediaPipe Direct-full main-thread execution. Selecting an incompatible backend, worker preset, or downscale preset must visibly reset to measured/current cadence rather than silently combining workloads.

## Non-Negotiable Truth Invariants

1. Direct-full measured/current cadence remains the default and recommended option.
2. The CV service, latest measured output, pose-flow panel, input router, gameplay events, and scoring consume only real adapter outputs.
3. A predicted presentation must never be stored or exported as a measured `NormalizedPoseFrame` and must never rewrite its capture timestamp.
4. Preview telemetry must keep measured media-pose age separate from prediction horizon; prediction cannot make measured freshness appear lower.
5. The predictor retains at most two consecutive measured landmark sets. There is no prediction queue.
6. Source, mirror, backend, camera, tracking-profile, stop, restart, dispose, missing-landmark, and timestamp discontinuities reset prediction state.
7. Prediction requires two ordered frames from the same source and the complete seven-landmark set.
8. Prediction horizon is capped at 125ms. Once the latest measured pose is older than that cap, the overlay freezes on measured/smoothed truth rather than extrapolating indefinitely.
9. Low-visibility or missing landmarks are not extrapolated. Coordinates remain clamped to normalized bounds and any displacement clamp is explicit and telemetered.
10. Occlusion, exit, re-entry, and direction reversal must not reuse stale velocity.
11. Existing Fast/Smoother measured-pose filtering remains identical across all matched modes. Prediction operates from the same measured/smoothed inputs and does not add an undisclosed scoring filter.
12. Unsupported or invalid route values normalize visibly to measured/current cadence with a stated reason.

## Proposed Ownership

### `aerobeat-web-cv`

- Continue owning measured sampling and latest-frame-wins truth.
- Use the already-public `submissionCadenceTargetFps` service option for 15fps versus 8fps.
- Add or strengthen deterministic cadence/status tests only where current coverage is insufficient.
- Do not add prediction to CV output or adapter contracts.

### `aerobeat-web-ui`

- Own presentation-only prediction inside the media pose preview, adjacent to existing preview smoothing.
- Retain measured pose timestamps and expose a separate presentation snapshot.
- Implement a pure deterministic helper for two-frame velocity, bounds, reset, correction-error, and visibility behavior.
- Preserve the current measured rendering path byte-for-byte where practical.

### `aerobeat-web-assembly`

- Own the `Pose presentation` selector, query policy, applicability filtering, service cadence selection, reset/restart wiring, compact diagnostics, and telemetry downloads.
- Continue routing each new measured pose to input/scoring exactly once before any presentation work.
- Surface selected/effective presentation mode and reset/fallback reason.

### `aerobeat-web-contracts`

- No change expected. Add a contract only if review proves a generic presentation snapshot is needed; predicted data must not masquerade as `NormalizedPoseFrame`.

## Prediction Design

For each landmark present and sufficiently visible in the latest two measured/smoothed frames:

- compute velocity from normalized coordinate delta divided by measured timestamp delta;
- evaluate at current video media time;
- clamp horizon to `[0, 125ms]`;
- clamp output coordinates to `[0, 1]`;
- retain current visibility/confidence with explicit age decay;
- stop prediction for discontinuous, stale, missing, or low-confidence data.

When a new measured frame arrives, compare it with the prediction that would have been produced for that measured timestamp before updating predictor history. Record normalized mean joint correction error and maximum joint correction error. This provides objective error evidence instead of relying only on perceived smoothness.

The initial experiment does not add a second correction-blending algorithm. Existing preview smoothing remains the only visual correction filter so the effect stays attributable and bounded.

## Required Telemetry

Keep every existing measured CV field and add:

- requested/selected/effective pose-presentation mode;
- configured measured submission ceiling and effective measured output rate;
- measured overlay draws versus predicted overlay draws;
- effective predicted-presentation rate;
- latest and rolling prediction horizon p50/p95/max;
- latest and rolling normalized mean/max correction error;
- frozen/stale, low-visibility, clamped, reset, and direction-discontinuity counts;
- measured media-pose delta and output age unchanged;
- estimated inference occupancy per second (`runtime duration × measured output rate`) labeled as an estimate;
- proof that input/scoring routed measured frame count is unchanged by predicted draws.

All rolling evidence windows remain bounded to 120 relevant samples.

## Tasks

### 1. Implement Measured Cadence And Presentation Modes

**Bead:** `aerobeat-web-cv-x85.1`
**Status:** Open / Awaiting plan approval

- Add the reload-persistent three-option dropdown and route normalization.
- Wire 15fps/8fps CV creation through existing serialized service replacement.
- Implement the bounded UI presentation predictor and reset lifecycle.
- Keep measured input/scoring routing isolated and unchanged.
- Add deterministic tests for constant velocity, no motion, direction reversal, horizon expiry, out-of-order timestamps, missing/low-visibility landmarks, coordinate clamp, source/reset lifecycle, correction error, and measured-only routing.
- Expose truthful diagnostics/download telemetry.
- Run coder validation and commit/push in every touched owning repo.

### 2. Matched Desktop And Physical Phone QA

**Bead:** `aerobeat-web-cv-x85.2`
**Status:** Blocked by implementation

Use MediaPipe, GPU-WebGL, Standard thresholds, Fast tracking, Direct-full, the same camera/lighting/position, and fresh reloads for:

1. measured/current cadence;
2. measured/8fps control;
3. predicted-overlay/8fps treatment.

Capture complete 120-measured-estimate packets and inspect:

- stable stance;
- regular movement;
- fast punches and abrupt direction reversal;
- partial occlusion;
- full exit and re-entry;
- start/stop/restart and mode/backend switch reset.

Compare runtime/total cost, effective measured rate, callback gaps, inference occupancy estimate, measured freshness, overlay cadence, prediction horizon/error/clamps/freezes/resets, incomplete frames, input-routing count, and qualitative smoothness/jump/overshoot.

### 3. Independent Audit And Decision

**Bead:** `aerobeat-web-cv-x85.3`
**Status:** Blocked by physical QA

Audit source ownership, measured/scoring isolation, bounded predictor state, timestamp truth, lifecycle resets, telemetry, matched packets, default behavior, commits, plan, and Beads.

Record one decision:

- retain measured/current cadence only;
- retain an experimental predictive option for supported use;
- or promote a reduced-cadence presentation mode in a separate explicitly approved production change.

This experiment itself does not promote or remove a default.

## Recommendation Gate

Prediction earns further consideration only if all are true:

- the 8fps mode materially reduces callback pressure or estimated inference occupancy relative to current cadence;
- predicted presentation is visibly smoother than the measured-8fps control during normal and fast movement;
- correction error, overshoot, occlusion, and re-entry remain bounded and honestly reported;
- measured pose/scoring/input event counts and values match the measured-8fps control exactly;
- no lifecycle, source, timestamp, incomplete-frame, or fallback regression occurs;
- measured freshness is never mislabeled as predicted freshness.

A visually smoother overlay alone is insufficient if prediction hides stale measured data or changes gameplay truth.

## Coder / QA / Auditor Loop

- Coder claims `aerobeat-web-cv-x85.1`, implements across owning repos, validates, commits, and pushes.
- QA claims `aerobeat-web-cv-x85.2` and independently verifies desktop plus physical-phone behavior.
- Auditor claims `aerobeat-web-cv-x85.3`, checks source/evidence/default/ledger truth, and closes only proven work.
- Parent keeps this plan, Beads, and Git aligned.

## Approval Gate

No implementation begins until Derrick approves this plan shape, especially the three-mode dropdown, render-only scoring boundary, 8fps treatment cadence, and 125ms prediction horizon.
