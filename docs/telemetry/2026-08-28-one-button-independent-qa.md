# One-button scene independent QA

- Date: 2026-08-28
- QA Bead: `aerobeat-web-cv-hup` (left `in_progress` for audit; not closed)
- Assembly revision: `4b00424`
- CV plan revision inspected: `621a75a`
- Browser: Playwright Chromium 151.0.7992.34 on Linux x86_64
- Viewports: desktop 1280x900 and phone 390x844
- Camera proof boundary: Chromium `navigator.mediaDevices.getUserMedia()` was instrumented to record constraints, delay resolution so the requesting state could be observed, and return an advancing 640x480 30fps canvas-captured `MediaStream`. This verifies permission invocation, stream attachment/lifecycle, video-frame advancement, and real MediaPipe WebGL processing without claiming a physical camera was used.

## Result

**PASS — no defects found in this QA slice.**

## Browser observations

At both viewports, a recursive walk through the scene shadow tree found:

- `details`: 0
- `summary`: 0
- `aero-select`: 0
- chevron class/part matches: 0
- legacy classes (`calibration-options`, `calibration-options-content`, `test-controls`, backend/provider/tuning/camera/tracking/gameplay/CV select classes): none
- visible setup actions: exactly 1, labeled `Begin calibration`
- reusable hidden calibration command: mounted and not visible
- hidden diagnostics container and inference/calibration components: mounted; container computed `display: none`

First-viewport button bounds were desktop `(368, 183.80)-(525.22, 219.80)` inside 1280x900 and phone `(12, 161.59)-(169.22, 197.59)` inside 390x844. Screenshots show the button above the preview with no clipping.

One click directly produced one camera request with `{ audio: false, video: { facingMode: "user" } }` and no device/width/height override. While the delayed permission promise was pending, the visible label became `Calibration running`, calibration reported active, and camera state truthfully reported `Camera permission: requesting`. After permission resolved, the track was `live`, the preview video had a `MediaStream` attached at 640x480, media reported `live-camera aero.mediapipe.live / playback playing`, and camera state reported granted/live inference.

At both viewports, live inference frame count and pose timestamp advanced after startup. The hidden inference state proved the locked route:

- MediaPipe Pose Landmarker Lite float16 `/1/` via Tasks Vision 1.0.1
- requested/selected GPU-WebGL and actual WebGL
- Standard thresholds `0.5 / 0.5 / 0.5`
- Fast tracking
- Direct full, camera default, full input, no resize
- measured/selected/effective measured (current path)
- sample target 15fps

The visible timing pill progressed from `Timing window 0/120` to `Timing window 120/120` on both desktop and phone. Preview rendering remained active. `Copy telemetry` populated the visible output exactly with a complete snapshot, and `Download telemetry` produced an `aerobeat-telemetry-*.txt` complete snapshot. Copy and download are independently captured live snapshots, so their timestamps/counters can differ while both contain the required route/preset/timing markers.

Unsupported query diagnostics (`poseBackend=movenet`, `poseProvider=webgl`, `mediaPipeTuning=reckless`) normalized to MediaPipe / GPU-WebGL / Standard, retained fallback explanations in telemetry, and did not restore any selector surface. Reload at both viewports returned to the one-button `Timing window 0/120` scene with hidden diagnostics mounted. Browser console/page-error collection found zero unexpected warnings or errors; only the test gate's allowlisted MediaPipe/WebGL runtime warnings appeared.

Layout measurements before startup, after `120/120`, and after reload showed `scrollWidth === clientWidth` (1280 desktop, 390 phone) with no horizontally clipped visible shadow-tree elements.

## Gates

All commands ran in `aerobeat-web-assembly` at `4b00424`:

- `npm test` — PASS (checks, Chromium console/browser test, cadence, registry, gameplay source, predictive routing)
- `npm run test:browser` — PASS
- `npm run build-release` — PASS; raw 0.0.23 MediaPipe-only proof, 1,456,685 artifact bytes before manifest
- `git diff --check` — PASS
- Assembly parity — clean `main...origin/main`, local and remote `4b00424`

## Evidence files

- `2026-08-28-one-button-chromium-observations.json` — raw structured observations, state text, route normalization, telemetry checks, layout metrics, and console records
- `2026-08-28-one-button-desktop-initial.png`
- `2026-08-28-one-button-desktop-live.png`
- `2026-08-28-one-button-phone-initial.png`
- `2026-08-28-one-button-phone-live.png`
