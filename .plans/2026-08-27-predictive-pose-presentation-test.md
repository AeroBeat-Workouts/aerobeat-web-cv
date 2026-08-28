# Predictive Pose Gameplay Test

**Date:** 2026-08-27
**Status:** Complete / Predicted gameplay rejected for promotion
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

## Current Web Scoring Boundary

There is no `aerobeat-web-gameplay` scorer implementation in the current web polyrepos. `aerobeat-web-input` presently converts pose frames into draft Boxing/Flow gameplay events, and assembly proves/displays that event path. This experiment can therefore establish scoring readiness through held-out landmark accuracy, draft-intent agreement, timing, body-grid agreement, and event-cardinality safety; it cannot truthfully report final points or workout-score parity against a web scorer that does not yet exist. The predicted contract must remain suitable for a future scorer, and any production scoring claim requires a later integration test with that owner.

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
- measured source frame identity, including a route generation/epoch so equal timestamps after restart cannot collide.

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
9. Prediction is emitted only for `0 < horizon <= 125ms`. Beyond the cap, gameplay emits no predicted sample and the overlay freezes on the latest measured pose without rerouting it; it never clamps/replays a synthetic 125ms endpoint indefinitely.
10. Low-visibility or missing landmarks are not extrapolated. Coordinates remain clamped to normalized bounds; displacement clamps and suppressions are telemetered.
11. Occlusion, exit, re-entry, and abrupt direction reversal must not reuse stale velocity.
12. Existing Fast/Smoother measured filtering is identical in all matched modes. Any filter used before prediction is explicit and shared by measured-8 and predicted-8 scoring comparisons.
13. Predicted 30fps routing must not accidentally multiply one-shot gameplay actions. Input/gameplay owns an explicit deduplication or state-transition policy and tests event cardinality.
14. Gameplay target timestamps are strictly monotonic within a route epoch. Every new real measurement updates predictor/correction truth, but a measurement at or behind an already-routed predicted target is not replayed into gameplay; the next newer prediction carries the correction.
15. Unsupported/invalid route values normalize visibly to measured/current cadence.

## Prediction And Gameplay Design

For each sufficiently visible landmark in the latest two measured frames:

- compute normalized velocity from coordinate delta and measured timestamp delta;
- evaluate at current video/gameplay media time;
- emit only when horizon is within `(0, 125ms]` and clamp coordinates to `[0, 1]`;
- preserve confidence with explicit age decay;
- suppress or freeze stale, discontinuous, low-confidence, and missing data.

Before adding each new measurement, compare it with the estimate that the previous predictor state would have produced for that timestamp. Record normalized mean/max joint error and compare the predicted gameplay events with events produced from the real frame.

The input router must define how repeated continuous predicted samples map to gameplay events. Flow cells and state-like intents emit only on semantic transition. Punch-like pulses emit at most once per `(mode, intent, anchor, measurementId)` lineage, so multiple 30fps predictions from one 8fps measurement cannot inflate gameplay events. Stateful histories remain partitioned between Boxing and Flow.

## Offline Gameplay Oracle

Live sequential phone packets alone cannot prove gameplay-input equivalence or future scoring readiness. Add a deterministic replay comparison:

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

The live predicted mode then verifies runtime performance and perceived gameplay behavior; the replay oracle establishes whether predictions are accurate enough at the current input boundary to justify later scorer integration.

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
**Status:** Complete; contracts `3994547`, input `5cea71b`, UI `9da7b30`, assembly `9d2f895` pushed and independently revalidated

- Add the reload-persistent three-option gameplay-source dropdown.
- Wire 15fps/8fps CV creation through serialized service replacement.
- Define measured/predicted routing provenance in contracts.
- Implement bounded prediction and lifecycle resets.
- Route predicted estimates through the experimental gameplay input path.
- Add event deduplication/transition semantics that prevent cadence-driven score inflation.
- Add deterministic oracle tests for constant velocity, no motion, reversals, horizon expiry, out-of-order timestamps, confidence loss, occlusion, re-entry, coordinate clamp, source/reset lifecycle, correction error, held-out event agreement, and default measured compatibility.
- Expose diagnostics/download telemetry.
- Run coder validation and commit/push in every touched repo.

