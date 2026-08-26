# AeroBeat Alternative Pose Backends

**Date:** 2026-08-26
**Status:** In Progress
**Agent:** cookie
**Umbrella Bead:** `aerobeat-web-cv-b12`
**Approval:** Derrick approved public creation of `AeroBeat-Workouts/aerobeat-web-vendor-mediapipe` and `AeroBeat-Workouts/aerobeat-web-vendor-onnxruntime`, interchangeable backend integration, and same-phone comparison.

## Goal

Add MediaPipe and ONNX Runtime Web as optional vendor-isolated pose backends beside the accepted MoveNet baseline, expose a truthful runtime selector, and collect equivalent Android telemetry to decide whether any commodity browser model is responsive enough or whether AeroBeat needs another runtime/model strategy.

## Architecture

- `aerobeat-web-contracts` owns the generic structural `AeroPoseAdapter` boundary while preserving the existing `NormalizedPoseFrame` scoring truth.
- `aerobeat-web-vendor-movenet`, `aerobeat-web-vendor-mediapipe`, and `aerobeat-web-vendor-onnxruntime` each own vendor packages, model loading, preprocessing, raw-output interpretation, fallback reporting, capabilities, provider/model telemetry, cleanup, and normalization.
- `aerobeat-web-cv` owns vendor-neutral adapter injection, camera/frame pacing, latest-frame-wins behavior, selected/actual backend telemetry, cleanup on terminal replacement, and normalized pose publication. Ordinary `stop()` must remain restartable because camera-device changes stop and start the same service; adapter disposal belongs to an explicit terminal service `dispose()` path.
- `aerobeat-web-assembly` owns concrete package wiring and a stable query/default override.
- `aerobeat-web-ui` owns the visible test/debug selector. The preferred comparison shape is one release containing all three choices so the phone, camera path, and surrounding app remain constant.
- Gameplay input and scoring consume the existing normalized seven-landmark truth. Prediction must not be promoted to scoring truth.

## Fixed Comparison Contract

- Same Android phone and browser build.
- Same 480x640 camera/input path, Direct full pacing, and latest-frame-wins policy.
- Same normalized seven-landmark output contract.
- Warm runs long enough to observe thermal/stability behavior.
- Record total CV latency, adapter latency, output age, media-pose delta, effective sample/submission and pose-output rates, stability, dropped frames, startup/model-load time, fallback behavior, bundle size, and memory/thermal observations where available.
- MoveNet build `0.0.15` telemetry remains the baseline: 122ms/67ms and 136ms/133ms snapshot-summary total-CV/media-pose measurements with zero dropped frames.

## Tasks

### 1. Confirm Vendor And Model Choices

**Status:** Complete

- MediaPipe: pin `@mediapipe/tasks-vision@1.0.1`; start with official Pose Landmarker Lite float16 `/1/` (`59929e1d…d574a`), VIDEO/single-pose/masks-off. Benchmark CPU-WASM and GPU-WebGL as distinct delegates; the public API has no WebGPU delegate.
- ONNX: pin `onnxruntime-web@1.29.0`; start with OpenMMLab's official RTMPose-t COCO-17 FP32 ONNX SDK at 192x256. Independently verified archive SHA-256 `937003a70832d9cc34ea16927f504792f3133e92dda1b9c626236bbbe9e805cb`; extracted `end2end.onnx` is 13,350,364 bytes with SHA-256 `a6c2f6a3896a4d51131d14d7a80a3d08b50f559af5a58a45d5b098aef510a70f`. Benchmark WebGPU and WASM as distinct execution providers. Use a controlled full-frame person crop first; add RTMDet-nano only if framing proves insufficient and include detector cost.
- Both adapters map source-frame coordinates to the existing seven names: nose, shoulders, elbows, wrists. Vendor confidence values remain private/non-comparable diagnostics unless separately calibrated.
- MediaPipe runtime/model and ORT runtime use Apache-2.0/MIT-compatible sources. RTMPose repository code is Apache-2.0, but the weight ZIP lacks embedded license/notice and carries training provenance; do not commit the binary model. The official OpenMMLab host also omits `Access-Control-Allow-Origin`, so browser-direct fetching is invalid. Provide a checksum-verifying developer fetch/extract script, keep the model ignored, and serve it from the same local/Tailscale origin for evaluation. A separate redistribution decision is required before bundling weights in a public release.

