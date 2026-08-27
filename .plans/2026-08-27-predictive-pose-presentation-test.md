# Predictive Pose Gameplay Test

**Date:** 2026-08-27
**Status:** Draft / Revised For Gameplay Scoring / Awaiting Derrick Approval
**Agent:** cookie
**Umbrella Bead:** `aerobeat-web-cv-x85`
**Implementation Bead:** `aerobeat-web-cv-x85.1`
**Physical QA Bead:** `aerobeat-web-cv-x85.2`
**Final Audit Bead:** `aerobeat-web-cv-x85.3`
**Clarification:** Derrick rejected a render-only experiment as insufficient; the predicted treatment must be testable as an actual gameplay-input/scoring source.

## Goal

Determine whether reducing synchronous MediaPipe inference to 8fps and producing short-horizon predicted pose estimates between measurements can reduce browser main-thread pressure while preserving useful gameplay-input/scoring timing and accuracy. The explicit predicted mode drives both overlay presentation and the experimental gameplay input route. Production measured scoring, model/provider/default selection, and adapter output truth remain unchanged outside that selected mode.

## Why This Experiment

The completed worker experiment proved that moving MediaPipe off-thread improves browser callback cadence but worsens total CV latency and pose freshness. Direct-full GPU-WebGL remains best at 62/72ms total p50/p95 on the moto g power, but approximately 62ms of synchronous work at 11–12 outputs per second can occupy most of each second on the main thread.

An 8fps ceiling targets roughly one-third fewer inference calls. Prediction is worthwhile only if those estimates remain accurate enough to drive gameplay between real measurements—not merely make the debug skeleton look smoother.

Individual MediaPipe inference cost will remain approximately unchanged. The candidate benefit is lower inference duty plus useful intermediate gameplay samples.

## References

- `.plans/2026-08-27-mediapipe-worker-mobile-test.md`
- `docs/telemetry/mediapipe-videoframe-mobile-moto-g-power-2026-08-27.md`
- `aerobeat-web-cv/src/index.js` — measured sampling, latest-frame-wins, configurable `submissionCadenceTargetFps`
- `aerobeat-web-assembly/src/index.js` — measured pose routing and 30fps runtime lane
- `aerobeat-web-input/src/index.js` — pose-to-Boxing/Flow gameplay input conversion
- `aerobeat-web-contracts/src/pose-shapes.js` and `input-shapes.js` — measured pose and gameplay-event truth
- `aerobeat-web-ui/src/elements/aero-media-pose-preview/aero-media-pose-preview.js` — measured smoothing and overlay

## Experiment Modes

Add a separate reload-persistent **Pose gameplay source** dropdown:

1. **Measured / current cadence (recommended)**
   - Existing 15fps submission ceiling.
   - Overlay and gameplay input both consume measured adapter frames.
   - Unchanged production/default behavior.
2. **Experimental measured / 8fps**
   - Direct-full main-thread MediaPipe with an 8fps submission ceiling.
   - Overlay and gameplay input consume only measured 8fps frames.
   - Isolates reduced inference duty and the unassisted gameplay degradation.
3. **Experimental predicted gameplay / 8fps**
   - Identical 8fps measured inference workload.
   - Two measured poses generate bounded predicted estimates between measurements.
   - Predicted estimates drive both overlay and an explicitly experimental gameplay-input route at the runtime cadence.
   - Every generated gameplay event carries measured/predicted provenance.

Persist selection in a route parameter such as `poseGameplaySource=measured|measured-8|predicted-8`. Reload must reproduce the selection exactly. Live switching resets CV, predictor, input, and comparison state through serialized lifecycle handling; every evidence packet begins after a reload.

The experimental modes apply only to MediaPipe Direct-full main-thread execution. An incompatible backend, worker preset, or downscale preset visibly resets to measured/current cadence.

## Pose Provenance Contract

A predicted estimate must not masquerade as a measured `NormalizedPoseFrame`. Add the smallest generic contract needed for gameplay routing, for example an `AeroPoseRoutingSample` containing:

- normalized source/mirror/landmark data;
- target gameplay/media timestamp;
- provenance `measured` or `predicted`;
- latest real measurement timestamp;
- prediction horizon;
- measured source frame identity.

Measured adapters and the CV service continue producing the existing `NormalizedPoseFrame` unchanged. Assembly wraps measured outputs for gameplay routing. The predictor emits a separate predicted routing sample. Input events propagate additive provenance, measurement timestamp, and horizon so gameplay/scoring and telemetry can distinguish real from estimated data.

