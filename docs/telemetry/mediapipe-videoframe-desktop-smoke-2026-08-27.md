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
- Browsers without global `VideoFrame` or HTMLVideoElement rVFC/cancel support do not expose or accept this preset; non-HTMLVideoElement sources and samples lacking exact rVFC `mediaTime` fail explicitly.

## Live Lifecycle Switch Smoke

A separate real-runtime Chromium smoke against assembly checkpoint `0.0.23` used one retained synthetic 640×480 camera stream and changed live services through the actual selectors:

| Stage | Observed truth |
|---|---|
| Start CPU VideoFrame worker | CV running; worker execution; requested/selected CPU-WASM; actual `wasm`; `VideoFrame` transfer; 3+ inferences |
| Switch worker → Direct-full | CV remained running after serialized retirement/restart; main-thread CPU WASM; transfer `n/a`; inference count advanced |
| Switch CPU → GPU VideoFrame worker | CV running; worker execution; requested/selected GPU-WebGL; actual `webgl`; `VideoFrame` transfer; inference count advanced |
| Switch worker → MoveNet backend | VideoFrame preset was retired and reset to Direct-full; main-thread WebGL composition became active |
| Close browser | Page disconnected without a page error; deterministic adapter/CV tests separately assert accepted/pending frame retirement, terminal worker/task disposal, and late-result invalidation |

All stages completed without page errors. This adds real Tasks lifecycle composition evidence to the deterministic ownership/disposal tests; it is still desktop synthetic-camera evidence rather than physical-phone quality evidence.