### 2. Create MediaPipe Vendor Repo

**Coordination Bead:** `aerobeat-web-cv-b12.1`
**Owning Bead:** `aerobeat-web-vendor-mediapipe-cnc`
**Status:** In Progress — public repo created/cloned; fresh Beads initialized/pushed

- Create approved public GitHub repo and canonical local checkout.
- Bootstrap from the MoveNet vendor repo's package/testbed shape without copying Git or Beads identity.
- Initialize fresh current Beads and create an owning implementation Bead.
- Implement normalized live/mock/replay adapter behavior and browser validation.

### 3. Create ONNX Runtime Vendor Repo

**Coordination Bead:** `aerobeat-web-cv-b12.2`
**Owning Bead:** `aerobeat-web-vendor-onnxruntime-93z`
**Status:** In Progress — public repo created/cloned; fresh Beads initialized/pushed

- Create approved public GitHub repo and canonical local checkout.
- Bootstrap from the MoveNet vendor repo's package/testbed shape without copying Git or Beads identity.
- Initialize fresh current Beads and create an owning implementation Bead.
- Implement preprocessing, inference, output decoding, normalized live/mock/replay behavior, and browser validation.

### 4. Add Runtime Backend Selection

**Coordination Bead:** `aerobeat-web-cv-b12.3`
**Owning Beads:** `aerobeat-web-contracts-99h`, `aerobeat-web-vendor-movenet-0v6`, `aerobeat-web-assembly-ez3`
**Status:** In Progress — architecture inspected and owning Beads claimed

- Define or extract one vendor-neutral adapter shape without exposing vendor objects.
- Wire all three packages through assembly.
- Add visible selector plus stable query/default override.
- Report selected backend, actual backend, execution location/detail, model, load state, and fallback in existing telemetry.
- Preserve latest-frame-wins, Direct full baseline, camera lifecycle, normalized output, and scoring truth.

### 5. Validate And Benchmark

**Bead:** `aerobeat-web-cv-b12.4`
**Protocol:** `docs/pose-backend-benchmark.md`
**Status:** In Progress — fixed matrix/procedure prepared; integrated browser and physical Android evidence pending

- Run repo checks/unit/browser tests across vendor, contracts if touched, CV, UI, and assembly.
- Build one comparable release where practical.
- Collect physical Android telemetry for MoveNet, MediaPipe, and ONNX under the fixed contract.
- Record an evidence-based recommendation: adopt a backend, keep a fallback matrix, or proceed to another solution.

### 6. QA, Audit, And Landing

**Focused Contract/MoveNet QA Bead:** `aerobeat-web-cv-b12.5`
**Focused Contract/MoveNet Audit Bead:** `aerobeat-web-cv-b12.6`
**Vendor Adapter QA Bead:** `aerobeat-web-cv-b12.7`
**Status:** In Progress — focused contract/MoveNet QA and audit passed/closed; full selector/runtime QA follows integration

- Independent QA verifies selector behavior, telemetry truth, normalized output, fallback, and regressions.
- Independent auditor verifies repository boundaries, licenses/provenance, Beads/plan state, commits, pushes, and comparison fairness.
- Close completed Beads only after required phone evidence and independent gates pass.

## Debugging Record

