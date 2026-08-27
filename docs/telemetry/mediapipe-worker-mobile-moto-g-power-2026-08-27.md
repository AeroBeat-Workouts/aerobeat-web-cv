# MediaPipe Worker Mobile Evidence — moto g power 5G 2024 — 2026-08-27

## Scope

Physical-device matched control for the bounded MediaPipe Tasks Vision 1.0.1 worker experiment. App checkpoint `0.0.21`; Android Chrome 151; portrait 432×865 CSS viewport; 8 logical cores; 8 GiB reported memory; default 480×640 camera; Fast tracking; Standard thresholds 0.5/0.5/0.5; Pose Landmarker Lite float16 `/1/`; seven measured landmarks.

The operator reported that the four lanes felt similar. Each capture reached the full rolling timing window of 120 completed estimates. Raw captures were collected under `/home/derrick/Downloads/telemetry/round4/` and are summarized below so the evidence survives outside that local download directory.

## Matched Results

| Metric | CPU-WASM Direct 192 | CPU-WASM ImageBitmap worker 192 | GPU-WebGL Direct 192 | GPU-WebGL ImageBitmap worker 192 |
|---|---:|---:|---:|---:|
| Actual provider / location | wasm / main | wasm / worker | webgl / main | webgl / worker |
| Load | 795 ms | 807 ms | 451 ms | 538 ms |
| Prep p50 / p95 / max | 2 / 5 / 8 ms | 8 / 10 / 10 ms | 4 / 8 / 9 ms | 7 / 10 / 11 ms |
| Runtime p50 / p95 / max | 61 / 72 / 93 ms | 68 / 74 / 77 ms | 58 / 67 / 72 ms | 68 / 80 / 89 ms |
| Worker round-trip p50 / p95 / max | n/a | 69 / 75 / 79 ms | n/a | 70 / 85 / 90 ms |
| Total p50 / p95 / max | 64 / 75 / 95 ms | 77 / 84 / 87 ms | **63 / 74 / 79 ms** | 77 / 94 / 96 ms |
| Over 66.7 ms budget | 41 / 120 | 117 / 120 | **35 / 120** | 108 / 120 |
| Incomplete seven-point frames | 0 | 0 | 0 | 0 |
| Sampling callback gap p50 / p95 / max | 63 / 77 / 99 ms | **33 / 50 / 50 ms** | 57 / 76 / 84 ms | 33 / 51 / 57 ms |
| Sample / pose output | 12 / 12 fps | 11 / 11 fps | 11 / 12 fps | 11 / 11 fps |
| Overlay render | 12 fps | 22 fps | 12 fps | **23 fps** |
| Snapshot output age | 7 ms | 12 ms | **4 ms** | 6 ms |
| Snapshot media-pose delta | 67 ms | 167 ms | **33 ms** | 67 ms |
| Capture replacements / retired transferables | 0 / 0 | 0 / 3 | 0 / 0 | 0 / 10 |

## Interpretation

- Quality and useful pose throughput were similar: every lane reported zero incomplete seven-point frames and 11–12 pose outputs per second. This agrees with the operator's perception.
- The worker kept the browser callback cadence materially smoother: callback p50 fell from 57–63 ms to 33 ms, and overlay rendering rose from 12 fps to 22–23 fps.
- That scheduling benefit did not accelerate pose inference. Worker preparation added 3–6 ms at p50 and worker runtime itself was 7–10 ms slower at p50. Total p50 rose by 13–14 ms.
- The worker lanes exceeded the 66.7 ms budget on 90–98% of the retained window, versus 29–34% for direct execution.
- Freshness regressed: the CPU worker snapshot media-pose delta increased by 100 ms and the GPU worker by 34 ms. Workers retired 3 and 10 transferred frames while direct lanes retired none.
- GPU-WebGL Direct 192 was the strongest matched lane, but its small advantage over CPU Direct and the previously measured Direct-full path is not enough to overturn the production Direct-full recommendation without a broader default decision.

## Decision

Do not promote either ImageBitmap worker preset. Preserve Direct-full as the production default. The worker proves a real browser-responsiveness benefit, but on this phone that benefit is offset by higher preparation/runtime latency, more over-budget estimates, frame retirement, and older poses.

A separate explicit transferable `VideoFrame` worker control is justified because it can test whether removing the 7–10 ms canvas/ImageBitmap preparation cost preserves the callback-cadence benefit. It must remain experimental and must beat direct execution on freshness or end-to-end latency—not only callback cadence—to support promotion.
