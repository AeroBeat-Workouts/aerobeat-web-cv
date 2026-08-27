# MediaPipe Lite Browser Optimization Evidence

**Date:** 2026-08-26  
**Scope:** Browser-only MediaPipe Pose Landmarker Lite float16, seven directly measured AeroBeat scoring landmarks  
**Plan:** `.plans/2026-08-26-optimize-mediapipe-lite.md`  
**Umbrella Bead:** `aerobeat-web-cv-q3g`

## Baseline

Physical baseline used the moto g power 5G 2024, Android 15, Chrome 151, 480×640 camera, Direct full CV preset, 15fps submission ceiling, one pose, VIDEO mode, and segmentation masks disabled.

| Provider | Average total CV | Pose rate | Media-pose delta | Load | Snapshot output age |
|---|---:|---:|---:|---:|---:|
| GPU-WebGL | 79ms | 12fps | 67ms | 564ms | 2ms |
| CPU-WASM control | 78ms | 12fps | 67ms | 3,561ms | 14ms |

These were short directional windows, not thermal/statistical proof. GPU-WebGL remains the recommended provider because CPU-WASM did not improve steady CV cost and loaded substantially slower.

## Bottleneck Findings

- Direct full passes the live `HTMLVideoElement` to `detectForVideo()` without an AeroBeat canvas, resize, `ImageBitmap`, or pixel readback.
- Phone frame preparation was 0ms and adapter time matched total CV time.
- Seven-point normalization measured about 0.000135ms per call on the host.
- Software-WebGL means remained about 94ms when source dimensions changed from 480×640 to 160×120; external downscale does not reduce the fixed MediaPipe graph/model cost.
- Callback delivery measured 95.36ms versus 94.10ms for return delivery. With segmentation masks disabled, both paths construct the same landmark/world-landmark result.
- Generic ROI typing is not usable here: Pose Landmarker 1.0.1 constructs its task with ROI support disabled and throws when ROI is supplied.
- VIDEO mode already tracks internally. The only low-risk public hypothesis that can remove detector fallback work is a creation-time confidence-threshold comparison.

## Compared Profiles

| Profile | Detection | Presence | Tracking | Default status |
|---|---:|---:|---:|---|
| Standard | 0.5 | 0.5 | 0.5 | Current/default behavior |
| Responsive A/B | 0.5 | 0.4 | 0.3 | Experimental; must earn adoption |

Neither profile changes inference cadence, model, provider, seven-point scoring truth, or latest-frame-wins behavior.

## Host Moving-Fixture A/B

Headless Chromium software-WebGL processed the same 6.0-second boxing punch fixture. Each task received one unmeasured warm-up call and 80 measured sequential video frames. Run order was Standard, Responsive, Responsive, Standard.

| Run | Mean | p50 | p95 | Max | Over 66.7ms | Missing seven |
|---|---:|---:|---:|---:|---:|---:|
| Standard 1 | 117.23ms | 116.10ms | 122.90ms | 150.50ms | 80/80 | 0 |
| Responsive 1 | 116.12ms | 116.10ms | 120.00ms | 135.40ms | 80/80 | 0 |
| Responsive 2 | 115.17ms | 115.30ms | 120.30ms | 123.50ms | 80/80 | 0 |
| Standard 2 | 117.13ms | 116.60ms | 123.40ms | 139.70ms | 80/80 | 0 |

Responsive was directionally about 1–2% lower on mean and about 2–3% lower on p95. Software rendering remained over budget for every sample, so this is not sufficient evidence to change the default.

## Physical Comparison Protocol

Use the same build and alternate Standard/Responsive on the same phone, browser, camera, GPU-WebGL provider, and Direct full preset. Run long enough to fill the 120-estimate window. Each run should include:

1. stable guard stance;
2. repeated fast punches and arm swings;
3. brief partial occlusion or exit from frame;
4. re-entry and pose reacquisition.

Capture the built-in telemetry snapshot after the sequence. Reject any run whose actual provider is not GPU-WebGL or whose adapter is a fallback. Compare rolling adapter/total p50, p95, max, over-budget count, incomplete-seven-point count, output age, media-pose delta, pose rate, and visible drift/reacquisition.

Responsive can become the default only if physical evidence shows a repeatable latency-tail or freshness improvement without more incomplete frames, landmark drift, false poses, or slower reacquisition.

## Physical Android A/B — Round 3

Derrick captured both profiles on the same physical phone checkpoint `0.0.17` (`80a4c19`), Chrome 151, portrait 480×640 Default camera, Fast tracking, Direct full, VIDEO mode, and the same requested GPU-WebGL path. Both snapshots report the expected MediaPipe Lite float16 model, actual WebGL execution with the GPU delegate, no selection fallback, no adapter fallback, and `120/120` completed estimates.

| Metric | Standard | Responsive | Responsive − Standard |
|---|---:|---:|---:|
| Average adapter | 75ms | 73ms | −2ms (−2.7%) |
| Average total CV | 76ms | 73ms | −3ms (−3.9%) |
| Adapter p50 / p95 / max | 64 / 74 / 84ms | 63 / 74 / 82ms | −1 / 0 / −2ms |
| Total p50 / p95 / max | 64 / 74 / 84ms | 63 / 75 / 82ms | −1 / +1 / −2ms |
| Over 67ms budget | 43/120 | 31/120 | −12 (−27.9%) |
| Incomplete seven-point frames | 0 | 0 | 0 |
| Submission / pose-output rate | 11 / 12fps | 11 / 12fps | unchanged |
| Snapshot output age | 7ms | 2ms | −5ms |
| Snapshot media-pose delta | 33ms | 33ms | unchanged |
| Dropped frames (hidden panel) | 0 | 0 | unchanged |

The standalone snapshot fields above are the comparison source. Runtime remains live while the snapshot string is assembled, so the separately copied hidden Inference panel can be one status tick later (Standard showed 44 rather than 43 over budget and 75 rather than 74ms total p95 there). Load time is excluded: Standard was the first/cold task load at 8,621ms while Responsive reused the warm browser/runtime path at 769ms.

Compared with the earlier short GPU-WebGL baseline of 79ms average total CV, Standard measured 76ms (−3ms, −3.8%) and Responsive measured 73ms (−6ms, −7.6%). Those before/after values are directional because the baseline was not a matched 120-frame distribution.

Responsive reduced the median, maximum, average, and over-budget count without increasing incomplete frames, drops, or reducing output cadence. It did **not** improve the physical total-CV p95 (75ms versus 74ms) or media-pose delta, and the small inference-time differences are not evidence that lower confidence thresholds make the unchanged model execute faster. After completing the instructed stable stance, fast motion, occlusion/exit, and re-entry sequence, Derrick reported no visible difference between profiles in drift, false poses, or reacquisition.

### Preserved raw evidence

- `raw/mediapipe-lite-round3-standard.txt` — SHA-256 `e58f4d2cc56764c71cba64340ec6e5425f7c77e14518036786735e273bee38f4`
- `raw/mediapipe-lite-round3-responsive.txt` — SHA-256 `a92f45a970ac01d3f43fae94da194330c628e500fe94422a640aaf7e1b0c5c85`

## Current Decision

**Keep Standard 0.5/0.5/0.5 as the default.** Responsive remains an explicit A/B option. The same directional central-tendency improvement appeared on host and phone, but the matched physical run did not improve p95 or media-pose delta, load was not comparable, and Derrick saw no visible stability/reacquisition difference. This is not enough evidence to weaken the default tracking/presence thresholds. No custom AeroBeat model work begins from this result.
