# Optimize MediaPipe Lite Browser Path

**Date:** 2026-08-26
**Status:** Approved / In Progress
**Agent:** cookie
**Umbrella Bead:** `aerobeat-web-cv-q3g`
**Profiling Bead:** `aerobeat-web-cv-q3g.1`
**Timing Contract Bead:** `aerobeat-web-contracts-3nk`
**MediaPipe Implementation Bead:** `aerobeat-web-vendor-mediapipe-97p`
**CV Distribution Bead:** `aerobeat-web-cv-q3g.2`
**Instrumentation QA Bead:** `aerobeat-web-cv-q3g.3`
**Physical A/B Bead:** `aerobeat-web-cv-q3g.4`
**Final Audit Bead:** `aerobeat-web-cv-q3g.5`
**Assembly Experiment Bead:** `aerobeat-web-assembly-k88`
**Assembly QA Bead:** `aerobeat-web-assembly-ptl`
**Benchmark UI Bead:** `aerobeat-web-assembly-vp1`
**Benchmark UI QA Bead:** `aerobeat-web-assembly-qdo`
**Discovered Lifecycle Bug:** `aerobeat-web-assembly-sxz`
**Approval:** Derrick selected browser-only MediaPipe Lite optimization before any custom AeroBeat model. Native/mobile integration and interpolation-based scoring are out of scope.

## Goal

Reduce MediaPipe Pose Landmarker Lite latency and/or improve pose freshness on the existing AeroBeat browser path without weakening normalized seven-point scoring truth, latest-frame-wins pacing, explicit provider telemetry, or restart/disposal behavior.

## Baseline

Target phone: moto g power 5G 2024, Android 15, Chrome 151, 480×640 portrait camera, Direct full, fast tracking.

- MediaPipe GPU-WebGL: 79ms average total CV, 12 pose fps, 67ms media-pose delta, 564ms load, 2ms snapshot output age.
- MediaPipe CPU-WASM: 78ms average total CV, 12 pose fps, 67ms media-pose delta, 3,561ms load, 14ms output age.
- GPU snapshot instantaneous values were 57–70ms, so steady-state profiling may expose recoverable overhead.

Source evidence: `docs/pose-backend-benchmark.md` and `docs/telemetry/android-round2-summary.md`.

## Constraints

- Browser implementation only; do not move this work into Godot/native Android.
- Preserve MediaPipe Lite and the generic `AeroPoseAdapter` boundary for this slice.
- Seven raw measured landmarks remain scoring truth; no interpolated/predicted landmarks.
- Do not reduce inference cadence merely to make per-second compute look lower.
- Keep latest-frame-wins and truthful selected/effective/fallback telemetry.
- No model/WASM binaries committed.
- Prefer measured bottleneck removal over speculative refactors.

## Physical-Test UI Clarification

Derrick requested a phone-first benchmark scene before physical capture: hide Services, Inference, Media, pose-flow diagnostics/checkpoint copy, Calibration, Camera, telemetry-ready status, the reusable calibration screen text, and its duplicate Begin Calibration button. Keep hidden diagnostic elements mounted so telemetry snapshots remain complete. Present title, a separate build row, then a rounded collapsible Calibration options card with one dropdown per row and the single route-owned Begin Calibration button. Remove the subtitle and show only a minimal visible timing-window progress indicator alongside telemetry actions.

**Result:** compact scene landed at assembly `9b71c6c`, versioned checkpoint `0.0.17` at `80a4c19`, and is live/verified on `:8443`. Parent 390×844 screenshot plus Playwright validates row order, native chevron collapse/reopen, six one-column controls, one visible calibration button, nine hidden-but-mounted diagnostics, progress from 0 to a nonzero window, live camera activation, and complete snapshot strings. Unit/browser/release/audit/dependency/diff gates pass. Independent QA PASS (`aerobeat-web-assembly-qdo`) reconfirmed the same behavior and complete copied/downloaded telemetry with no defects. QA caught stale visible `0.0.16` metadata from the pre-bump Vite process rather than source; restarting the parent-managed server as `bash-61` made the live Build row truthfully show `0.0.17`.

## Tasks

### 1. Profile And Rank The Existing Path

**Status:** Complete

