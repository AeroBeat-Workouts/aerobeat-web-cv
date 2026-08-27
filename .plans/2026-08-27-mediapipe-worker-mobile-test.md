# MediaPipe Worker Mobile Test

**Date:** 2026-08-27
**Status:** Approved / Ready To Execute
**Agent:** cookie
**Umbrella Bead:** `aerobeat-web-cv-smg`
**Implementation Bead:** `aerobeat-web-cv-smg.1`
**Physical QA Bead:** `aerobeat-web-cv-smg.2`
**Final Audit Bead:** `aerobeat-web-cv-smg.3`
**Approval:** Derrick requested this plan and directed that the mobile worker test execute next after both requested plans are filed.

## Goal

Determine whether moving synchronous MediaPipe Pose Landmarker Lite inference from the browser main thread into a dedicated worker improves mobile preview/UI responsiveness and pose freshness without changing the seven measured scoring landmarks, model, filtering, latest-frame-wins behavior, provider truth, or default production path.

## Baseline And Evidence

Target physical baseline is the moto g power 5G 2024 / Android 15 / Chrome 151 packet from the completed MediaPipe optimization plan:

- Direct full, Fast preview, Standard thresholds, actual GPU-WebGL.
- Phone total CV p50/p95/max 64/74/84ms, 43/120 over the 66.7ms budget, 33ms media-pose delta, 12fps pose output.
- Desktop total CV p50/p95/max 15/22/25ms and 0ms media-pose delta.
- Direct full preparation is 0ms and passes the live `HTMLVideoElement` directly.
- External downscale from 480×640 to 160×120 did not reduce the fixed MediaPipe graph/model cost in the software-WebGL control.
- `detectForVideo()` is synchronous. Current CV orchestration already keeps at most one replaceable pending sample, but it cannot cancel an accepted in-flight call.
- Current MediaPipe capabilities truthfully declare `supportsWorker: false`; existing worker-labeled presets are experimental workload controls, not implemented worker execution.

## Scope

### In Scope

- Actual dedicated-worker MediaPipe execution behind an experimental selector.
- CPU-WASM worker capability as the lowest-risk pipeline proof.
- GPU-WebGL worker capability probing using worker WebGL/OffscreenCanvas where MediaPipe Tasks 1.0.1 and the browser permit it.
- Transferable `ImageBitmap` first; `VideoFrame` only if Tasks 1.0.1 compatibility is proven rather than assumed.
- One in-flight estimate plus at most one replaceable latest frame; discarded/transferred frames must be closed.
- Truthful capture/source timestamps aligned with the transferred image, not an earlier video-element reference.
- Worker load, transfer/preparation, queue/drop, runtime inference, round-trip, pose-age, provider, and lifecycle telemetry.
- Main-thread heartbeat/jank measurement sufficient to prove whether the worker improves UI responsiveness.
- Matched desktop smoke and physical-phone A/B evidence.

### Out Of Scope

- Model replacement, quantization, custom seven-output training, interpolation, prediction, or native Android/Godot work.
- One Euro or any new scoring/landmark filter.
- Changing the Direct-full/Standard/Fast production default before evidence and audit.
- Claiming worker execution, GPU execution, or zero-copy transport from requested configuration alone.
- Multiple concurrent MediaPipe estimates or unbounded postMessage queues.

## Ownership And Likely Files

- `aerobeat-web-vendor-mediapipe`: concrete worker runtime, task load/dispose, worker protocol, provider/location telemetry.
- `aerobeat-web-cv`: transferable-frame/latest-frame-wins ownership, timestamp and resource retirement, generic worker timing passthrough.
- `aerobeat-web-contracts`: only if additive generic telemetry/capability fields are truly required.
- `aerobeat-web-assembly`: experimental selector, compact phone telemetry, release wiring, and physical-test checkpoint.
- `aerobeat-web-ui`: only if a generic preview heartbeat/jank metric cannot be observed at assembly/CV level.

Generated node_modules, mounted addons, model/WASM binaries, and live deployed copies are never durable source.

## Worker Protocol Invariants

1. Worker selection is explicit and experimental.
2. `detectForVideo()` runs in the worker when status reports worker execution.
3. The main thread never transfers `HTMLVideoElement`; it transfers a proven supported frame object.
4. Frame pixels and `timestampMs` describe the same capture/presentation instant.
5. At most one frame is in inference and one newer frame is pending.
6. A newer eligible frame replaces the pending one; the replaced object is closed immediately.
7. The worker closes its accepted frame after inference, including failure paths.
8. Stop/dispose retires pending frames, waits or invalidates accepted work by generation, closes Pose Landmarker once, and terminates the worker.
9. GPU-worker load failure remains a truthful failure; CPU or main-thread fallback occurs only through an explicit caller policy and is reported as fallback.
10. Output remains nose, shoulders, elbows, and wrists with source/mirror metadata unchanged.

## Tasks

### 1. Implement The Bounded Worker Experiment

**Bead:** `aerobeat-web-cv-smg.1`
**Status:** Implementation complete; independent QA in progress

