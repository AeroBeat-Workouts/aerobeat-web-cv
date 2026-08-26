# AeroBeat Pose Backend Benchmark

**Status:** Prepared; browser integration and physical Android evidence pending
**Owning Bead:** `aerobeat-web-cv-b12.4`
**Comparison build:** Pending assembly selector landing

## Decision Question

Can MoveNet, MediaPipe Pose Landmarker Lite, or ONNX Runtime Web with RTMPose-t produce a sufficiently fresh, stable seven-landmark pose stream on the target Android phone, or does AeroBeat need another model/runtime strategy?

## Fixed Test Contract

Every measured run must use:

- the same Android phone and Chrome version;
- one assembly build containing every selectable backend;
- the same camera, 480x640 input, orientation, preview path, and lighting/framing;
- CV preset `full` (Direct full), latest-frame-wins scheduling, and the same 15fps submission ceiling;
- the same seven displayed landmarks: nose, shoulders, elbows, and wrists;
- unmirrored source-frame normalized inference coordinates with mirroring limited to display metadata;
- one visible subject at comparable distance and motion;
- no concurrent backend sessions or background recording that changes GPU/thermal load.

Selected and actual backend/provider must both be present in every exported telemetry snapshot. A fallback result is not attributed to the requested provider.

## Configurations

| ID | Stable query | Requested provider/delegate | Model | Notes |
| --- | --- | --- | --- | --- |
| `movenet-webgl` | `?poseBackend=movenet&poseProvider=webgl` | TensorFlow.js WebGL, main thread | SinglePose Lightning | Accepted baseline |
| `mediapipe-wasm` | `?poseBackend=mediapipe&poseProvider=cpu-wasm` | CPU-WASM | Pose Landmarker Lite float16 `/1/` | Synchronous inference |
| `mediapipe-webgl` | `?poseBackend=mediapipe&poseProvider=gpu-webgl` | GPU-WebGL | Pose Landmarker Lite float16 `/1/` | Synchronous inference |
| `onnx-wasm` | `?poseBackend=onnxruntime&poseProvider=wasm` | WASM, no silent provider mixing | RTMPose-t 256x192 FP32 | Same-origin ignored model asset |
| `onnx-webgpu` | `?poseBackend=onnxruntime&poseProvider=webgpu` | WebGPU, no silent provider mixing | RTMPose-t 256x192 FP32 | Record actual provider/failure |

The selector registry uses `poseBackend` and `poseProvider`. Direct full remains the no-query CV preset. An optional `onnxModelUrl` is accepted only when it resolves to the current origin; the normal test path serves the ignored verified model at `models/rtmpose-t/end2end.onnx`.

## Procedure

1. Record phone model, Android version, Chrome version, build commit, battery/charging state, room conditions, camera, and start temperature if available.
2. Close unrelated applications and browser tabs. Disable battery saver and keep display brightness fixed.
3. Load the configuration from a fresh route. Capture cold runtime/model download and initialization time separately.
4. Confirm requested backend/provider equals actual backend/provider. Reject the run if it silently falls back.
5. Warm the configuration for two minutes with representative upper-body movement.
6. Record three 60-second measurement windows and download/copy one telemetry snapshot per window.
7. Record errors, freezes, dropped frames, fallback transitions, memory pressure, and visible thermal throttling.
8. Cool the phone to a comparable starting condition before switching configurations.
9. Rotate configuration order across passes rather than always testing MoveNet first, to reduce thermal/order bias.
10. Preserve raw snapshots next to the completed result table; summarize medians and ranges rather than selecting the best run.

## Required Measurements

- cold runtime/model load duration;
- adapter inference duration and running average;
- total CV duration and running average;
- latest submitted-frame age;
- latest pose-output age;
- media-time minus pose-frame timestamp delta;
- effective submission rate;
- effective pose-output rate;
- dropped/submitted/output frame counts;
- selected and effective backend/vendor/model/runtime/provider;
- fallback flag and reason;
- build/release bytes by backend chunk, runtime WASM, and model artifact;
- stability/errors during the warm period;
- approximate memory and thermal observations when available.

## Host Release Asset Footprint

Assembly release proof `0.0.15` built successfully after preparing the verified ONNX model. These are raw emitted/package bytes, not measured phone transfer bytes; browser network capture must establish which provider-specific asset is actually fetched and cached.

| Asset | Raw bytes | Interpretation |
| --- | ---: | --- |
| MoveNet worker JavaScript | 3,184,071 | Existing optional worker artifact; Direct full remains main-thread |
| MediaPipe Tasks Vision JavaScript chunk | 197,566 | Assembly-emitted adapter/runtime JavaScript |
| MediaPipe SIMD WASM candidate | 11,756,954 | Package/CDN runtime candidate; one compatible variant should load |
| MediaPipe module SIMD WASM candidate | 11,756,972 | Package/CDN runtime candidate |
| MediaPipe non-SIMD WASM candidate | 10,960,242 | Package/CDN fallback candidate |
| MediaPipe Pose Landmarker Lite model | 5,777,746 | Official cross-origin model with verified CORS/hash |
| ONNX Runtime WebGPU JavaScript | 154,280 | Provider-specific emitted JavaScript |
| ONNX Runtime WASM JavaScript | 506,080 | Provider-specific emitted JavaScript |
| ONNX Runtime asyncify WASM | 25,749,873 | Emitted WASM candidate |
| ONNX Runtime JSEP/WebGPU WASM | 27,797,172 | Emitted WASM candidate |
| RTMPose-t FP32 model | 13,350,364 | Ignored, verified same-origin asset |

The release currently emits both ONNX WASM candidates (53,547,045 raw bytes total) so that provider selection can occur at runtime; a selected browser run should load one provider path, not attribute total artifact storage to per-run network transfer. MediaPipe runtime/model assets are fetched separately from its emitted JavaScript and must be included in cold-load telemetry.

## Existing MoveNet Phone Baseline

Two prior Direct-full snapshots establish the comparison floor:

| Snapshot | Average total CV | Submission rate | Pose rate | Output age | Media-pose delta | Dropped frames |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 122ms | 7fps | 9fps | 13ms | 67ms | 0 |
| 2 | 136ms | 6fps | 8fps | 3ms | 133ms | 0 |

The second exported snapshot-summary value is 133ms. A later visible panel sample was 100ms and must not replace the exported summary value.

## Working Interpretation Bands

These are comparison heuristics, not a final gameplay SLA:

- **Promising:** sustained average total CV at or below about 66ms, at least 12 pose outputs/second, fresh output, no unstable fallback, and materially better media-pose delta than the baseline.
- **Marginal:** sustained average total CV at or below about 100ms and at least 10 pose outputs/second without stability regressions.
- **Not sufficient for current gameplay:** sustained total CV above about 120ms, fewer than 8 pose outputs/second, repeated freezes/fallbacks, or worsening media-pose delay under warm conditions.

Confidence values are vendor-specific diagnostics and are not compared as calibrated probabilities.

## Result Table

| Config | Run | Cold load | Avg adapter | Avg total CV | Submission fps | Pose fps | Output age | Media-pose delta | Actual provider/fallback | Stability/thermal |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| `movenet-webgl` | 1 | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| `movenet-webgl` | 2 | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| `movenet-webgl` | 3 | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| `mediapipe-wasm` | 1-3 | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| `mediapipe-webgl` | 1-3 | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| `onnx-wasm` | 1-3 | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |
| `onnx-webgpu` | 1-3 | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |

## Recommendation

Pending comparable integrated browser and physical Android evidence.
