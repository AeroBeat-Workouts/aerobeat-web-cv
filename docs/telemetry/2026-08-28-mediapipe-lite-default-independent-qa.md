# MediaPipe Lite Default Lock — Independent QA Evidence

**Date:** 2026-08-28  
**QA Bead:** `aerobeat-web-cv-y05` (left `in_progress` for independent audit handoff)  
**CV commits inspected:** `2abc211`, plan handoff `3941171`  
**Assembly commit inspected:** `37dd31e`

## Result

PASS with one pre-existing, non-blocking dependency-health diagnostic: assembly `npm ls --all` proves the intended concrete pose graph but exits `1` because the local-link tree reports `@aerobeat/web-input -> @aerobeat/web-contracts@0.0.0` as unmet. Optional platform/package omissions are also printed. Product tests, browser fixtures, release build, boundary checks, release scans, and byte claims passed.

## Independent validation gates

Run from clean pushed `main` checkouts:

| Repository | Gate | Observation |
| --- | --- | --- |
| `aerobeat-web-cv` | `npm test` | PASS: JSDoc, vendor-neutral dependency/import boundary, component, console-noise placeholder, and CV live inference service checks passed. |
| `aerobeat-web-cv` | `npm run test:browser` | PASS: current CV browser gate is explicitly a console-noise placeholder. |
| `aerobeat-web-cv` | `git diff --check` | PASS, no output. |
| `aerobeat-web-assembly` | `npm test` | PASS: MediaPipe-only import boundary, real Playwright console fixture, cadence, backend registry, gameplay source, and predictive routing checks passed. |
| `aerobeat-web-assembly` | `npm run test:browser` | PASS: Playwright fixture completed against a transient Vite URL with no unexpected page error/warning. |
| `aerobeat-web-assembly` | `npm run build-release` | PASS: 48 modules transformed; clean raw proof regenerated. |
| `aerobeat-web-assembly` | `git diff --check` | PASS, no output. |

Both repositories were `main...origin/main` and clean before evidence edits. Assembly remained clean after its ignored release proof was regenerated.

## Browser observations

The assembly browser gate uses real Chromium/Playwright, a captured canvas camera stream, live MediaPipe inference, and actual shadow-DOM controls/status. It processed advancing live frames, reported MediaPipe GPU/WebGL execution and a 15fps submission target, and rejected unexpected console/page errors.

A separate independent Chromium fixture captured the following visible control and status truth:

- No query: one backend option, `MediaPipe Pose Landmarker Lite`; provider `MediaPipe GPU / WebGL`; tuning `Standard (0.5 / 0.5 / 0.5)`; tracking `fast`; performance `Direct full (recommended) - main thread / camera default / full input / no resize`; gameplay source `measured`.
- No-query status: selected/effective vendor `mediapipe`; selected/effective model `mediapipe/pose-landmarker-lite@float16/1 via @mediapipe/tasks-vision@1.0.1`; requested/selected provider `gpu-webgl`; Standard thresholds `0.5 / 0.5 / 0.5`; main-thread synchronous WebGL execution; sample target `15fps`; tracking `fast`.
- Reloading the no-query route reproduced the same values.
- `?poseBackend=movenet&poseProvider=webgl`: controls visibly selected MediaPipe/GPU, while status retained requested values and showed `unsupported backend movenet; using mediapipe; unsupported provider webgl for mediapipe; using gpu-webgl`.
- `?poseBackend=onnxruntime&poseProvider=webgpu`: controls visibly selected MediaPipe/GPU, while status retained requested values and showed the equivalent ONNX/WebGPU normalization warning.
- `?poseBackend=mediapipe&poseProvider=cpu-wasm`: provider visibly selected `MediaPipe CPU / WASM (diagnostic)` and status showed requested/selected `cpu-wasm` with `MediaPipe Tasks Vision CPU delegate via synchronous WASM`. GPU remained the no-query default.
- The committed Playwright fixture also proves URL-backed reload persistence for an explicitly selected gameplay route and live MediaPipe operation through the camera fixture.

### CV-owned fallback truth