**Design review:** Preserve `routePoseFrame()` byte/event compatibility and add an explicit stateful routing-sample path. Use only media timestamps; suppress horizons above 125ms; partition Boxing/Flow state; invalidate queued prediction ticks by route generation; require two fresh frames after confidence/source/time discontinuity. Highest-risk tests are 30fps pulse cardinality, 125.001ms suppression, clock-domain mismatch, stale callback invalidation, reversal, re-entry, clamp-induced false transitions, and held-out replay intent agreement.

**First-pass review:** Parent rejected the initial uncommitted implementation before landing because it made provenance fields source-breaking, lacked route-generation identity, deduplicated pulse intents forever, evaluated the wrong oracle event path, mislabeled zero-horizon/startup samples, redefined measured freshness, masked reversal with occlusion, rerouted measured fallback at 30fps, and left the compact-phone selector assertion stale. Contracts/input/UI tests passed that first pass, while assembly failed the stale six-control assertion; those shallow passes were not accepted as semantic proof. After that broad corrective pass diagnosed but did not land the repairs, focused coders `3ef0a66f-00fc-47ad-bbf6-931da4934847` and `2b5df44f-e1de-4be9-b4f9-08a7fe44403d` took non-overlapping contracts/input and UI repos; assembly integration waits for their stable APIs.

**Landed UI slice:** `aerobeat-web-ui` commit `9da7b30` preserves measured media-pose freshness, exposes presentation-target delta separately, keeps provenance/measurement/horizon visible, resets transitions safely, and adds browser assertions for predicted, measured-routing, clear, and legacy measured paths. Parent independently reran `npm test`, `npm run test:browser`, and `git diff --check`; all passed with clean pushed parity.

**Landed contracts/input slices:** `aerobeat-web-contracts` commit `3994547` and `aerobeat-web-input` commit `5cea71b` preserve deep legacy frame-event compatibility while adding epoch-qualified routing samples, enriched batch routing with one sample count, per-lineage pulses, semantic state/cell transitions, strict bounded prediction, truthful reset/suppression telemetry, and a stateful held-out oracle. Parent independently reran `npm test`, `npm run test:browser`, and `git diff --check` in both repos; all passed with clean pushed parity.

**Landed assembly slice:** `aerobeat-web-assembly` commit `9d2f895` adds the three-mode persistent selector, compatibility filtering, lifecycle coordinator, measured-once/valid-prediction-only routing, strict monotonic gameplay targets, corrected oracle fixture, bounded diagnostics/download telemetry, and seventh compact control. Parent independently reran `npm test`, `npm run test:browser`, `npm run build-release`, and `git diff --check`; all passed with clean pushed parity.

### 2. Matched Desktop, Replay, And Physical Phone QA

**Bead:** `aerobeat-web-cv-x85.2`
**Status:** Complete; deterministic replay, desktop camera, and six physical-phone CPU/GPU packets captured

Use MediaPipe, GPU-WebGL, Standard thresholds, Fast tracking, Direct-full, matched conditions, and fresh reloads for:

1. measured/current gameplay;
2. measured/8fps gameplay control;
3. predicted/8fps gameplay treatment.

Validate a deterministic held-out measured replay plus physical stable stance, regular movement, fast punches, abrupt reversal, partial occlusion, exit/re-entry, start/stop/restart, and mode/backend reset.

Compare runtime/total cost, measured rate, callback gaps, occupancy estimate, measured freshness, prediction horizon/error, gameplay-event agreement/timing/cardinality, overlay cadence, clamps/freezes/resets, and qualitative gameplay responsiveness.

**Desktop/replay QA:** Evidence is at `docs/telemetry/predictive-pose-desktop-qa-2026-08-27.md` (`7dcba90`). Actual desktop camera confirms 8fps materially improves budget compliance while individual inference remains about 94–99ms; unattended framing truthfully suppressed all incomplete predictions. P0 `aerobeat-web-cv-4ug` then landed matched control/treatment metrics in input `79cabc9` and assembly `5139cf0`. Treatment improves mean joint error by 33.3%, grid agreement by 0.1994, and intent F1 by 0.1156, but regresses p95 error by 0.0402 and timing by 1.7ms, with recall 0.2745 and timing 53.6ms. The bounded oracle decision is `prediction-does-not-improve-control`.