- Inspect adapter/runtime creation, frame input, synchronous `detectForVideo`, normalization, CV scheduler, preview rendering, and allocation/conversion paths.
- Establish host/browser profiling that separates load, adapter call, normalization, CV orchestration, output age, and rendered cadence where possible.
- Determine whether Tasks Vision VIDEO mode already retains ROI/tracking and whether public options can safely reduce detector reacquisition.
- Record candidate impact, risk, browser support, and testability before implementation.

**Current findings:**

- Full preset passes the live `<video>` element directly; Android telemetry reports 0ms preparation and adapter/total averages are effectively identical, so AeroBeat canvas/downscale orchestration is not the bottleneck.
- Direct microbenchmarks put seven-point normalization at about 0.00013ms/iteration and a seven-point structural clone at about 0.00011ms/iteration on the host. These allocations are immaterial beside 57–79ms phone adapter calls.
- `@mediapipe/tasks-vision@1.0.1` remains the latest stable package. VIDEO mode, one pose, Lite float16, GPU, and masks-off are already configured.
- The return overload's documented high-throughput warning is specifically about copying result masks; AeroBeat disables masks. Inspection of the installed compiled Pose Landmarker confirms callback and return paths both construct the same landmark/world-landmark result object; only segmentation-mask handling branches on callback presence. Callback delivery is therefore not an AeroBeat optimization.
- Pose Landmarker exposes detection/presence/tracking thresholds (defaults 0.5). Although generic image-processing typings expose ROI, the compiled Pose Landmarker constructs the task with ROI support disabled and throws if ROI is supplied. Retained ROI requires a lower-level/custom graph and is not this slice.
- Controlled host software-WebGL person-image means were 93.84ms at 480×640, 93.78ms at 256×192, 94.75ms at 192×144, and 94.24ms at 160×120. Fixed graph/model compute dominates; external downscale adds work without improving adapter time.
- Callback delivery measured 95.36ms versus 94.10ms for return delivery, confirming no gain. Renderer GPU contention remains plausible but unproven and is deferred to an overlay-on/off control only if threshold tuning is negative.
- Tracking-threshold A/B is the selected first implementation because VIDEO mode already tracks internally and confidence governs detector fallback. It must record rolling p50/p95/max, over-budget frames, incomplete seven-point frames, output freshness, fast motion, occlusion, and reacquisition before any lower threshold becomes default.

### 2. Implement The Highest-Value Low-Risk Optimization

**Status:** In Progress

Selected implementation slice:

1. add generic optional runtime-inference/postprocess timing fields;
2. add bounded rolling CV p50/p95/max, over-budget, and incomplete-seven-point telemetry;
3. add validated MediaPipe creation-time detection/presence/tracking confidence options while retaining 0.5 defaults;
4. expose a stable visible `standard` versus `responsive` MediaPipe tuning experiment in assembly, where responsive uses presence 0.4 and tracking 0.3;
5. benchmark both profiles in one build and adopt responsive only if latency tails/freshness improve without drift, missing points, or slower reacquisition.

**Implementation results so far:**

- Generic timing contract landed/pushed at contracts `822d5d1`: optional `runtimeInferenceDurationMs` and `postprocessDurationMs`, with end-to-end `estimateDurationMs` preserved.
- MediaPipe creation-time threshold controls and timing split landed/pushed at vendor `e2f40e1`; standard behavior remains exactly 0.5/0.5/0.5, invalid values reject, execution detail self-describes thresholds, and seven measured names/lifecycle/provider truth remain unchanged.
- Bounded CV distribution landed/pushed at `4d2a879`: 120 completed estimates, nearest-rank adapter/total p50/p95/max, strict cadence-budget count, incomplete-seven-point count, and generic runtime/postprocess passthrough. The window excludes failures, persists stop/start/dispose, and resets with a new service instance.
- Parent verification reran MediaPipe and CV unit/browser/audit-high/diff gates successfully. Instrumentation QA passed after the precision fix.
- Assembly tuning selector, URL policy, adapter wiring, active/not-applicable telemetry, rapid-switch tests, and README landed/pushed at `d18e89f`; phone checkpoint version `0.0.16` landed at `6066c4d`.
- Parent validation passed assembly unit/browser/release/audit-high/dependency/diff gates. Raw `0.0.16` release proof includes all backend markers and required runtime assets.
- Independent assembly QA PASS is recorded in `aerobeat-web-assembly-ptl`: exact thresholds/default/invalid/not-applicable behavior, active snapshot/provider truth, seven measured landmarks, rolling fields, copy/download, latest-wins/exactly-once retirement, release markers, no tracked binaries, and clean pushed parity all passed.

