# aerobeat-web-cv

AeroBeat-owned camera and CV singleton boundary for web pose-frame production.

## Responsibility

This repo owns camera permissions, camera lifecycle, live/video/replay frame sources, latest-frame-wins pose-frame orchestration, normalized pose-frame production, and the public CV service boundary consumed by the rest of AeroBeat web.

It remains vendor-agnostic above `aerobeat-web-vendor-movenet`. It does not own MoveNet runtime internals, gameplay-facing input events, UI components, gameplay scoring, renderer output, or assembly wiring.

## Public API Surface

- `src/index.js` exports service constants and a skeleton camera/CV service factory.
- `createAeroCameraCvService()` returns a documented singleton-shaped service stub.
- `aeroCvPerformancePresets` and `getAeroCvPerformancePreset()` expose phone-testable CV workload presets. Direct full remains the default; direct 256/192/160 isolate inference resize on the main thread, while worker variants remain explicitly experimental controls.
- The service produces normalized pose-frame concepts aligned with `@aerobeat/web-contracts`.

## Performance Presets

The current presets are:

- `Direct full (recommended)`: main-thread adapter, browser camera default, full inference input, and no resize.
- `Direct downscale 256`: main-thread adapter, browser camera default, and a 256px-wide canvas resize without worker transfer.
- `Direct downscale 192`: main-thread adapter, browser camera default, and a 192px-wide canvas resize without worker transfer.
- `Direct downscale 160`: main-thread adapter, browser camera default, and a 160px-wide canvas resize without worker transfer.
- `Experimental worker downscale 256`: 720p camera target, 256px-wide downscaled `ImageBitmap`, and worker-preferred transfer control.
- `Experimental worker downscale 192`: 480p camera target, 192px-wide downscaled `ImageBitmap`, and worker-preferred transfer control.
- `Experimental worker downscale 160`: 360p camera target, 160px-wide downscaled `ImageBitmap`, and worker-preferred transfer control.

The four direct presets hold camera constraints and main-thread adapter selection constant so the inference resize is isolated. The worker controls intentionally preserve the earlier camera/downscale/transfer combinations for comparison. The CV service preserves latest-frame-wins scheduling for every preset: if inference is busy, newer samples replace the pending sample instead of queueing stale frames. These diagnostics do not establish a performance winner; physical phone telemetry is required.

`getStatus()` independently reports the selected preset, actual adapter execution location and detail, actual resize path, inference input dimensions, frame preparation/downscale cost, adapter cost, total CV cost, running averages, last submitted sample timestamp and wall-clock age, dropped frame count, and latest pose-output age.

## Adjacent Repos

- `aerobeat-web-vendor-movenet` owns the first MoveNet/TensorFlow.js adapter.
- `aerobeat-web-input` converts normalized pose/body-grid data into Boxing and Flow input events.
- `aerobeat-web-ui` owns camera calibration and debug components.
- `aerobeat-web-performance` will own DPR caps and dynamic quality policy.
- `aerobeat-web-assembly` wires concrete services and secure testbed publishing.

## Allowed Imports

Runtime code may import public exports from `@aerobeat/web-contracts` and public adapter exports from `@aerobeat/web-vendor-movenet`. Do not import sibling `src/internal` folders, testbed files, or vendor-native object graphs into this public service surface.

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
