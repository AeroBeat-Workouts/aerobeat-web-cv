# Predictive Pose Gameplay Physical-Phone QA

**Date:** 2026-08-27  
**QA Bead:** `aerobeat-web-cv-x85.2`  
**Packet location:** Glitch `C:\Users\derrick\Downloads\telemetry\round6` (copied locally to `/home/derrick/Downloads/telemetry/round6`)  
**Status:** Six matched CPU/GPU packets captured; operator rejects the reduced-cadence and predicted experiments

## Test matrix

Derrick captured MediaPipe Pose Landmarker Lite float16 `/1/`, Standard thresholds, Fast tracking, Direct-full packets for measured/current, measured/8fps, and predicted-gameplay/8fps on both CPU-WASM and GPU-WebGL.

| Provider | Gameplay source | Sample/output rate | CV total p50/p95/max | Budget overruns | Estimated occupancy | Measured/predicted gameplay samples | Presentation target delta |
|---|---|---:|---:|---:|---:|---:|---:|
| CPU-WASM | measured/current | 12 / 12fps | 64 / 78 / 107ms | 49/120 at 67ms | 829ms/s | 140 / 0 | n/a |
| CPU-WASM | measured/8fps | 7 / 7fps | 80 / 88 / 93ms | 0/120 at 125ms | 568ms/s | 155 / 0 | n/a |
| CPU-WASM | predicted/8fps | 7 / 7fps | 80 / 89 / 96ms | 0/120 at 125ms | 586ms/s | 139 / 0 | 33ms |
| GPU-WebGL | measured/current | 11 / 12fps | 64 / 74 / 80ms | 38/120 at 67ms | 780ms/s | 148 / 0 | n/a |
| GPU-WebGL | measured/8fps | 7 / 7fps | 70 / 79 / 88ms | 0/120 at 125ms | 531ms/s | 127 / 0 | n/a |
| GPU-WebGL | predicted/8fps | 7 / 7fps | 72 / 82 / 157ms | 2/120 at 125ms | 546ms/s | 137 / 0 | 100ms |

The reduced-cadence modes lowered callback/inference occupancy and met the wider 125ms budget more often. They did not improve per-inference latency or the operator experience.

## Prediction truth

Neither predicted packet emitted a predicted gameplay sample:

- CPU-WASM: `139` measured, `0` predicted; predictor reset `139/139` measurements as incomplete; `92` frozen prediction ticks.
- GPU-WebGL: `137` measured, `0` predicted; predictor reset `137/137` measurements as incomplete; `133` frozen prediction ticks.
- Latest provenance remained `measured`; no prediction horizon or correction distribution existed.
- GPU CV telemetry reported only four structurally incomplete seven-point frames and CPU reported zero, so the stricter predictor requirement rejected otherwise routable frames when any required landmark confidence was insufficient.

This is safe suppression—no fabricated prediction or stale endpoint was routed—but it also means the physical predicted mode was effectively a lower-cadence measured path and could not improve gameplay feel.

## Stateful gameplay safety

- Measured/current retained legacy event routing and emitted no predicted events.
- Predicted modes emitted zero predicted events and therefore introduced no false predicted action inflation.
- Stateful treatment routing deduplicated repeated semantic intents (`234` CPU and `255` GPU) while retaining measured events.
- Route/query selections were truthful and effective in all six packets.

These are gameplay-input diagnostics only. No web point/workout scorer exists, so the packet does not establish point parity.

## Operator verdict

Derrick's qualitative result:

> “None of the new tests provided a better experience than the baseline, and I wouldn't move forward with them. So far MediaPipe Lite baseline has been the best experience.”

This agrees with the bounded replay oracle (`prediction-does-not-improve-control`) and is stronger than the resource-use improvement: lower occupancy alone does not justify a gameplay mode that feels no better and emitted no physical predictions.

## Recommendation

Reject reduced-cadence prediction for gameplay promotion. Preserve MediaPipe Lite measured/current as the production default and recommended path. Keep any landed experiment code explicitly non-default/experimental unless a separate approved cleanup removes it. A future predictor proposal would require a new plan, a confidence/readiness design that produces bounded predictions on representative physical input, matched scoring-proxy improvement, and a clearly better operator experience.
