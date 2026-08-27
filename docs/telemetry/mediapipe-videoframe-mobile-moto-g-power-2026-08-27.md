# MediaPipe Transferable VideoFrame Mobile Evidence — 2026-08-27

## Scope

Matched physical-phone comparison of the explicit `Experimental worker transferable VideoFrame` preset against Direct-full on the moto g power 5G 2024 using Android Chrome 151. All four packets used assembly version `0.0.23`, MediaPipe Pose Landmarker Lite float16 `/1/`, Standard thresholds, Fast tracking, the default 480×640 front-camera stream, and complete 120-sample timing windows.

Raw operator packets remain at `/home/derrick/Downloads/telemetry/round5/`:

- `aerobeat-telemetry-2026-08-27T19-01-15-787Z.txt` — CPU-WASM Direct-full
- `aerobeat-telemetry-2026-08-27T19-01-43-287Z.txt` — CPU-WASM VideoFrame worker
- `aerobeat-telemetry-2026-08-27T19-02-04-402Z.txt` — GPU-WebGL Direct-full
- `aerobeat-telemetry-2026-08-27T19-02-24-456Z.txt` — GPU-WebGL VideoFrame worker

No round-5 qualitative operator comparison was supplied with the files, so this result does not invent one.

## Provider, Path, And Completeness Truth

| Lane | Requested/selected/actual provider | Location | Transfer/path | Input | Complete seven-point frames |
|---|---|---|---|---:|---:|
| CPU Direct-full | CPU-WASM / CPU-WASM / `wasm` | main thread | live HTMLVideoElement; no resize; transfer n/a | 480×640 | 120/120; 0 incomplete |
| CPU VideoFrame worker | CPU-WASM / CPU-WASM / `wasm` | classic worker | direct HTMLVideoElement → transferable `VideoFrame`; no canvas | 480×640 | 120/120; 0 incomplete |
| GPU Direct-full | GPU-WebGL / GPU-WebGL / `webgl` | main thread | live HTMLVideoElement; no resize; transfer n/a | 480×640 | 120/120; 0 incomplete |
| GPU VideoFrame worker | GPU-WebGL / GPU-WebGL / `webgl` | classic worker | direct HTMLVideoElement → transferable `VideoFrame`; no canvas | 480×640 | 120/120; 0 incomplete |

All lanes reported selection fallback `none`, adapter fallback `false`, the same pinned model and thresholds, and live rVFC sampling. The worker packets therefore prove physical Android support for actual CPU and GPU worker execution plus `VideoFrame` transfer; they do not merely reflect requested settings.

## Matched Timing And Freshness

| Metric | CPU Direct | CPU VideoFrame worker | GPU Direct | GPU VideoFrame worker |
|---|---:|---:|---:|---:|
| Prep p50/p95/max | 0/0/1ms | 0/1/1ms | 0/0/1ms | 0/0/1ms |
| Runtime p50/p95/max | 65/76/87ms | 79/114/178ms | 62/72/83ms | 67/83/101ms |
| Worker round trip p50/p95/max | n/a | 80/115/178ms | n/a | 69/85/101ms |
| Total CV p50/p95/max | 65/77/87ms | 80/115/179ms | 62/72/83ms | 69/86/102ms |
| Over 67ms budget | 48/120 | 116/120 | 33/120 | 76/120 |
| Sample / pose-output rate | 12 / 12fps | 12 / 12fps | 11 / 12fps | 11 / 11fps |
| Callback gap p50/p95/max | 64/79/94ms | 33/51/66ms | 58/79/85ms | 33/50/52ms |
| Overlay rate | 12fps | 23fps | 11fps | 23fps |
| Submitted sample age | 77ms | 117ms | 64ms | 58ms |
| Output age | 7ms | 143ms | 6ms | 56ms |
| Media-pose delta | 67ms | 234ms | 33ms | 133ms |
| Retired transferables / dropped | 0 / 0 | 8 / 8 | 0 / 0 | 10 / 10 |

The packet is a live snapshot, so age fields and the inference-panel copy can differ by one status tick. The table consistently uses the top-level downloadable telemetry fields.

## Interpretation

- The VideoFrame path removed canvas/ImageBitmap preparation, but Direct-full already measured 0ms preparation. There was no preparation cost left to recover.
- Worker execution materially improved main-thread scheduling: callback p50 fell to 33ms and overlay cadence rose to 23fps in both worker lanes.
- That responsiveness trade did not improve pose freshness or end-to-end latency. CPU total p50/p95 regressed by 15/38ms and GPU by 7/14ms. CPU output age/media-pose delta rose to 143/234ms; GPU rose to 56/133ms.
- CPU worker runtime itself regressed substantially. GPU worker runtime also regressed and output cadence fell from 12fps to 11fps.
- Eight CPU and ten GPU transferables were safely retired as stale work. No lane produced an incomplete seven-point frame and no fallback occurred.

## Decision

Reject promotion of transferable VideoFrame workers. They prove a valid bounded physical CPU/GPU worker transport and improve preview/UI scheduling, but they worsen total CV latency, budget compliance, and pose freshness. Together with the earlier ImageBitmap evidence, the experiment does not justify changing the production default. Retain Direct-full main-thread execution as the default and keep worker presets explicitly experimental only.