- Preserve the confirmed Tasks Vision 1.0.1 module-worker failure evidence and use its required classic-worker bootstrap without claiming module-worker support.
- Implement CPU-WASM worker first and prove the protocol/lifecycle with injected runtime tests.
- Probe GPU-WebGL worker creation separately; require actual provider evidence.
- Implement transferable frame capture with exact timestamp pairing and resource closure.
- Preserve the current main-thread adapter and default unchanged.
- Add unit/browser tests for first/latest processing, replacement closure, failures, stop/dispose during in-flight work, late result invalidation, worker termination, and provider/location truth.
- Expose worker preparation/transfer, worker runtime, round-trip, output age, pending replacements, and main-thread heartbeat/jank diagnostics.

**Progress:** CV commit `ff0bcce` adds a bounded 120-sample browser scheduling-callback gap distribution (p50/p95/max) so main-thread starvation can be compared independently of the 15fps submission ceiling. Stop/start establishes a fresh gap baseline while retaining the service-lifetime evidence window. Resized/transfer frame preparation now pairs output metadata with the media timestamp captured at `drawImage`, avoiding an older queued video-reference timestamp. CV check/unit/browser/diff gates pass.

Vendor commit `d2a51cf` adds the actual experimental worker adapter, transferable ImageBitmap/exact-timestamp protocol, one-in-flight rejection/retirement, CPU/GPU delegate truth, runtime/round-trip telemetry, terminal task/worker disposal, and deterministic lifecycle tests. Chromium probing discovered that Tasks Vision 1.0.1 fails Pose Landmarker creation in a module worker with exact `ModuleFactory not set.` because its Emscripten loader depends on `importScripts`; the same probe succeeded from a classic worker for CPU and GPU and accepted ImageBitmap and VideoFrame. The landed implementation therefore uses an import-free classic worker plus an injectable pinned Tasks Vision bundle URL and supports ImageBitmap only for this bounded product experiment. CV commit `3ca768c` captures transfer pixels while the browser callback is current, bounds capture to one in progress plus one replaceable request, retires superseded prepared ImageBitmaps, exposes capture-replacement/retirement counts, and proves that the newest capture timestamp reaches the next inference. Vendor and CV check/unit/browser/diff gates pass. Assembly commit `cb76e8e` makes the three experimental presets instantiate the real MediaPipe worker adapter while preserving Direct-full as the unchanged default/recommendation; registry and browser tests prove provider/tuning/preset selection without loading a worker merely from requested configuration. Assembly commit `be5c1da` exposes worker round-trip, capture replacements, retired transferables, and browser callback-gap p50/p95/max/window in the diagnostic and downloadable telemetry path. Full assembly check/unit/browser/build/diff gates pass, and the production build emits a dedicated `mediapipe-worker-*.js` asset. Physical target proof remains required.

Validation per touched repo: `npm run check`, `npm test`, `npm run test:browser`, release/dependency/audit gates where defined, and `git diff --check`.

### 2. Matched Desktop And Physical Phone QA

**Bead:** `aerobeat-web-cv-smg.2`
**Status:** In progress; desktop complete and physical packets selected

Compare at minimum:

1. current Direct-full main-thread GPU-WebGL baseline;
2. same-size main-thread versus worker control where possible;
3. CPU-WASM worker pipeline;
4. GPU-WebGL worker only when actually available.

Capture warmed 120-estimate packets with:

- requested/selected/effective execution location and provider;
- frame preparation/transfer, worker runtime, worker round-trip, and total CV p50/p95/max;
- over-budget and incomplete-seven-point counts;
- submission, output, pending replacement/drop counts;
- media-pose delta and output age;
- main-thread heartbeat/rAF gap p50/p95/max or equivalent long-task evidence;
- camera preview continuity while inference runs;
- stable stance, fast movement, partial occlusion/exit, and re-entry behavior;
- start/stop/restart/backend-switch/dispose lifecycle.

A worker earns recommendation only if it materially improves UI/preview responsiveness or freshness without unacceptable pose-age, throughput, stability, provider, or lifecycle regression. Compute may remain unchanged; report that truthfully.

**Round 4 physical result:** checkpoint `0.0.21` produced four complete 120-sample moto g power packets, summarized durably in `docs/telemetry/mediapipe-worker-mobile-moto-g-power-2026-08-27.md`. All lanes delivered complete seven-point poses at 11–12 fps, matching the operator's perception that they felt similar. ImageBitmap workers improved callback p50 from 57–63 ms to 33 ms and overlay cadence from 12 fps to 22–23 fps, but worsened total p50 from 63–64 ms to 77 ms, increased over-budget windows from 35–41 to 108–117, retired 3/10 frames, and worsened pose freshness. ImageBitmap worker promotion is rejected; Direct-full remains unchanged.

### 3. Transferable VideoFrame Worker Control

**Bead:** `aerobeat-web-cv-1g8`
**Status:** Authorized / implementation in progress

- Add a separate explicit MediaPipe-only VideoFrame worker preset; keep every production/default and ImageBitmap control unchanged.
- Construct and transfer a VideoFrame at the video presentation timestamp without canvas/ImageBitmap preparation.
- Preserve one inference plus one replaceable latest frame, exact timestamp truth, closure of replaced/accepted frames, lifecycle cleanup, provider truth, and unsupported-path truth.
- Compare matched CPU/GPU desktop and phone packets against Direct-192 and ImageBitmap-worker lanes.