If a cleaner contract shape emerges during coder review, it may replace this example, but the measured/predicted distinction and timestamps are mandatory.

## Non-Negotiable Truth Invariants

1. Measured/current cadence remains the default and recommended gameplay source.
2. Vendor adapters and CV latest output remain measured-only and unchanged.
3. Predicted estimates enter gameplay/input only in the explicitly selected `predicted-8` mode.
4. Every routed sample and gameplay event truthfully reports measured or predicted provenance.
5. Predicted target timestamp, latest measurement timestamp, and horizon remain separate; prediction cannot make measured freshness appear lower.
6. The predictor retains at most two consecutive measured landmark sets. There is no prediction queue.
7. Source, mirror, backend, camera, tracking profile, mode, stop, restart, dispose, missing landmarks, and timestamp discontinuities reset predictor and input comparison state.
8. Prediction requires two ordered frames from the same source and a complete seven-landmark set.
9. Prediction horizon is capped at 125ms. Once stale beyond the cap, gameplay falls back to the latest measured pose state or suppresses predicted events according to one explicit tested policy; it never extrapolates indefinitely.
10. Low-visibility or missing landmarks are not extrapolated. Coordinates remain clamped to normalized bounds; displacement clamps and suppressions are telemetered.
11. Occlusion, exit, re-entry, and abrupt direction reversal must not reuse stale velocity.
12. Existing Fast/Smoother measured filtering is identical in all matched modes. Any filter used before prediction is explicit and shared by measured-8 and predicted-8 scoring comparisons.
13. Predicted 30fps routing must not accidentally multiply one-shot gameplay actions. Input/gameplay owns an explicit deduplication or state-transition policy and tests event cardinality.
14. Unsupported/invalid route values normalize visibly to measured/current cadence.

## Prediction And Gameplay Design

For each sufficiently visible landmark in the latest two measured frames:

- compute normalized velocity from coordinate delta and measured timestamp delta;
- evaluate at current video/gameplay media time;
- clamp horizon to `[0, 125ms]` and coordinates to `[0, 1]`;
- preserve confidence with explicit age decay;
- suppress or freeze stale, discontinuous, low-confidence, and missing data.

Before adding each new measurement, compare it with the estimate that the previous predictor state would have produced for that timestamp. Record normalized mean/max joint error and compare the predicted gameplay events with events produced from the real frame.

The input router must define how repeated continuous predicted samples map to gameplay events. State-like intents may update at runtime cadence; one-shot intents must be edge-triggered or deduplicated so increasing route cadence does not inflate scoring.

## Offline Gameplay Oracle

Live sequential phone packets alone cannot prove scoring equivalence. Add a deterministic replay comparison:

1. capture or use a timestamped full-cadence measured pose trace;
2. treat the full measured trace and its routed gameplay events as the reference;
3. downsample the same trace to the proposed 8fps measurement schedule;
4. predict at the omitted reference timestamps;
5. compare predicted landmarks and routed gameplay events with held-out measured truth.

Report:

- normalized per-joint mean and p95 error;
- wrist/nose and body-grid cell agreement;
- Boxing/Flow intent precision, recall, and transition timing error;
- false one-shot/repeated-event counts;
- occlusion/exit/re-entry suppression behavior.

The live predicted mode then verifies runtime performance and perceived gameplay behavior; the replay oracle establishes whether predictions are accurate enough for scoring.

## Proposed Ownership

### `aerobeat-web-cv`

- Own measured sampling and latest-frame-wins truth only.
- Use the existing `submissionCadenceTargetFps` option for 15fps versus 8fps.
- Add deterministic cadence/trace export support only if existing public measured status is insufficient.
- Do not emit predicted frames.

### `aerobeat-web-contracts`

- Own the generic measured/predicted gameplay-routing provenance shape and additive input-event provenance.
- Preserve existing measured frame compatibility.

### `aerobeat-web-input`

- Accept truthfully tagged gameplay-routing samples.
- Define continuous-state versus one-shot deduplication semantics.
- Preserve existing measured behavior in default mode.
- Provide deterministic measured-versus-predicted event comparison helpers/tests.

### `aerobeat-web-ui`

- Render the selected measured/predicted gameplay pose and expose presentation diagnostics.
- Keep current measured rendering behavior unchanged in default mode.

### `aerobeat-web-assembly`

- Own dropdown/query policy, applicability filtering, CV cadence selection, predictor lifecycle, measured/predicted routing selection, shadow comparison telemetry, compact diagnostics, and downloads.
- Route only the selected source into the visible gameplay path while retaining reference comparison metrics.