**Physical-phone QA:** Evidence is at `docs/telemetry/predictive-pose-phone-qa-2026-08-27.md`. Six MediaPipe Lite Direct-full packets cover CPU-WASM and GPU-WebGL across all three modes. Reduced cadence lowered estimated inference occupancy from 829 to 568–586ms/s on CPU and 780 to 531–546ms/s on GPU, but both predicted runs emitted zero predictions because every measured sample failed the predictor's complete-confidence readiness gate. Suppression was safe and truthful, yet the path functioned as reduced-cadence measured input. Derrick reported that none of the new tests felt better than baseline and would not move forward; MediaPipe Lite measured/current remains the best experience.

### 3. Independent Audit And Decision

**Bead:** `aerobeat-web-cv-x85.3`
**Status:** Complete; independent audit confirms rejection and preservation of the measured/current production baseline

Audit measured/predicted provenance, scoring/event correctness, deduplication, predictor bounds/resets, timestamp truth, replay oracle, matched packets, default compatibility, source ownership, commits, plan, and Beads.

Record one decision:

- reject predicted gameplay;
- retain it as an experiment;
- or propose a separate production promotion plan.

This plan itself does not promote a default.

## Recommendation Gate

Predicted gameplay earns further consideration only if all are true:

- 8fps materially reduces callback pressure or estimated inference occupancy;
- predicted landmark and gameplay-intent agreement materially improves over measured-8fps in the held-out replay comparison;
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

Derrick approved this revised gameplay-scoring design for execution, including:

- three gameplay-source modes;
- predicted estimates entering the experimental gameplay/input path;
- measured/predicted provenance contracts;
- 8fps measured cadence;
- 125ms maximum horizon;
- event deduplication and held-out replay scoring oracle.

## Final Audit And Result

The independent audit verified contracts `3994547`, input `5cea71b` and `79cabc9`, UI `9da7b30`, assembly `9d2f895` and `5139cf0`, and CV evidence through `ec3fba8`. All five repositories were clean and aligned with `origin/main`. Contracts, input, UI, and CV passed `npm test`, `npm run test:browser`, and `git diff --check`; assembly also passed `npm run build-release`.

Audit conclusions:

- measured/current remains the default, recommended, legacy event-for-event path at the unchanged 15fps ceiling;
- both 8fps modes remain explicitly labeled experimental, query-selected, and restricted to MediaPipe Direct-full; incompatible or invalid selections fall back visibly to measured;
- predicted routing uses a distinct provenance contract, strict `0 < horizon <= 125ms`, lifecycle epochs, two-fresh-complete-frame readiness, reset/suppression rules, monotonic targets, per-lineage pulse deduplication, semantic transition routing, and freeze-without-reroute behavior;
- measured freshness and presentation-target alignment remain separate, and neither runtime nor evidence presents predicted data as measured CV output;
- the matched oracle truthfully recommends `prediction-does-not-improve-control`: mean error, grid agreement, precision, recall, and F1 improve, but p95 error and transition timing regress and treatment recall remains below its declared floor;
- six physical-phone packets confirm reduced 8fps occupancy but zero emitted predictions on both CPU-WASM and GPU-WebGL because every measured sample failed predictor completeness; suppression was safe, but the predicted mode provided no physical gameplay benefit;
- Derrick reported no experimental mode felt better than the baseline and chose not to continue; MediaPipe Lite measured/current remains the best experience;
- all metrics are gameplay-input scoring-readiness proxies only. No point or workout-score parity is claimed because no web gameplay scorer exists.

**Decision: reject predicted gameplay for production promotion.** The landed selector modes remain non-default experimental diagnostics and do not change production behavior. Any future predictor revision, confidence-readiness change, promotion, or cleanup/removal requires a separate approved plan.