Assembly imports `createAeroCvMockPoseAdapter` from `@aerobeat/web-cv` and injects it as `fallbackPoseAdapter`; no concrete fallback vendor is imported. CV unit validation forces the selected adapter to fail and proves `fallbackActive: true`, `sourceKind: replay-fixture`, fallback source identity, selected-versus-effective vendor divergence, and `adapterExecutionFallback: true`.

The idle browser fixture separately reports `source replay-fixture aero.cv.replay-fixture` and `fallback false`, which is truthful because the deterministic startup replay frame is the initial fixture, not an adapter failure. The visible pose-flow fixture still carries historical compatibility ID `aero.movenet.replay.basic-upper-body`; this is a CV-owned constant/data fixture, not a MoveNet runtime or dependency.

## Concrete runtime and release audit

- CV `package.json`, `package-lock.json`, and `npm ls --all` contain only `@aerobeat/web-contracts`; no concrete pose package exists.
- Assembly `package.json` declares exactly one concrete vendor: `@aerobeat/web-vendor-mediapipe`.
- Assembly lock records only that vendor, whose dependency is `@mediapipe/tasks-vision` `1.0.1`. There are no MoveNet vendor, TensorFlow pose, ONNX Runtime, ONNX model, or related package-lock records.
- Assembly `npm ls --all` shows `@aerobeat/web-vendor-mediapipe -> @mediapipe/tasks-vision@1.0.1` as the only concrete pose runtime. Its exit-1 local-link peer diagnostic is recorded above.
- Clean release inventory contains exactly: `index.html`, `assets/index.css`, `assets/index.js`, both source maps, `assets/mediapipe-worker.js`, `assets/vision_bundle-CAb2dpSo.js`, and `aerobeat-release-proof.json`.
- Runtime asset inventory has three JavaScript files and zero emitted WASM files. There is no model directory, ONNX file, MoveNet/TensorFlow pose chunk, ONNX Runtime chunk, or ONNX WASM asset.
- The MediaPipe Tasks Vision bundle contains generic WASM loader strings because explicit CPU-WASM remains supported and resolves MediaPipe WASM from the configured Tasks Vision CDN. No WASM binary is emitted in this release.
- The release JS/maps retain historical query strings and the CV-owned compatibility fixture ID so old URLs normalize visibly and replay data remains compatible. Searches for concrete forbidden runtime signatures (`@tensorflow-models/pose-detection`, `onnxruntime-web`, `createMoveNetPoseAdapter`, `createOnnxRuntimePoseAdapter`) are negative; the release builder enforces those signatures plus forbidden asset names.

## Byte claim reproduction

The pre-change release was independently rebuilt from assembly parent commit `5139cf0` in a detached temporary worktree. Its own ONNX preparation command verified/copied the 13,350,364-byte model, and its release build emitted MoveNet/TensorFlow pose chunks, two ONNX Runtime WASM binaries (25,749,873 and 27,797,172 bytes), ONNX Runtime JS, source maps, and the model. Summed regular-file bytes were exactly **101,275,193**.

The clean `37dd31e` release was independently rebuilt and summed at exactly **1,505,838** bytes including its 1,069-byte proof manifest. The builder's pre-manifest field is **1,504,769** bytes.

- Reduction: `101,275,193 - 1,505,838 = 99,769,355` bytes.
- Percentage: `99,769,355 / 101,275,193 * 100 = 98.513122557...%`, correctly rounded to **98.51%**.

The detached worktree was removed after measurement; the ONNX vendor and assembly repositories were clean afterward.

## Defects / audit notes

1. **Pre-existing dependency-health diagnostic (non-blocking for this lock):** assembly `npm ls --all` exits `ELSPROBLEMS` for the local-linked `@aerobeat/web-input` peer dependency on `@aerobeat/web-contracts@0.0.0`, despite the root package being linked. This was already disclosed by implementation and does not introduce another pose runtime.
2. **Expected naming residue, not a runtime defect:** `aero.movenet.replay.basic-upper-body` remains visible as the documented historical CV replay fixture ID. Release proof must distinguish this compatibility data string and legacy query normalization strings from concrete MoveNet code/assets.
3. **Coverage disclosure:** CV's own `test:browser` is still a placeholder console check. Highest-fidelity browser coverage currently lives in assembly and passed independently.

No blocking defect was found in the MediaPipe-only default lock. QA evidence is ready for the separate auditor; the QA Bead is intentionally not closed.