## Required Telemetry

Keep existing CV fields and add:

- requested/selected/effective gameplay pose source;
- configured/effective measured submission and output rate;
- measured and predicted gameplay sample counts/rates;
- measured and predicted routed event counts by intent;
- latest measurement age and prediction horizon separately;
- rolling prediction horizon p50/p95/max;
- rolling normalized mean/max joint correction error;
- held-out wrist/nose/body-grid agreement;
- gameplay intent precision/recall and transition timing error where reference truth exists;
- deduplicated and suppressed repeated-event counts;
- frozen/stale, low-visibility, clamped, reset, and discontinuity counts;
- callback gaps, overlay cadence, and estimated inference occupancy per second;
- proof that default measured mode remains byte-for-byte/event-for-event compatible.

Rolling runtime windows remain bounded to 120 relevant samples.

## Tasks

### 1. Implement Cadence, Prediction, And Gameplay Provenance

**Bead:** `aerobeat-web-cv-x85.1`
**Status:** Open / Awaiting revised plan approval

- Add the reload-persistent three-option gameplay-source dropdown.
- Wire 15fps/8fps CV creation through serialized service replacement.
- Define measured/predicted routing provenance in contracts.
- Implement bounded prediction and lifecycle resets.
- Route predicted estimates through the experimental gameplay input path.
- Add event deduplication/transition semantics that prevent cadence-driven score inflation.
- Add deterministic oracle tests for constant velocity, no motion, reversals, horizon expiry, out-of-order timestamps, confidence loss, occlusion, re-entry, coordinate clamp, source/reset lifecycle, correction error, held-out event agreement, and default measured compatibility.
- Expose diagnostics/download telemetry.
- Run coder validation and commit/push in every touched repo.

### 2. Matched Desktop, Replay, And Physical Phone QA

**Bead:** `aerobeat-web-cv-x85.2`
**Status:** Blocked by implementation

Use MediaPipe, GPU-WebGL, Standard thresholds, Fast tracking, Direct-full, matched conditions, and fresh reloads for:

1. measured/current gameplay;
2. measured/8fps gameplay control;
3. predicted/8fps gameplay treatment.

Validate a deterministic held-out measured replay plus physical stable stance, regular movement, fast punches, abrupt reversal, partial occlusion, exit/re-entry, start/stop/restart, and mode/backend reset.

Compare runtime/total cost, measured rate, callback gaps, occupancy estimate, measured freshness, prediction horizon/error, gameplay-event agreement/timing/cardinality, overlay cadence, clamps/freezes/resets, and qualitative gameplay responsiveness.

### 3. Independent Audit And Decision

**Bead:** `aerobeat-web-cv-x85.3`
**Status:** Blocked by QA

Audit measured/predicted provenance, scoring/event correctness, deduplication, predictor bounds/resets, timestamp truth, replay oracle, matched packets, default compatibility, source ownership, commits, plan, and Beads.

Record one decision:

- reject predicted gameplay;
- retain it as an experiment;
- or propose a separate production promotion plan.

This plan itself does not promote a default.

## Recommendation Gate

Predicted gameplay earns further consideration only if all are true:

- 8fps materially reduces callback pressure or estimated inference occupancy;
- predicted scoring materially improves over measured-8fps in the held-out replay comparison;
- key gameplay intents/cells have acceptable precision, recall, transition timing, and no cadence-driven score inflation;
- fast reversal, occlusion, exit, and re-entry do not produce unsafe stale actions;
- live gameplay feels at least as responsive as measured/current cadence;
- no lifecycle, source, timestamp, incomplete-frame, or fallback regression occurs;
- default measured behavior remains unchanged and prediction provenance is always visible.

A smoother overlay alone is explicitly insufficient.

## Coder / QA / Auditor Loop

- Coder claims `aerobeat-web-cv-x85.1`, implements across owning repos, validates, commits, and pushes.
- QA claims `aerobeat-web-cv-x85.2` and verifies replay, desktop, and physical-phone gameplay behavior.
- Auditor claims `aerobeat-web-cv-x85.3`, checks scoring/source/evidence/default/ledger truth, and closes only proven work.
- Parent keeps plan, Beads, and Git aligned.

## Approval Gate

No implementation begins until Derrick approves this revised gameplay-scoring design, especially:

- three gameplay-source modes;
- predicted estimates entering the experimental gameplay/input path;
- measured/predicted provenance contracts;
- 8fps measured cadence;
- 125ms maximum horizon;
- event deduplication and held-out replay scoring oracle.