### 3. Benchmark Host And Physical Android

**Status:** Complete

- Compare baseline and optimized GPU-WebGL on the same phone/build/camera/preset.
- Capture selected/effective provider, average/current total CV, pose rate, output age, media-pose delta, drops, landmark count, load, and stability.
- Use sufficiently long windows to observe warm behavior and avoid attributing startup averages as steady state.
- Retain CPU-WASM as a control/fallback; reject fallback runs from GPU attribution.

**Evidence document:** `docs/telemetry/mediapipe-lite-optimization.md`

**Physical checkpoint:** compact assembly `0.0.17` (`80a4c19`) is verified and live on the existing Tailscale HTTPS `:8443` route; Physical A/B Bead `aerobeat-web-cv-q3g.4` is claimed. The unrelated DSH GUI `:8444` route remains untouched.

**Host A/B evidence:**

- Headless Chromium software-WebGL processed the same 6.0s boxing punch fixture, with one unmeasured warm-up and 80 measured frames per task in standard/responsive/responsive/standard order.
- Standard replicates: mean 117.23/117.13ms, p50 116.10/116.60ms, p95 122.90/123.40ms, zero missing-seven frames.
- Responsive replicates: mean 116.12/115.17ms, p50 116.10/115.30ms, p95 120.00/120.30ms, zero missing-seven frames.
- This is a small directional 1–2% mean and roughly 2–3% p95 change under software rendering, not evidence to change the default by itself.

**Physical Android A/B evidence:**

- Round 3 supplied matching `0.0.17` Standard and Responsive snapshots on the same phone/browser/camera/Fast/Direct-full GPU-WebGL path; both reached `120/120`, reported actual WebGL GPU-delegate execution, no selection/adapter fallback, zero incomplete seven-point frames, zero drops, 11fps submission, and 12fps pose output.
- Standard: average adapter/total 75/76ms; adapter p50/p95/max 64/74/84ms; total 64/74/84ms; 43/120 over budget; output age 7ms; media-pose delta 33ms.
- Responsive: average adapter/total 73/73ms; adapter p50/p95/max 63/74/82ms; total 63/75/82ms; 31/120 over budget; output age 2ms; media-pose delta 33ms.
- Responsive improved central tendency, max, and over-budget count without incomplete frames or cadence loss, but did not improve physical total p95 or media-pose delta. Derrick reported no visible difference in drift, false poses, or reacquisition after the instructed stable/fast-motion/occlusion/re-entry sequence. Standard remains default because the unchanged model's small timing differences do not justify weaker tracking/presence thresholds.
- Exact raw snapshots and SHA-256 hashes are preserved under `docs/telemetry/raw/`; full analysis is in `docs/telemetry/mediapipe-lite-optimization.md`.

### 4. Coder, QA, Auditor, Landing

**Status:** In Progress

- Coder owns implementation and repo-local tests.
- QA independently validates browser behavior and regression telemetry.
- Auditor checks source, evidence, Beads, commits, public boundaries, and push state.
- Update this plan with actual findings, close completed Beads, and push every intentional change.

**Conditional audit:** `aerobeat-web-cv-q3g.5` reports PASS for all landed source, public boundaries, QA, lifecycle, provider/default/fallback truth, seven measured points, timing math, binary policy, host methodology, release `0.0.16`, and clean pushed parity. No code defects remain. Final PASS and Bead closure are withheld solely for the physical Android A/B/default decision.

**Physical blocker resolved:** Derrick supplied both physical snapshots from the compact `0.0.17` checkpoint in round 3. Independent compact-scene QA (`aerobeat-web-assembly-qdo`) also passed live `390×844` Tailscale proof, hidden telemetry completeness, primary camera activation, progress, release, binary policy, and clean pushed parity. Final auditor re-review and Bead/Git/server closure remain.

## Debugging Record

### Rapid Generations Retired The Same CV Service Twice

