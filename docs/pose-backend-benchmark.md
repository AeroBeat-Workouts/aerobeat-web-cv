# AeroBeat Pose Backend Benchmark

**Status:** Physical screening captured; corrected ONNX WASM rerun pending
**Owning Bead:** `aerobeat-web-cv-b12.4`
**Comparison build:** assembly `4783f02` telemetry source / `79a5ce6` audited closure

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

The operator-approved physical scope is one warmed telemetry snapshot for each of the five backend/provider configurations. This is a comparable screening matrix rather than a three-run statistical sample; recommendation confidence and thermal variability must be stated accordingly.

1. Record phone model, Android version, Chrome version, build commit, battery/charging state, room conditions, camera, and start temperature if available.
2. Close unrelated applications and browser tabs. Disable battery saver and keep display brightness fixed.
3. Load the configuration from a fresh route. Capture cold runtime/model download and initialization time separately.
4. Confirm requested backend/provider equals actual backend/provider. Reject the run if it silently falls back.
5. Warm the configuration for two minutes with representative upper-body movement.
6. Record one 60-second measurement window and download/copy its self-describing telemetry snapshot.
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

## Host Integration Evidence

These Chromium/Linux measurements validate runtime paths and telemetry shape; they do not substitute for the fixed Android comparison.

| Configuration | Load | Inference/total | Effective rates/age | Result |
| --- | ---: | --- | --- | --- |
| ONNX strict WASM direct synthetic frame | 541.4ms | 71.8ms inference | n/a | Seven normalized points, main-thread/WASM, no fallback |
| ONNX WASM integrated person-video route | 556ms | current 25–26ms; quick-window average 35–38ms | 11fps submissions, 12–13fps pose, 6ms output age, 0 drops | Seven overlay points; selected/effective telemetry agrees |
| MediaPipe CPU-WASM direct | 1,077ms | estimates 137.4, 19.2, 18.1, 18.2, 17.3ms | n/a | Seven normalized points |
| MediaPipe CPU-WASM integrated | 1,156ms | current about 20ms; quick-window average 59ms | 8fps submissions, 13fps pose, 6ms output age, 0 drops | Seven overlay points |
| MediaPipe GPU-WebGL direct/integrated | about 1,055ms | first 1,805–1,850ms; warm 93–100ms | Not comparable | Headless Chromium software WebGL; not phone guidance |
| ONNX WebGPU | unavailable | n/a | n/a | Playwright exposes no `navigator.gpu`; provider did not silently mix with WASM and effective replay fallback was explicit |

MediaPipe emitted vendor-internal WebGL/feedback/projection warnings and an informational XNNPACK error-level line during successful host inference; no page errors occurred. Physical Android runs must record whether these messages correspond to user-visible instability.

## Target Android Device

- Device: moto g power 5G 2024
- Android: 15
- Build: `V1UDS35H.26-14-6-2-9`
- Chrome: `151.0.7922.173`
- Charging/thermal/start battery: capture with the physical run

Telemetry commit `4783f02` automatically records every selected UI option plus route, user agent, platform/language, hardware concurrency, device-memory availability, viewport, screen, device pixel ratio, and orientation. The OS build above remains an operator-supplied test fact because the browser does not expose it reliably.

Round 2 source files remain at `/home/derrick/Downloads/telemetry/round2/`; parsed values, validity decisions, and exact raw-file SHA-256 fingerprints are preserved in [`telemetry/android-round2-summary.md`](telemetry/android-round2-summary.md).

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
| `movenet-webgl` | 1 | 27,594ms | 125ms | 126ms | 7 | 8 | 3ms | 133ms | WebGL / false | 7 landmarks, 0 drops; short screen |
| `mediapipe-wasm` | 1 | 3,561ms | 77ms | 78ms | 12 | 12 | 14ms | 67ms | WASM / false | 7 landmarks, 0 drops; short screen |
| `mediapipe-webgl` | 1 | 564ms | 79ms | 79ms | 11 | 12 | 2ms | 67ms | WebGL / false | 7 landmarks, 0 drops; short screen |
| `onnx-wasm` | 1 | Rejected | n/a | n/a | n/a | n/a | n/a | n/a | replay / true | Pre-model-route-fix HTML caused protobuf parse failure; rerun required |
| `onnx-webgpu` | 1 | Unavailable | n/a | n/a | n/a | n/a | n/a | n/a | replay / true | Chrome could not obtain GPU adapter; no requested-provider landmarks |

## Physical Screening Recommendation

**Current leader: MediaPipe Pose Landmarker Lite with the GPU-WebGL delegate**, with CPU-WASM as the compatibility fallback.

- MediaPipe GPU-WebGL was effective without fallback, produced all seven landmarks with zero drops, and improved this phone's MoveNet result from 126ms average total CV / 8 pose fps / 133ms media-pose delta to 79ms / 12 pose fps / 67ms. It also loaded in 564ms and had the freshest captured output at 2ms.
- MediaPipe CPU-WASM was nearly tied at 78ms average total CV, 12 pose fps, and 67ms media-pose delta, but loaded in 3,561ms and had 14ms captured output age. It is the safer compatibility route when WebGL delegate behavior is unstable on another device.
- MoveNet WebGL remains broadly compatible but was clearly slower in this screen: 126ms average total CV, 7fps submissions, 8 pose fps, and a 27,594ms cold load.
- ONNX WebGPU is not available on this phone/browser because Chrome could not acquire a GPU adapter. The explicit replay fallback must not be attributed to ONNX.
- ONNX WASM has not yet received a valid phone measurement. Its protobuf parse failure came from the model URL returning the SPA HTML fallback before the live route was repaired, not from a demonstrated model/runtime incompatibility. A corrected rerun is required before ruling it out.
- Even if ONNX WASM matches MediaPipe latency, its 13.35MB FP32 model plus roughly 25.75MB WASM candidate is substantially heavier. It should replace MediaPipe only for a material and repeatable phone advantage.

The three successful files are short screening windows rather than the documented two-minute warm-up plus 60-second measurement. The recommendation is therefore directional, not a thermal/stability guarantee. Final selection awaits one corrected ONNX WASM snapshot after refreshing the repaired live route. The ONNX WebGPU availability result does not need to be repeated.