### 4. Research Remaining Runtime Options

**Bead:** `aerobeat-web-cv-8zn`
**Status:** Research complete; no proven faster maintained replacement

- Diff stable Tasks Vision 1.0.1 against `1.0.1-rc.20260827` and identify authoritative performance, worker-loader, WASM, SIMD, threading, or GPU changes rather than inferring from the RC label.
- Search maintained browser/mobile pose solutions with credible evidence that could beat the measured MediaPipe Lite path; exclude already-tested MoveNet and ONNX RTMPose as proposed next steps.
- Record versions, maintenance, license, reported hardware/runtime, comparability, and integration risk.

**Result:** `docs/telemetry/browser-pose-runtime-research-2026-08-27.md` records authoritative package diffs and evidence-ranked alternatives. The RC is a rolling nightly with rebuilt/slightly smaller WASM but no release note, source change, threaded artifact, or public benchmark evidencing a pose speedup. No maintained alternative has a comparable public result below AeroBeat's ~63 ms phone p50. Legacy MediaPipe Pose has a non-comparable ~31 ms reciprocal Pixel 5 signal but is superseded; LiteRT.js WebGPU YOLO26n and ViTPose remain architecture-only candidates with no qualifying phone evidence and substantial model/licensing/crop risk.

### 5. Independent Audit And Default Decision

**Bead:** `aerobeat-web-cv-smg.3`
**Status:** Blocked by physical QA

- Audit implementation boundaries, frame ownership, queue bounds, timestamp truth, provider/location truth, tests, physical packets, and commits.
- Confirm no scoring/model/filter/default drift and no leaked frame/worker/task resources.
- Record one decision: retain main-thread default, adopt worker for supported devices, or defer worker pending platform/runtime support.
- Close completed Beads only after pushed clean parity and plan results are complete.

## Coder / QA / Auditor Loop

- Coder claims `aerobeat-web-cv-smg.1`, implements across owning repos, validates, commits, and pushes.
- QA claims `aerobeat-web-cv-smg.2` and independently captures the highest-fidelity physical evidence.
- Auditor claims `aerobeat-web-cv-smg.3`, verifies source/evidence/Beads/Git, and closes only proven work.
- Parent verifies every handoff and keeps this plan aligned with actual results.

## Results

Implementation is complete through desktop controls. Vendor `d2a51cf`, CV `ff0bcce`/`3ca768c`, and assembly `cb76e8e`/`be5c1da`/`2951069` provide actual bounded classic-worker execution, exact capture/transfer ownership, truthful provider/runtime/round-trip/responsiveness telemetry, explicit worker-only selection, and downloadable evidence while leaving Direct-full unchanged as the default.

Matched 120-sample desktop evidence is recorded in `docs/telemetry/mediapipe-worker-desktop-2026-08-27.md`. CPU worker matched main-thread CPU inference/throughput (total p50/p95 12/14ms versus 13/16ms; 12fps each) and kept callback p95 camera-paced at 34ms, at the cost of one-frame freshness (54ms output age and 33ms media-pose delta versus 22ms/0ms). GPU worker did not improve inference (173/183ms versus 171/181ms total p50/p95) but improved callback p50 from 184ms to 33ms; callback p95 remained 167ms and freshness regressed to 179/203ms with four safely retired replacements. This supports CPU-WASM as the lowest-risk phone lane and rejects any desktop basis for promoting GPU worker or changing defaults.

Physical-phone quality/lifecycle evidence, QA recheck, and final audit remain pending. Initial independent QA failed three blockers. The pre-load estimate race/frame leak is fixed by vendor `b4dca72`. Vendor `207c875` additionally makes worker-factory and synchronous load-post failures terminal/clean, terminates the created worker, tests both paths, and extends graceful disposal timeout from 1s to 5s so the observed 1752ms GPU outlier can still process worker-side task closure. CV `8b424a3` requires ImageBitmap capture even when input is already within preset, fails truthfully when dimensions/ImageBitmap support are unavailable instead of attempting HTMLVideoElement/canvas transfer, catches capture-preparation errors in lifecycle policy, and tests small-input and unsupported-capture paths. All vendor/CV gates pass. Assembly checkpoint `15dc561` bumps the QA-repaired phone version to `0.0.20`; the no-cache Tailscale route was rebuilt. CV `562af59` now propagates exact `requestVideoFrameCallback` `mediaTime` into immediate transferred captures and tests 1.25s → 1250ms pairing; a capture delayed behind a prior bitmap explicitly discards stale callback time and uses draw-time media state instead. CV `eae8527` adds bounded prep, vendor-runtime, and worker-round-trip p50/p95/max distributions alongside existing adapter/total windows. Assembly `7d14f9f` exposes these in diagnostics/downloads and passes full check/unit/browser/build gates. Checkpoint `d2ac82c` bumps the corrected phone version to `0.0.21`. Durable module-worker failure reproduction and QA recheck remain before physical acceptance.
