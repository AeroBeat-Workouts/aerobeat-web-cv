# Android Pose Backend Telemetry — Round 2

**Captured:** 2026-08-26 22:17–22:21 UTC  
**Source directory:** `/home/derrick/Downloads/telemetry/round2/`  
**Device:** moto g power 5G 2024, Android 15, build `V1UDS35H.26-14-6-2-9`  
**Browser:** Chrome `151.0.7922.173`; telemetry UA reports Chrome `151.0.0.0`  
**Display/runtime:** 432×865 viewport, 432×960 screen, DPR 2.5, portrait, 8 logical processors, 8 GiB exposed device memory  
**Camera/preset/profile:** Default camera, 480×640 portrait input, Direct full, fast tracking

## Results

| Configuration | Load | Average adapter / total | Submission / pose | Output age | Media-pose delta | Actual route | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| MoveNet WebGL | 27,594ms | 125 / 126ms | 7 / 8fps | 3ms | 133ms | MoveNet/WebGL, no fallback | 7 landmarks, 0 drops; baseline/not sufficient band |
| MediaPipe CPU-WASM | 3,561ms | 77 / 78ms | 12 / 12fps | 14ms | 67ms | MediaPipe/WASM, no fallback | 7 landmarks, 0 drops; marginal band and materially better than MoveNet |
| MediaPipe GPU-WebGL | 564ms | 79 / 79ms | 11 / 12fps | 2ms | 67ms | MediaPipe/WebGL, no fallback | 7 landmarks, 0 drops; marginal band, fastest load/freshest output |
| ONNX Runtime WASM | 0ms | n/a | n/a | n/a | n/a | Effective MoveNet replay; fallback true | **Rejected infrastructure run:** protobuf parsing failed because this snapshot predates restoration of the live ONNX model route; no requested-provider landmarks |
| ONNX Runtime WebGPU | 0ms | n/a | n/a | n/a | n/a | Effective MoveNet replay; fallback true | **Unsupported on this phone/browser:** Chrome could not obtain a GPU adapter; no requested-provider landmarks |

The ONNX replay output ages/media deltas are not performance measurements and are intentionally omitted. Both snapshots truthfully identify replay fallback. The WASM snapshot was captured before the live model route was corrected from a 441-byte SPA HTML fallback to the verified 13,350,364-byte ONNX model, so its protobuf parse failure does not establish ONNX WASM device incompatibility. The WebGPU failure occurs at GPU-adapter acquisition and is a valid device/browser availability result.

The captured inference-frame counts imply short active windows (roughly 18 seconds MoveNet, 20 seconds MediaPipe CPU, and 48 seconds MediaPipe GPU at the reported rates), not the documented two-minute warm-up plus 60-second measurement window. These files therefore support a physical screening recommendation, not thermal or statistical claims.

## Raw Snapshot Fingerprints

| Snapshot | Configuration | SHA-256 |
| --- | --- | --- |
| `aerobeat-telemetry-2026-08-26T22-17-01-720Z.txt` | MoveNet WebGL | `72fd0f6994abf9f057d37f0de5a5af5de267fadc394aa26010b5df808f90bf86` |
| `aerobeat-telemetry-2026-08-26T22-17-38-762Z.txt` | MediaPipe CPU-WASM | `da235c6772fcd57c7392e4c12385fa4a04014d61d4aa4f2c5c2fdc218dc8a5ac` |
| `aerobeat-telemetry-2026-08-26T22-18-36-142Z.txt` | MediaPipe GPU-WebGL | `8a99e1bd135a1f761e87987ce520419a8660d7245308d27096deca3635787651` |
| `aerobeat-telemetry-2026-08-26T22-20-12-301Z.txt` | ONNX Runtime WASM | `a332a5df90d193934233e5862d69f3b66d3dc98d28aa93187fe09989b887fa88` |
| `aerobeat-telemetry-2026-08-26T22-21-01-576Z.txt` | ONNX Runtime WebGPU | `e39dcebc5d35f07672fed0e4a7569a38ba0f273d51a2ac61506cc28dc8013f11` |