- **Observed path:** a stale selection generation terminally disposed the current CV service, then returned without replacing it; the queued winning generation read the same still-current service object and disposed it again before replacement.
- **Why it matters here:** a visible MediaPipe tuning control creates the same rapid replacement pressure as backend/provider switching. Vendor disposal is idempotent, but assembly's replacement contract and prior test claim exactly-once retirement.
- **Corrective action:** coordinator-scoped weak identity tracking provides `retireOnce(resource, disposer)`, shares retirement across stale/winning generations, and removes the identity if disposal rejects so recovery can retry.
- **Verification:** deterministic test forces a winning request during the stale generation's in-flight disposal and asserts one old-service disposal plus one latched live restart. Fix commit `ff2b9e9` is pushed; full assembly `npm test`, audit-high zero, and diff check pass. Bead remains open for QA/audit.

### Browser Assertions Initially Contradicted Telemetry Truth

- **Observed failures:** assembly Playwright timed out first on a snapshot hardcoded to `Incomplete seven-point frames: 0`, then on active MediaPipe status expecting `actual gpu-webgl` before adapter load.
- **Execution path:** rapid-switch fixture returned successful empty/incomplete MoveNet frames, so its rolling incomplete count truthfully matched the window; a fresh MediaPipe route had not called `load()`, so actual provider truthfully remained `unknown` while requested/selected were GPU-WebGL.
- **Root cause:** new browser expectations asserted desired values rather than the controlled fixture and lifecycle state; implementation telemetry was correct.
- **Corrective action:** require a numeric incomplete count for the incomplete fixture, retain exact zero for the untouched MediaPipe window, and require actual provider `unknown` before load. Do not fake provider success or suppress incomplete counts to satisfy tests.
- **Verification:** targeted browser validation passes after both truth-preserving assertion corrections; full release gates follow before landing.

### Rounded Samples Versus Exact Budget Contradicted Over-Budget Telemetry

- **Problem:** `timingWindowOverBudgetCount` claimed strict-greater classification but retained durations at 0.1ms while comparing them to the exact cadence interval.
- **Observed symptom:** at 15fps, raw 66.66ms became visible 66.7ms; visible budget was 66.7ms; count was nevertheless 1 because 66.7 was compared to internal 66.666…ms.
- **Expected behavior:** displayed sample, displayed budget, and strict-greater count agree at boundary precision.
- **Execution path:** `recordTiming()` rounds the duration before inserting it into `timingWindow`; `getStatus()` calls `summarizeTimingWindow(window, submissionIntervalMs)` with the unrounded interval; summary compares the rounded sample against that raw budget.
- **Root cause:** mixed precision, not percentile math or scheduler cadence.
- **Alternative rejected:** retaining raw classification alone would still allow visibly equal rounded values to produce opposite counts. The telemetry boundary must use one disclosed precision.
- **Minimal reproduction:** 15fps service plus one deterministic 66.66ms estimate.
- **Corrective action:** compare retained rounded samples against the same rounded budget exposed by status, and add below/equal/above boundary tests.
- **Verification:** QA Bead `aerobeat-web-cv-q3g.3` initially failed and filed discovered bug `aerobeat-web-cv-8gz`. Fix `ea24144` uses the same reported 0.1ms budget for status and strict comparison and adds below/equal/above boundary coverage. Independent QA retest passed all boundary, unit, browser, audit-high, and diff gates; bug `8gz` is closed and QA evidence is pushed at `dda2eb9`.

### Phone Timing Progress Temporarily Showed Undefined

- **Observed symptom:** Derrick reported the phone's new progress pill said `undefined` after the Vite process had been restarted for fresh `0.0.17` build metadata.
- **Execution path:** the pill reads the CV service's mandatory `timingWindowSampleCount/timingWindowCapacity`; an already-open physical tab can retain its pre-restart in-memory app/service because restarting Vite does not force that tab to reload.
- **Evidence:** production CV source and unit tests expose numeric fields; fresh local and Tailscale sessions showed `0/120`; QA passed a nonzero live-camera update; both downloaded physical snapshots subsequently contain `120/120` in standalone and hidden-panel telemetry.
- **Root cause:** stale physical-tab runtime across the server restart, not a source/status-contract defect.
- **Corrective action:** reopen the physical checkpoint after a managed server restart. No source suppression or fabricated fallback count was added.

## Decision

- Keep Standard `0.5/0.5/0.5` as the browser default and retain Responsive as an explicit experiment.
- Safe browser/runtime work is exhausted for this slice: model inference dominates, lower confidence thresholds did not materially improve the physical p95/freshness measures, and lower cadence is not treated as latency optimization.
- Do not automatically start custom-model work from this result; that remains a separate future decision.
