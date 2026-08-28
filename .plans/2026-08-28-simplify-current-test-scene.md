# Simplify Current MediaPipe Test Scene

**Date:** 2026-08-28  
**Status:** Implementation complete / Awaiting independent QA
**Agent:** cookie  
**Umbrella Bead:** `aerobeat-web-cv-nlt`  
**Implementation Bead:** `aerobeat-web-cv-e5w`  
**QA Bead:** `aerobeat-web-cv-hup`  
**Audit Bead:** `aerobeat-web-cv-j2w`

## Goal

Make the current web CV test scene a one-action experience: remove the entire collapsible Calibration options/chevron section and all visible selection dropdowns, leaving `Begin calibration` as the sole setup control. Activating it must request the live camera and start the locked MediaPipe Lite CV route.

## Locked Runtime

The scene uses the already-audited production defaults: MediaPipe Lite float16 `/1/`, GPU-WebGL, Standard `0.5/0.5/0.5`, Fast tracking, Direct-full, measured/current, 15fps ceiling. This plan does not reopen backend/provider/tuning/performance/gameplay selection.

## Scope

- In `aerobeat-web-assembly`, remove the `<details>` Calibration options wrapper, summary/chevron, seven visible `aero-select` rows, and their scene-only styling/configuration/event plumbing.
- Render one prominent `Begin calibration` button above the preview.
- Keep preview, timing-window progress, telemetry capture/download, and hidden truthful diagnostic panels.
- Preserve query parsing only where tests or non-visible diagnostics still require compatibility; do not expose selection controls again.
- Ensure the button directly activates the existing reusable calibration command, which requests camera permission and starts live CV.
- Update README/docs and Playwright validation to assert the one-button desktop/mobile surface and use query parameters or direct registry tests instead of removed DOM selectors for compatibility diagnostics.

## Invariants

1. No visible selection dropdown, native details summary, or chevron remains.
2. Exactly one visible calibration setup action exists.
3. `Begin calibration` starts camera permission and live MediaPipe CV.
4. Locked defaults remain unchanged.
5. Preview and telemetry remain available for current-path testing.
6. Hidden reusable calibration and diagnostic components remain semantically mounted without creating a duplicate visible action.

## Task 1 — Implementation

**Bead:** `aerobeat-web-cv-e5w`  
**Role:** coder  
**Status:** Complete / Awaiting QA

Simplify assembly source, remove dead visible-control plumbing where safe, update browser/unit assertions and docs, run `npm test`, `npm run test:browser`, `npm run build-release`, and `git diff --check`, then commit/push.

### Implementation Result

- Removed the complete visible `details.calibration-options` tree, summary/chevron, all seven `aero-select` elements, legacy selector classes/styles, select-change listener, phone-control configuration/handlers, camera-switch state, and dynamic service-switch plumbing that existed only for removed controls.
- Added one prominent visible `Begin calibration` command. It activates the hidden reusable calibration command; Playwright proves one camera request, attached live stream, advancing MediaPipe frames, and locked Lite/GPU-WebGL/Standard/Fast/Direct-full/measured-current telemetry.
- Kept preview, `Timing window N/120`, telemetry copy/download/output, hidden reusable calibration component, and hidden truthful diagnostics. Browser assertions prove exactly one visible setup action and zero visible hidden-command duplicates at desktop and 390x844 phone viewports.
- Replaced selector-driven browser coverage with no-query locked startup, query-normalization telemetry coverage, and existing registry/gameplay unit tests. Source assertions reject details, summary, chevron-owner classes, `aero-select`, and all legacy selector classes.
- Updated assembly README to document the one-button path and query-only diagnostics.
- Gates passed: `npm test`; `npm run test:browser`; `npm run build-release`; `git diff --check`.
- Assembly commit pushed to `origin/main`: `4b00424` (`Simplify calibration scene to one button`).

## Task 2 — Independent QA

**Bead:** `aerobeat-web-cv-hup`  
**Role:** QA  
**Status:** Blocked by implementation

Use actual Chromium at desktop and phone viewport to verify one visible action, no selectors/chevron, camera/CV startup, locked defaults, telemetry, layout, and console cleanliness. Record durable evidence and commit/push.

## Task 3 — Independent Audit

**Bead:** `aerobeat-web-cv-j2w`  
**Role:** auditor  
**Status:** Blocked by QA

Audit source, browser evidence, locked defaults, runtime behavior, docs, Beads, commits, release, and pushed parity. Close only proven work.

## Completion Gate

Complete when the test scene presents only `Begin calibration` for setup, it starts the current locked live camera/CV path, independent browser QA/audit pass, and all changes/evidence/ledger updates are committed and pushed cleanly.
