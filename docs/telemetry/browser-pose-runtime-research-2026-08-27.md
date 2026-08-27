# Browser Pose Runtime Research — 2026-08-27

## Question

Does the current `@mediapipe/tasks-vision@1.0.1-rc.20260827` nightly contain an evidenced pose-performance improvement, and has another maintained browser CV implementation publicly demonstrated better midrange Android Chrome performance than AeroBeat's measured MediaPipe Pose Landmarker Lite path (~63 ms total p50)?

## Tasks Vision Nightly Finding

`1.0.1-rc.20260827` is the npm `nightly` channel snapshot, not a curated GitHub release candidate. npm maps `latest` to stable `1.0.1` and `nightly` to date-stamped `1.0.1-rc.*` builds. There is no GitHub `v1.0.1` release/tag; the latest GitHub release is [v1.0.0](https://github.com/google-ai-edge/mediapipe/releases/tag/v1.0.0).

A reproducible tarball comparison found:

- stable: 14 files, 36,831,894 unpacked bytes;
- nightly: 17 files, 38,655,215 unpacked bytes, adding `LICENSE`, `NOTICE`, and an IIFE source map;
- `README.md` and `vision.d.ts` are byte-identical;
- all JS/WASM outputs were rebuilt;
- SIMD WASM shrank from 11,756,954 to 11,661,878 bytes (-0.81%); no-SIMD shrank by 0.89%; binary size is not latency evidence;
- both packages ship SIMD, module-SIMD, and no-SIMD artifacts with unshared memory; neither has a threaded/shared-memory build;
- both expose only CPU/GPU delegates for Vision Tasks, where GPU is WebGL rather than WebGPU;
- no comparison-window commit or release note claims a Pose Landmarker, WebGL, worker transport, SIMD, threading, or browser inference speedup.

Relevant changes are task-name/logging refactoring ([commit `04a9f763`](https://github.com/google-ai-edge/mediapipe/commit/04a9f7634b2800046a477fe60e26edceaa8a8849)), native LiteRT/NPU option exposure ([commit `76fa650c`](https://github.com/google-ai-edge/mediapipe/commit/76fa650c5aaea334099204d80f4953a8889702d6)), and earlier worker/Vite compatibility work. The official classic-worker IIFE path is documented through [issue #5479](https://github.com/google-ai-edge/mediapipe/issues/5479); it does not advertise lower compute latency.

**Conclusion:** no release-note or source evidence justifies expecting the nightly to improve pose performance. A nightly A/B would be regression discovery, not validation of a claimed optimization. Do not introduce nightly deployment risk solely for the smaller WASM binary.

## External Runtime Search

No eligible project was found that is both actively maintained and publicly demonstrates an apples-to-apples result faster than AeroBeat's ~63 ms p50 on a midrange Android Chrome device. Public figures usually omit browser/device, use desktop/server accelerators, report reciprocal average FPS rather than p50/p95, or include a different detector/crop workload.

### Evidence-bearing controls

1. **Legacy MediaPipe Pose Solution / TensorFlow.js `runtime: "mediapipe"`**
   - Apache-2.0; superseded/stale package line.
   - The [official TensorFlow.js BlazePose MediaPipe benchmark](https://github.com/tensorflow/tfjs-models/tree/master/pose-detection/src/blazepose_mediapipe#performance) reports 32 fps Lite on Pixel 5 (~31 ms reciprocal average), but omits browser/version, percentile, and equivalent AeroBeat pipeline overhead.
   - This is the only public phone signal materially below 63 ms, but it fails the active-maintenance requirement and is not comparable enough for a production claim.

2. **TensorFlow.js BlazePose runtime**
   - Apache-2.0, but the pose package line is effectively stale.
   - Its [official Pixel 5 WebGL table](https://github.com/tensorflow/tfjs-models/tree/master/pose-detection/src/blazepose_tfjs#performance) reports 12 fps Lite (~83 ms reciprocal average), slower than AeroBeat's measured path.

3. **Human**
   - MIT; package remains available, but its body lane largely wraps existing models and substantive body work is older.
   - The project's [performance page](https://github.com/vladmandic/human/wiki/Performance) lists 15 fps Body on Snapdragon 855 (~67 ms reciprocal average) without enough model/browser/backend detail for comparison. Its default body model is MoveNet, already rejected by AeroBeat evidence.

### Architecture-only candidates without qualifying mobile evidence

- **YOLO26n/YOLO11n Pose through browser GPU runtimes:** maintained components, but [Ultralytics pose figures](https://docs.ultralytics.com/tasks/pose/) are desktop/server results. Official `@ultralytics/yolo` can run `yolo26n-pose.tflite` through LiteRT.js WebGPU, and a maintained [LiteRT.js reference app](https://github.com/sitammeur/yolo-litert-app) exists. Ultralytics makes a general claim that LiteRT.js is roughly twice as fast as ORT WebGPU, but publishes no device/model-specific Android Chrome pose timing. A 640px multiperson detector plus NMS is excessive for AeroBeat's single-person seven-point need. Models must be exported float32 with `end2end=false` to avoid unsupported integer/gather operations falling back to CPU/WASM. Ultralytics licensing is AGPL-3.0 or commercial; integration and licensing risk are material. A maintained [community ORT Web demo](https://github.com/nomi30701/yolo-multi-task-onnxruntime-web) likewise does not publish qualifying Android results.
- **Transformers.js + ViTPose Small:** maintained Apache-2.0 runtime and available [ViTPose Small ONNX artifacts](https://huggingface.co/onnx-community/vitpose-plus-small-ONNX), but no qualifying phone/browser timing. Top-down ViTPose needs a detector or trusted crop, adding latency and coordinate complexity.
- **WebNN:** no demonstrated production Android pose lane in the [ONNX Runtime Web support matrix](https://github.com/microsoft/onnxruntime/blob/main/js/web/README.md) and no qualifying phone pose timing.
- **MMPose browser demos:** maintained upstream, but its web lane is primarily RTMPose, which AeroBeat already tested, with no better qualifying mobile result.
- **Browser YOLO pose forks, PoseNet, and tiny custom seven-output models:** stale, unsupported, or lack credible Android Chrome evidence. Reducing 17/33 output coordinates to seven does not materially reduce the backbone cost by itself.

## Decision

Retain MediaPipe Pose Landmarker Lite as the supported browser baseline. No external implementation currently earns replacement based on public evidence. If a future bake-off is funded, legacy MediaPipe Pose is useful only as a speed-control experiment, while YOLO/WebGPU or ViTPose are higher-risk architecture experiments requiring same-device accuracy, thermal, detector/crop, and p50/p95 proof.

The immediately justified experiment is not a new model: it is the bounded transferable `VideoFrame` worker lane, which isolates whether removing the observed 7–10 ms ImageBitmap preparation cost preserves worker callback smoothness without the measured freshness penalty.
