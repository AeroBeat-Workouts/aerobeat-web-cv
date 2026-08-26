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
**Vendor Adapter Audit Bead:** `aerobeat-web-cv-b12.8`
**Status:** In Progress — focused contract/MoveNet gates passed/closed; vendor audit passed MediaPipe but found ONNX dispose-during-async-load bug `aerobeat-web-vendor-onnxruntime-m3q`; vendor QA/audit rerun and selector/runtime gates remain

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

### Rapid Backend Switch Restart Race

- **Problem:** a second backend selection arriving while the first replacement awaited disposal could lose the live-camera restart request.
- **Causal path:** generation one captured a live route and tore it down; generation two then observed no retained stream/running service; generation one exited as stale; generation two created the final service but skipped restart because its local `hadLiveRoute` was false.
- **Corrective action:** latch restart intent across coalesced generations until the winning replacement consumes it, and serialize terminal cleanup rather than racing an unawaited stop with dispose.
- **Verification test:** a deterministic rapid-switch-during-dispose case leaves the latest backend selected, the old service disposed once, and the live route restarted.

### Calibration Immediately After Selection Race

- **Exact observed failure:** parent `npm run check` reached Playwright `validate-playwright-console-noise.js:281` and timed out after 90 seconds waiting for calibration/live inference immediately after changing the CV preset; browser console/error log was empty.
- **Expected behavior:** a preset/backend selection followed immediately by Begin calibration must start the selected replacement service and reach the live-camera running state.
- **Execution path:** the selection queues asynchronous service replacement while idle (`hadLiveRoute=false`); the immediate calibration click requests camera/starts the old service; queued replacement then stops/disposes that service and does not restart because it captured no prior live route.
- **Most likely root cause:** calibration startup is not serialized behind the pending replacement queue. This explains a silent wait timeout and is directly supported by handler ordering and the queue's captured restart boolean.
- **Alternative hypotheses:** old MoveNet-specific status assertions may also need updating after generic telemetry changes, or model setup may fail; neither explains the deterministic request/disposal ordering and absence of console errors as strongly.
- **Why the generation fix was insufficient:** it coalesces selection replacements but does not cover a new live-start request arriving after an idle selection has queued its replacement.
- **Unknown:** which individual composite wait clause remains false after serialization; a focused test-state dump will distinguish stale text assertions from lifecycle failure.
- **Minimal reproduction:** change a preset/backend and click Begin calibration before the replacement promise settles.
- **Corrective action:** serialize user-initiated calibration behind the current replacement promise while keeping an internal non-self-awaiting restart path for calls issued from the winning queue generation.
- **Verification test:** a deterministic selection-then-immediate-calibration case reaches the latest selected backend, live camera, and advancing pose frames; the existing full Playwright gate passes with selected/effective telemetry assertions.

### Telemetry Assertion Drift After Generic Provider Reporting

- **Exact observed failure:** after calibration serialization fixed the earlier timeout, Playwright timed out at telemetry snapshot assertion line 440 with no console error.
- **Root cause:** the test still expected `Execution detail: direct adapter`, while truthful MoveNet generic telemetry now reports `Execution detail: webgl direct adapter`.
- **Evidence:** a no-edit instrumented run captured the complete clipboard/output snapshot with selected/effective MoveNet identity, actual provider `webgl`, and detail `webgl direct adapter`; all other required fields were present.
- **Corrective action:** update the assertion to the truthful provider-qualified detail rather than weakening telemetry.
- **Verification test:** parent reran `npm run check`; the complete Playwright console-noise gate passed.

### Telemetry Capture Before Post-Switch Rates Stabilize

