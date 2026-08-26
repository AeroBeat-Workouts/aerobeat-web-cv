# aerobeat-web-cv

AeroBeat-owned camera and CV singleton boundary for web pose-frame production.

## Responsibility

This repo owns camera permissions, camera lifecycle, live/video/replay frame sources, latest-frame-wins pose-frame orchestration, normalized pose-frame production, and the public CV service boundary consumed by the rest of AeroBeat web.

It consumes the vendor-neutral `AeroPoseAdapter` contract from `@aerobeat/web-contracts` and has no runtime dependency on a concrete pose vendor. It does not own vendor runtime internals, backend-selection policy, gameplay-facing input events, UI components, gameplay scoring, renderer output, or assembly wiring.

## Public API Surface

- `src/index.js` exports service constants and the camera/CV service factory.
- `createAeroCameraCvService()` injects one generic `AeroPoseAdapter`, plus an optional fallback adapter and assembly-owned requested/selected backend IDs.
- `stop()` pauses frame production but retains adapter resources so camera-device changes can restart the same service. `dispose()` is terminal: it cancels work, waits out in-flight estimates, disposes selected/fallback adapters, and rejects later starts.
- `createAeroCvMockPoseAdapter()` and `createAeroCvReplayPoseSource()` provide a CV-owned deterministic fallback without importing a vendor package. The historical replay source ID and `createReplayPoseFrame()` output remain compatible.
- `aeroCvPerformancePresets` and `getAeroCvPerformancePreset()` expose phone-testable CV workload presets. Direct full remains the default; direct 256/192/160 isolate inference resize on the main thread, while worker variants remain explicitly experimental controls.
- Every adapter output remains the existing `NormalizedPoseFrame` scoring truth from `@aerobeat/web-contracts`.

## Performance Presets

The current presets are:

- `Direct full (recommended)`: main-thread adapter, browser camera default, full inference input, and no resize.
- `Direct downscale 256`: main-thread adapter, browser camera default, and a 256px-wide canvas resize without worker transfer.
- `Direct downscale 192`: main-thread adapter, browser camera default, and a 192px-wide canvas resize without worker transfer.
- `Direct downscale 160`: main-thread adapter, browser camera default, and a 160px-wide canvas resize without worker transfer.
- `Experimental worker downscale 256`: 720p camera target, 256px-wide downscaled `ImageBitmap`, and worker-preferred transfer control.
- `Experimental worker downscale 192`: 480p camera target, 192px-wide downscaled `ImageBitmap`, and worker-preferred transfer control.
- `Experimental worker downscale 160`: 360p camera target, 160px-wide downscaled `ImageBitmap`, and worker-preferred transfer control.

The four direct presets hold camera constraints and main-thread adapter selection constant so the inference resize is isolated. The worker controls intentionally preserve the earlier camera/downscale/transfer combinations for comparison. Derrick's phone comparison selected Direct full as the measured and perceived responsiveness/stability baseline, so it remains the default.

The CV service samples at a maximum 15 submissions per second, preferring `HTMLVideoElement.requestVideoFrameCallback()` so only newly presented video frames are considered. Browsers without it use a tested `requestAnimationFrame()` fallback (and a timer only when neither browser primitive exists). Latest-frame-wins remains mandatory for every preset: while inference is busy there is at most one pending sample, and a newer eligible sample replaces it rather than creating a stale queue. The 15fps value is a submission ceiling, not a claim that any backend produces 15 poses per second. A restartable `stop()` clears queued work but lets the one already accepted estimate commit before the stop resolves; terminal `dispose()` invalidates in-flight generations so late results cannot become latest output.

`getStatus()` reports requested/selected/effective backend and vendor IDs; selected/effective model and runtime identity; adapter capabilities; generic execution location/provider/detail/fallback/load/estimate/runtime-inference/postprocess telemetry; the selected preset and resize path; inference dimensions; preparation, adapter, and total CV costs and lifetime averages; sampling primitive and configured ceiling; effective submission/output rates; source timestamps and ages; dropped frames; fallback identity; and errors. CV reads `getExecutionTelemetry()` first and temporarily recognizes legacy MoveNet `getExecutionStatus()` while that additive vendor update lands.

For optimization evidence, status also exposes a fixed 120-completed-estimate timing window: adapter and total-CV nearest-rank p50/p95/max, the per-estimate budget derived from the submission ceiling, count strictly over that budget, and count of successful estimates that returned other than seven landmarks. Retained durations and the exposed budget use the same disclosed 0.1ms precision, and strict over-budget classification compares those reported values so visibly equal totals and budgets are never contradictory. The bounded window evicts oldest estimates, excludes failed estimates, and persists through ordinary `stop()`/restart and terminal `dispose()` for final inspection, matching the existing service-lifetime averages. Constructing a new service resets both lifetime and rolling diagnostics. These metrics are observational only and do not change sampling or latest-frame-wins behavior.

## Adjacent Repos

- `aerobeat-web-contracts` owns `AeroPoseAdapter` and `NormalizedPoseFrame`.
- `aerobeat-web-vendor-movenet`, `aerobeat-web-vendor-mediapipe`, and `aerobeat-web-vendor-onnxruntime` own concrete adapters.
- `aerobeat-web-input` converts normalized pose/body-grid data into Boxing and Flow input events.
- `aerobeat-web-ui` owns camera calibration and debug components.
- `aerobeat-web-performance` will own DPR caps and dynamic quality policy.
- `aerobeat-web-assembly` wires concrete services and secure testbed publishing.

## Allowed Imports

Runtime code may import public contracts from `@aerobeat/web-contracts`; it must not import concrete vendor packages. Assembly injects adapters through the structural contract. Do not import sibling `src/internal` folders, testbed files, or vendor-native object graphs into this public service surface.

## Testbed Shape

CV testbed scenes must cover live camera, video feed, and replay feed expectations so all sources can drive the same input path later. Visible scene UI must be composed from `aero-*` components supplied by `aerobeat-web-ui`, not one-off local controls.

Generated `.testbed/node_modules/@aerobeat/web-this-repo` is local state and must be recreated with:

```bash
npm run testbed:link-self
```

Do not commit installed `node_modules` folders or generated testbed symlinks.

## Validation

Run before handoff:

```bash
npm run check
npm test
npm run test:browser
```

The current validators are placeholder-level checks for JSDoc/no-escape posture, public import boundaries, component-only scenes, and console-noise expectations.

## Documentation Handoff

Keep repo-local decisions in `docs/decisions/`. Public contributor docs belong in `aerobeat-web-docs` after the CV boundary is accepted.
