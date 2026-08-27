# MediaPipe Transferable VideoFrame Desktop Smoke — 2026-08-27

## Scope

Compatibility smoke only for the explicit `Experimental worker transferable VideoFrame` preset. It used the real `@mediapipe/tasks-vision@1.0.1` Pose Landmarker Lite runtime/model in headless Chromium 151 on Linux x86_64, with a synthetic 640×480 30fps canvas capture stream. It is not a physical-device performance result.

Command:

```bash
AEROBEAT_SMOKE_URL=http://127.0.0.1:5174/ node scripts/validate-real-mediapipe-videoframe-smoke.mjs
```

The script is owned by `aerobeat-web-assembly/scripts/validate-real-mediapipe-videoframe-smoke.mjs` and fails on page/console errors (apart from the known Tasks CPU delegate informational message), missing global `VideoFrame`, missing MediaPipe-only preset, incorrect provider/location, absent `VideoFrame` transfer truth, or absent direct transfer path.

## Results

| Delegate | Actual provider | Location | Transfer/path | Prep | Runtime/round trip | Rolling total window |
|---|---|---|---|---:|---:|---:|
| CPU-WASM | `wasm` | worker | `VideoFrame`; direct HTMLVideoElement → transferable VideoFrame | 0ms | latest 17/18ms | 3 samples; p50 18ms, p95/max 124ms |
| GPU-WebGL | `webgl` | worker | `VideoFrame`; direct HTMLVideoElement → transferable VideoFrame | 0ms | latest 180/181ms | 2 samples; p50 181ms, p95/max 1896ms |

Both lanes loaded the actual pinned model/runtime, transferred `VideoFrame`, produced normalized inference results, and emitted no unexpected page/console error. The GPU lane's 1896ms warm-up outlier is expected to be dominated by headless/software-WebGL conditions and must not be used as a device recommendation.

## Interpretation And Risks

- Tasks Vision 1.0.1 accepts a transferred `VideoFrame` in both CPU and GPU classic-worker lanes in this Chromium environment.
- Frame preparation measured 0ms at telemetry precision, proving this lane avoids the canvas/ImageBitmap preparation observed in the bitmap worker control.
- This smoke proves compatibility and telemetry truth only. Physical Android Chrome must still prove throughput, freshness, lifecycle stability, and whether full 640×480 VideoFrame input changes runtime cost.
- Browsers without global `VideoFrame`, non-HTMLVideoElement sources, or schedules lacking exact rVFC `mediaTime` fail explicitly with no fallback.