- **Problem:** restartable CV `stop()` suppressed an accepted in-flight latest-frame result.
- **Observed symptom:** `validatesLatestFrameWins` called adapters for `first` and `third`, but the latest frame remained `first` after stop.
- **Root cause:** `stopService()` advanced the lifecycle generation and set `stopped` before the resolved `third` promise continuation could commit.
- **Evidence:** queue selection was correct (`[first, third]`); only the generation/state commit guard rejected the second result.
- **Failed approach:** sharing terminal stale-result suppression semantics between ordinary stop and disposal.
- **Corrective action:** ordinary stop must quiesce and accept already-running work before entering stopped; terminal disposal invalidates immediately, awaits work, and releases adapters.
- **Verification tests:** latest-frame-wins through stop, start-stop-start, and terminal dispose with no stale result.

### Contracts Root Type-Import Collision

- **Problem:** new vendor TypeScript checks failed while resolving generic adapter types.
- **Observed symptom:** TS2308 reported duplicate `BodyGridAnchorName` exports from contracts root wildcard exports (`pose-shapes.js` and `input-shapes.js`).
- **Root cause:** vendor JSDoc imported types from the contracts package root, forcing TypeScript through a pre-existing ambiguous root typedef export.
- **Corrective action:** vendor packages import `NormalizedPoseFrame` from `/pose-shapes` and `AeroPose*` types from `/pose-adapter`; this slice does not alter unrelated existing contracts shapes.
- **Verification test:** vendor `check:types` succeeds through explicit subpath imports.

### ONNX Generic Type Boundary

- **Problem:** ONNX conformance code passed runtime tests but failed its new TypeScript gate.
- **Observed symptoms:** TS2345 on generic frame source to preprocessing, TS2322 on overloaded ORT `InferenceSession.create`, and TS2739 on default preprocessing options.
- **Root causes:** preprocessing had a narrower unguarded canvas-source type than the public contract; the actual ORT overloaded factory was assigned directly to a narrow fake-runtime interface; optional JSDoc properties were written as required-with-undefined.
- **Corrective actions:** guard/narrow or explicitly support frame-source variants, wrap the actual ORT module behind the injected narrow factory, and mark optional options with bracket syntax.
- **Verification test:** ONNX `check:types`, unit/browser suites, real WASM smoke, and package checks all pass without weakening the generic contract.

## Results

- Generic adapter contract landed in `aerobeat-web-contracts` commit `70b8b1b`; parent checks passed.
- MoveNet generic conformance landed in `aerobeat-web-vendor-movenet` commit `ce038e6`; existing exports/defaults remain compatible and parent checks passed.
- Focused independent QA and auditor gates (`aerobeat-web-cv-b12.5`, `.6`) passed/closed contracts `70b8b1b` and MoveNet `ce038e6`, including literal live/worker/mock conformance, compatibility, telemetry, disposal, clean/pushed state, and vendor isolation. Owning implementation Beads were audit-closed. Real browser/model inference was explicitly outside this focused gate.
- CV genericization landed in `aerobeat-web-cv` commit `a2b0de4`: MoveNet dependency removed, CV-owned replay fallback added, requested/selected/effective identity and execution telemetry added, and restartable stop/terminal disposal regression coverage passes.
- ONNX Runtime implementation landed in commits `577736b`, `259f172`, and `c4c4da`: pinned same-origin model workflow, preprocessing/SimCC decode, explicit WebGPU/WASM fallback, literal live/replay generic contract conformance, narrowed real ORT wrapper, real browser ImageData preprocessing coverage, seven normalized landmarks, provenance, type/unit/browser/package gates, and real official-model host WASM adapter proof. Host-only smoke measured roughly 165ms load/25ms zero-input inference before the conformance pass; it is not Android benchmark evidence.
- MediaPipe implementation landed in commits `659a751` and `a14b036`: pinned official runtime/model provenance, CPU-WASM/GPU-WebGL delegates, normalized seven-point output, literal live/configured/replay generic identities and telemetry, deterministic browser replay smoke, and full package checks pass.
- Backend selection, browser release comparison, physical telemetry, full QA, and final audit remain pending.
