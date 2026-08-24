# aerobeat-web-cv

AeroBeat-owned camera and CV singleton boundary for web pose-frame production.

## Responsibility

This repo owns camera permissions, camera lifecycle, live/video/replay frame sources, latest-frame-wins pose-frame orchestration, normalized pose-frame production, and the public CV service boundary consumed by the rest of AeroBeat web.

It remains vendor-agnostic above `aerobeat-web-vendor-movenet`. It does not own MoveNet runtime internals, gameplay-facing input events, UI components, gameplay scoring, renderer output, or assembly wiring.

## Public API Surface

- `src/index.js` exports service constants and a skeleton camera/CV service factory.
- `createAeroCameraCvService()` returns a documented singleton-shaped service stub.
- The service produces normalized pose-frame concepts aligned with `@aerobeat/web-contracts`.

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
