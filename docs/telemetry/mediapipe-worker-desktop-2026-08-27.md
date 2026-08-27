# MediaPipe Worker Desktop Control — 2026-08-27

## Scope

Matched automated desktop control for the physical-phone worker experiment. This is capability, scheduling, provider, and timing evidence—not motion-quality evidence. Chromium ran headless against the real Vite assembly at `http://127.0.0.1:5173/`, MediaPipe Tasks Vision 1.0.1, Pose Landmarker Lite float16/1, standard 0.5/0.5/0.5 thresholds, a 640x480 30fps synthetic canvas camera, and 192x144 inference input. Every lane completed the bounded 120-sample timing window. The synthetic scene intentionally produced zero valid poses, so all 120 frames were truthfully reported incomplete.

Raw captures were produced by `/tmp/aerobeat-worker-desktop-probe.mjs` into `/tmp/aerobeat-worker-desktop-evidence.json` and `/tmp/aerobeat-main-thread-desktop-evidence.json`. Temporary files are not product sources; the durable measured summary is below.

## Matched results

| Lane | Actual execution/provider | load | adapter p50/p95/max | total p50/p95/max | over budget | output | callback gap p50/p95/max | output age | media-pose delta | drops / retired |
| --- | --- | ---: | --- | --- | ---: | ---: | --- | ---: | ---: | --- |
| Main CPU | main-thread / wasm | 1043ms | 12/15/20ms | 13/16/21ms | 0/120 | 12fps | 33/34/50ms | 22ms | 0ms | 0 / 0 |
| Worker CPU | worker / wasm | 1058ms | 11/13/14ms | 12/14/15ms | 0/120 | 12fps | 33/34/34ms | 54ms | 33ms | 0 / 0 |
| Main GPU | main-thread / webgl | 1020ms | 170/180/192ms | 171/181/193ms | 120/120 | 5fps | 184/200/1733ms | 0ms | 0ms | 0 / 0 |
| Worker GPU | worker / webgl | 1057ms | 172/181/1752ms | 173/183/1753ms | 120/120 | 6fps | 33/167/183ms | 179ms | 203ms | 4 / 4 |

The worker's latest per-frame CPU split was 12ms runtime, 0ms postprocess, and 13ms round trip. The latest GPU split was 174ms runtime, 0ms postprocess, and 176ms round trip. Both lanes loaded in an actual classic worker and disclosed their active provider only after successful Pose Landmarker creation. There was no execution fallback.

## Findings

- CPU-WASM is the safe worker pipeline candidate. Runtime and throughput matched the main-thread control, callback gaps stayed camera-paced, and no frame replacement/retirement occurred. Its cost was about one camera frame of additional freshness: 54ms output age and 33ms media-pose delta versus 22ms/0ms in the control.
- GPU-WebGL was not faster on this software/headless desktop control. Worker isolation changed responsiveness rather than inference cost: callback p50 improved from 184ms to 33ms, but p95 remained 167ms, output freshness regressed to 179/203ms, and four pending transferables were replaced and explicitly retired. One 1752ms warm/outlier result remained in the rolling max.
- The result supports the experiment's success definition: worker execution can protect main-thread callbacks even when model time is unchanged, but transfer/queue freshness must decide whether it is worthwhile.
- Production Direct-full remains unchanged. No desktop result justifies promoting GPU worker or changing defaults.

## Runtime/log truth

CPU logs explicitly created the TensorFlow Lite XNNPACK CPU delegate. Both GPU lanes reported WebGL 2.0 context creation and graph startup. Known MediaPipe/TFLite informational warnings were retained in raw capture; no page exception, worker crash, silent provider fallback, or unbounded queue was observed.

## Remaining proof

Physical moto g power 5G 2024 Chrome evidence is still required for the same matched lanes, real-person stable/fast/occlusion/re-entry quality, preview continuity, and start/stop/restart/switch/dispose lifecycle.
