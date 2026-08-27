# Predictive Pose Gameplay Desktop QA

**Date:** 2026-08-27
**QA Bead:** `aerobeat-web-cv-x85.2`
**Status:** Deterministic and desktop integration pass; physical full-body/phone evidence pending

## Verified commits

- `aerobeat-web-contracts` `3994547` — predictive pose routing contracts
- `aerobeat-web-input` `5cea71b` — stateful predictive pose routing and oracle
- `aerobeat-web-ui` `9da7b30` — truthful predicted presentation telemetry
- `aerobeat-web-assembly` `9d2f895` — three-mode gameplay-source assembly

All four repositories were clean and aligned with `origin/main` before and after QA.

## Automated gates

Passed independently:

- contracts: `npm test`, `npm run test:browser`, `git diff --check`
- input: `npm test`, `npm run test:browser`, `git diff --check`
- UI: `npm test`, `npm run test:browser`, `git diff --check`
- assembly: `npm test`, `npm run test:browser`, `npm run build-release`, `git diff --check`

Assembly release `0.0.23` built successfully with MediaPipe, MoveNet, ONNX Runtime, worker assets, and `release/raw/0.0.23/aerobeat-release-proof.json`.

The deterministic suites prove:

- legacy measured event deep compatibility;
- optional additive provenance and distinct measured/predicted routing samples;
- strict `0 < horizon <= 125ms`, including `125.001ms` suppression;
- two-fresh-frame readiness after confidence/source/time/reversal resets;
- lifecycle epoch collision safety;
- per-measurement pulse cardinality and semantic state/cell transitions;
- Boxing/Flow mode isolation and one-count batch routing;
- measured-once routing, superseded-measurement updates, unique monotonic prediction targets, stale lifecycle rejection, and freeze-without-events;
- reload query persistence and incompatible backend/downscale normalization;
- 15fps current versus 8fps reduced-cadence configuration;
- separate measured media-pose freshness and presentation-target delta;
- seven-control compact phone layout and telemetry-download field coverage;
- independently represented reversal, occlusion, and re-entry fixture segments.

## Held-out replay oracle

The pushed deterministic trace produced:

| Metric | Result |
|---|---:|
| Reference frames | 61 |
| 8fps measured frames | 13 |
| Held-out predictions | 32 |
| Suppressed predictions | 16 |
| Normalized mean joint error | 0.0252 |
| Normalized p95/max joint error | 0.1610 / 0.1610 |
| Wrist/nose and all-grid agreement | 0.9063 / 0.9063 |
| Draft-intent precision | 0.8077 |
| Draft-intent recall | 0.2745 |
| Transition timing mean error | 53.6ms |
| False repeated events | 0 |

This is gameplay-input scoring readiness only. No web gameplay scorer exists, so the packet does not prove points or workout-score parity.

### QA defect

The oracle reports predicted-treatment agreement but does not report a matched measured-8 control or prediction-minus-control deltas. It therefore cannot yet prove the plan's required claim that prediction materially improves gameplay input over measured 8fps. The current predicted intent recall is also only `0.2745`; range-only assertions do not establish usefulness.

Filed as `aerobeat-web-cv-4ug`: **Add measured-8 control metrics to predictive oracle**.

## Live desktop camera smoke

Environment:

- actual host camera devices `/dev/video0`–`/dev/video3`;
- headless Chromium with real camera permission, not the fake-media fixture;
- MediaPipe Pose Landmarker Lite float16 `/1/`;
- GPU-WebGL, Direct full, Standard thresholds, Fast tracking;
- local Vite route `http://127.0.0.1:5173/`;
- fresh context per mode, approximately 15 seconds each.

### Measured / current cadence

- selected/effective source: `measured`;
- target/effective submission: `15fps / 9fps`;
- pose output: `10fps`;
- adapter/total p50/p95: `95/100ms`;
- timing-window budget: `67ms`; over budget `118/118`;
- measured gameplay samples: `118`; predicted `0`;
- provenance measured, horizon `0ms`;
- no incomplete seven-landmark frames or dropped frames.

### Measured / 8fps

- selected/effective source: `measured-8`;
- target/effective submission: `8fps / 7fps`;
- pose output: `8fps`;
- adapter/total p50/p95: `94/99ms`;
- timing-window budget: `125ms`; over budget `1/83`;
- measured gameplay samples: `83`; predicted `0`;
- provenance measured, horizon `0ms`;
- no browser console errors, incomplete seven-landmark frames, or dropped frames.

### Predicted gameplay / 8fps

- selected/effective source: `predicted-8`;
- target/effective submission: approximately `8fps / 6fps`;
- pose output: `8fps`;
- adapter/total p50/p95: `94/99ms`;
- timing-window budget: `125ms`; over budget `1/81`;
- measured gameplay samples: `81`; predicted `0`;
- no browser console errors or dropped frames.

The unattended camera view did not contain a complete sufficiently confident seven-landmark person. Predictor telemetry truthfully recorded each measurement as incomplete (`46/46` in a focused 10-second packet), advanced/reset its route generation, emitted no predictions, and retained measured provenance. This proves safe suppression and no false predicted gameplay, but it does not prove predicted smoothness or gameplay responsiveness with a visible moving player.

## Desktop conclusion

Reduced 8fps cadence materially improved budget compliance and reduced inference duty; it did not improve per-inference latency. Structural prediction safety, provenance, lifecycle, monotonicity, and suppression passed. Prediction usefulness is not established because:

1. the replay oracle lacks a matched measured-8 control and has low predicted intent recall;
2. the unattended live camera could not provide full-body stable/movement/reversal/occlusion/re-entry evidence;
3. physical phone testing is still pending.

Do not promote predicted gameplay or claim scoring benefit from this desktop packet.

## Remaining QA

- repair/extend oracle under `aerobeat-web-cv-4ug` and compare measured-8 versus predicted-8 on the same trace;
- operator-assisted desktop or phone capture with a full visible player performing stable motion, fast reversal, occlusion, exit, and re-entry;
- matched physical-phone telemetry packets for all three modes;
- qualitative gameplay responsiveness review after predictions are actually emitted.