- **Exact observed failure:** expanded assembly Playwright timed out at snapshot assertion line 486 after a successful MediaPipe/ONNX/MoveNet rapid switch.
- **Evidence:** a no-edit diagnostic dump showed correct final MoveNet identity, URL, live camera, load timing, and one pose, but the final service panel still had inference/pose frame counts zero at its last status tick; the immutable copied snapshot contained `n/a` submission, pose, and status rates.
- **Root cause:** the test clicked Copy as soon as backend/camera restart became visible, before the replacement service accumulated enough samples for rates. Waiting after copy cannot change the captured text.
- **Corrective action:** wait for the final service to expose multiple inference/pose frames and numeric rates/ages before clicking Copy; retain strict numeric telemetry assertions rather than accepting `n/a`.
- **Verification test:** repeated full assembly test runs complete with numeric post-switch telemetry snapshots.

### ONNX Dispose During Async Load Revival

- **Exact observed failure:** vendor audit deferred model loading, called `dispose()` while status was `loading`, released the gate, and observed final status `ready`, provider `webgpu`, and `releaseCount=0`.
- **Expected behavior:** disposal is terminal during every load phase; any late-created session is released once, pending load cannot revive readiness, and later load/estimate reject.
- **Execution path:** the pending load continued after disposal, created/selected a session, assigned it to adapter state, and overwrote `disposed` with `ready`; the already-run disposer could not release a session that did not yet exist.
- **Root cause:** asynchronous load completion lacks a post-await terminal/generation check and late-resource cleanup. Existing tests covered disposal after readiness, not deferred model/session creation.
- **Corrective action:** guard every asynchronous load boundary, release late sessions before rejecting, preserve terminal state, share concurrent load work, and add model-gate/session-gate/concurrent-load/double-dispose probes.
- **Verification test:** auditor rerun must show disposed status, exactly one late-session release, rejected pending/post-dispose calls, no duplicate sessions, and full package/browser/model gates passing.

## Results

- Generic adapter contract landed in `aerobeat-web-contracts` commit `70b8b1b`; parent checks passed.
- MoveNet generic conformance landed in `aerobeat-web-vendor-movenet` commit `ce038e6`; existing exports/defaults remain compatible and parent checks passed.
- Focused independent QA and auditor gates (`aerobeat-web-cv-b12.5`, `.6`) passed/closed contracts `70b8b1b` and MoveNet `ce038e6`, including literal live/worker/mock conformance, compatibility, telemetry, disposal, clean/pushed state, and vendor isolation. Owning implementation Beads were audit-closed. Real browser/model inference was explicitly outside this focused gate.
- CV genericization landed in `aerobeat-web-cv` commit `a2b0de4`: MoveNet dependency removed, CV-owned replay fallback added, requested/selected/effective identity and execution telemetry added, and restartable stop/terminal disposal regression coverage passes.
- ONNX Runtime implementation landed in commits `577736b`, `259f172`, and `c4c4da`: pinned same-origin model workflow, preprocessing/SimCC decode, explicit WebGPU/WASM fallback, literal live/replay generic contract conformance, narrowed real ORT wrapper, real browser ImageData preprocessing coverage, seven normalized landmarks, provenance, type/unit/browser/package gates, and real official-model host WASM adapter proof. Host-only smoke measured roughly 165ms load/25ms zero-input inference before the conformance pass; it is not Android benchmark evidence.
- MediaPipe implementation landed in commits `659a751`, `a14b036`, and `678cb58`: pinned official runtime/model provenance, CPU-WASM/GPU-WebGL delegates, normalized seven-point output, literal live/configured/replay generic identities and telemetry, terminal/idempotent disposal, deterministic browser replay smoke, and full package checks pass.
- Consolidated vendor QA initially passed MediaPipe through `678cb58` and ONNX through `c4c4da`, including provenance, CORS/weight exclusion, literal live/replay conformance, and official-model ONNX WASM smoke (170.31ms wall load, 25.20ms wall zero-input estimate; non-phone evidence). Vendor audit then disproved ONNX terminal lifecycle under a deferred loader: dispose during load revived `ready`, selected WebGPU, and leaked the late session (`releaseCount=0`). Owning bug `aerobeat-web-vendor-onnxruntime-m3q` is in correction; QA/audit Beads remain open.
- Backend selection, browser release comparison, physical telemetry, full QA, and final audit remain pending.
