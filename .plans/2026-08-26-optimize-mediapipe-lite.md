# Optimize MediaPipe Lite Browser Path

**Date:** 2026-08-26
**Status:** Approved / In Progress
**Agent:** cookie
**Umbrella Bead:** `aerobeat-web-cv-q3g`
**Profiling Bead:** `aerobeat-web-cv-q3g.1`
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

## Tasks

### 1. Profile And Rank The Existing Path

**Status:** In Progress

- Inspect adapter/runtime creation, frame input, synchronous `detectForVideo`, normalization, CV scheduler, preview rendering, and allocation/conversion paths.
- Establish host/browser profiling that separates load, adapter call, normalization, CV orchestration, output age, and rendered cadence where possible.
- Determine whether Tasks Vision VIDEO mode already retains ROI/tracking and whether public options can safely reduce detector reacquisition.
- Record candidate impact, risk, browser support, and testability before implementation.

### 2. Implement The Highest-Value Low-Risk Optimization

**Status:** Pending

Candidate order, subject to profiling:

1. remove avoidable frame copies/readbacks/allocations or redundant work;
2. expose and benchmark safe MediaPipe tracking/detection thresholds that reduce detector reacquisition without losing landmarks;
3. evaluate retained ROI or lower-level graph control only if the current Tasks API supports it truthfully;
4. consider runtime version upgrade only with provenance, compatibility, and before/after proof;
5. worker isolation is accepted only if output age and total responsiveness improve, not merely UI-thread occupancy.

### 3. Benchmark Host And Physical Android

**Status:** Pending

- Compare baseline and optimized GPU-WebGL on the same phone/build/camera/preset.
- Capture selected/effective provider, average/current total CV, pose rate, output age, media-pose delta, drops, landmark count, load, and stability.
- Use sufficiently long windows to observe warm behavior and avoid attributing startup averages as steady state.
- Retain CPU-WASM as a control/fallback; reject fallback runs from GPU attribution.

### 4. Coder, QA, Auditor, Landing

**Status:** Pending

- Coder owns implementation and repo-local tests.
- QA independently validates browser behavior and regression telemetry.
- Auditor checks source, evidence, Beads, commits, public boundaries, and push state.
- Update this plan with actual findings, close completed Beads, and push every intentional change.

## Expected Decision

- If optimized MediaPipe GPU materially improves sustained total CV/freshness without instability, adopt it as the browser default recommendation.
- If profiling shows model inference dominates and safe runtime changes do not materially improve it, stop optimization and open the separately approved future direction: a custom quantized seven-keypoint upper-body model.
