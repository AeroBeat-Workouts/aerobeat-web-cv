# Lock MediaPipe Lite Web Defaults

**Date:** 2026-08-28  
**Status:** Complete — independent implementation, QA, and final audit passed
**Agent:** cookie  
**Umbrella Bead:** `aerobeat-web-cv-ccf`  
**Implementation Bead:** `aerobeat-web-cv-jws`  
**QA Bead:** `aerobeat-web-cv-y05`  
**Audit Bead:** `aerobeat-web-cv-ski`

## Goal

Lock the physically preferred AeroBeat web pose configuration as the no-query production default and prevent unused concrete pose vendors from entering the shipped dependency graph or bundle accidentally.

## Approved Production Configuration

- MediaPipe Pose Landmarker Lite float16 `/1/` via `@mediapipe/tasks-vision@1.0.1`;
- GPU-WebGL delegate;
- Standard detection/presence/tracking thresholds `0.5 / 0.5 / 0.5`;
- Fast presentation tracking;
- Direct-full main-thread execution with camera-default/full input and no resize;
- measured/current gameplay input at the existing 15fps submission ceiling.

Derrick selected this after replay, desktop, and physical-phone comparisons. Reduced-cadence and predicted gameplay were rejected for promotion. MoveNet and ONNX vendor repositories remain intact as separate research/reference repos, but the production CV/app dependency graph must not import or bundle them.

## Scope And Ownership

- `aerobeat-web-cv` remains vendor-neutral. Harden its import/dependency validation so a concrete vendor package cannot be added accidentally.
- `aerobeat-web-assembly` remains the composition root but ships only `@aerobeat/web-vendor-mediapipe` as a concrete pose vendor.
- Remove MoveNet and ONNX runtime imports and package dependencies from assembly, update the lockfile, and replace the MoveNet mock fallback with the CV-owned generic mock/replay adapter.
- Restrict backend selection to MediaPipe. Historical `poseBackend=movenet|onnxruntime` and incompatible provider values normalize visibly to MediaPipe GPU-WebGL rather than importing optional code.
- Keep MediaPipe CPU-WASM available only as an explicit same-vendor diagnostic provider unless implementation/QA finds it creates unnecessary production cost; GPU-WebGL is the default.
- Standard, Fast, Direct-full, measured/current remain the no-query defaults. Existing explicitly experimental gameplay/presentation modes remain non-default and are not promoted by this plan.
- Do not modify or delete the MoveNet or ONNX vendor repositories.

## Non-Negotiable Invariants

1. `aerobeat-web-cv` imports only vendor-neutral contracts and owns no concrete vendor dependency.
2. The release dependency graph and generated assets contain no MoveNet/TensorFlow pose or ONNX Runtime/model runtime caused by the removed vendors.
3. MediaPipe Tasks Vision, its Lite model, and required worker assets remain functional.
4. No-query startup truthfully reports MediaPipe / GPU-WebGL / Standard / Fast / Direct full / measured-current.
5. Unsupported old backend/provider query values visibly normalize to the locked defaults.
6. Production measured/current behavior and 15fps ceiling remain unchanged.
7. Bundle-size claims use actual clean release artifacts, not source inspection alone.

## Task 1 — Implementation

**Bead:** `aerobeat-web-cv-jws`  
**Role:** coder  
**Status:** Complete; CV `2abc211` and assembly `37dd31e` validated, committed, and pushed

- Harden CV package/import checks and document the concrete-vendor prohibition.
- Simplify assembly backend composition to MediaPipe only.
- Remove MoveNet/ONNX package dependencies and lockfile entries.
- Set GPU-WebGL as default provider while retaining Standard, Fast, Direct-full, measured/current defaults.
- Update selector/query/fallback behavior, telemetry truth, tests, and release tooling.
- Run CV and assembly `npm test`, `npm run test:browser`, `git diff --check`; run assembly `npm run build-release` and dependency/artifact scans.
- Commit and push each owning repo.

### Implementation Result

- `aerobeat-web-cv` now has a substantive dependency/import validator that rejects concrete `@aerobeat/web-vendor-*`, MediaPipe, TensorFlow pose, and ONNX Runtime package specifiers while preserving generic adapter fixtures and public-contract imports.
- Assembly now composes only `@aerobeat/web-vendor-mediapipe`; the CV-owned `aero-cv-replay` adapter is the fallback. MoveNet/ONNX imports, package dependencies, lock graph, TensorFlow shim, ONNX preparation command/script, and ignored local ONNX model copy were removed without changing either vendor repo.
- No-query selection is MediaPipe / GPU-WebGL / Standard `0.5/0.5/0.5` / Fast / Direct full / measured-current / 15fps. CPU-WASM and existing experimental tuning/worker/predictive controls remain explicit diagnostics. Historical backend/provider queries retain requested telemetry and visibly normalize to MediaPipe GPU-WebGL.
- Prior raw release `0.0.23` measured `101,275,193` bytes and contained MoveNet/TensorFlow pose chunks, ONNX Runtime JS/WASM, and a copied ONNX model. The clean MediaPipe-only release measures `1,505,838` bytes (`99,769,355` bytes / `98.51%` smaller) and contains only app CSS/JS/maps, `mediapipe-worker.js`, `vision_bundle-*.js`, index HTML, and the MediaPipe-only proof manifest. It has no runtime WASM or non-MediaPipe concrete CV asset.
- CV `npm test`, `npm run test:browser`, and `git diff --check` passed. Assembly `npm test`, `npm run test:browser`, `npm run build-release`, and `git diff --check` passed. `npm ls --all` confirms MediaPipe Tasks Vision is the only concrete pose runtime, while still returning the repository's pre-existing local-link peer diagnostic for `@aerobeat/web-input -> @aerobeat/web-contracts` and optional-package omissions.

## Task 2 — Independent QA

**Bead:** `aerobeat-web-cv-y05`  
**Role:** QA  
**Status:** Complete; independent QA passed, Bead intentionally remains in progress for audit handoff

- Independently verify no-query defaults and reload/query behavior in Chromium.
- Verify legacy vendor query values normalize to MediaPipe GPU-WebGL with visible warning.
- Inspect `npm ls`, package lock, release manifest, and generated assets for forbidden MoveNet/ONNX/TensorFlow pose content.
- Compare release artifact inventory/bytes before and after where prior proof permits.
- Confirm MediaPipe live/replay fallback and experimental gameplay isolation remain functional.
- Record durable evidence in CV docs, commit, and push.

### Independent QA Result

- CV `npm test`, `npm run test:browser`, and `git diff --check` passed. Assembly `npm test`, `npm run test:browser`, `npm run build-release`, and `git diff --check` passed independently.
- Actual Chromium fixtures proved the no-query MediaPipe Lite / GPU-WebGL / Standard `0.5/0.5/0.5` / Fast / Direct-full / measured / 15fps configuration, identical no-query reload state, visible MoveNet/ONNX query normalization, and explicit MediaPipe CPU-WASM diagnostic labeling/telemetry.
- CV-owned fallback reporting is truthful: forced adapter failure reports replay fallback, selected/effective identity divergence, and execution fallback. The historical `aero.movenet.replay.basic-upper-body` replay fixture ID remains compatibility data only.
- Package/lock/`npm ls` and clean release scans show only `@aerobeat/web-vendor-mediapipe` with `@mediapipe/tasks-vision@1.0.1` as concrete pose runtime. The release has no model directory or emitted WASM and no MoveNet/TensorFlow pose/ONNX runtime asset. Assembly `npm ls --all` still exits `1` for the pre-existing local-link `@aerobeat/web-input` peer diagnostic; this does not alter concrete pose-runtime proof.
- A detached rebuild of pre-change assembly `5139cf0` reproduced exactly `101,275,193` bytes. Current `37dd31e` reproduced exactly `1,505,838` bytes including manifest: `99,769,355` bytes and `98.513122557...%`, correctly reported as `98.51%`, smaller.
- Durable evidence: `docs/telemetry/2026-08-28-mediapipe-lite-default-independent-qa.md`.

## Task 3 — Independent Audit

**Bead:** `aerobeat-web-cv-ski`  
**Role:** auditor  
**Status:** Complete; independent final audit passed

Audit repo boundaries, concrete dependencies, bundle proof, default/fallback truth, tests, commits, evidence, plan, Beads, and clean pushed parity. Close only proven work.

### Independent Audit Result

- Inspected clean, pushed CV implementation/evidence range `2abc211..19c6f89` and assembly `37dd31e`; both `main` branches matched `origin/main` before this plan-only closeout. The MoveNet repo remained clean/aligned at `ce038e6`, and the ONNX Runtime repo remained clean/aligned at `17d9d98`, with no commits during this plan date.
- Source and package-lock inspection confirmed CV has only the vendor-neutral contracts dependency and its validator rejects concrete `@aerobeat/web-vendor-*`, MediaPipe, TensorFlow pose, and ONNX Runtime dependencies/imports. Assembly imports exactly `@aerobeat/web-vendor-mediapipe`, whose concrete runtime is `@mediapipe/tasks-vision@1.0.1`; its model constants pin Pose Landmarker Lite float16 `/1/`.
- Default-source inspection and tests confirmed no-query MediaPipe / GPU-WebGL / Standard `0.5/0.5/0.5` / Fast / Direct full / measured-current / 15fps. Historical MoveNet/ONNX and incompatible provider values retain requested telemetry and visibly normalize to MediaPipe GPU-WebGL. CPU-WASM, responsive tuning, worker/downscale presets, measured-8, and predicted-8 remain explicit non-default diagnostics.
- Independently reran CV `npm test`, `npm run test:browser`, and `git diff --check`; all passed. Independently reran assembly `npm test`, `npm run test:browser`, `npm run build-release`, and `git diff --check`; all passed, including real Chromium/Playwright MediaPipe inference, default controls, legacy normalization, predictive isolation, and release enforcement.
- Fresh release inventory was exactly eight files totaling `1,505,838` bytes, including the `1,069`-byte manifest and `1,504,769` pre-manifest bytes. It contained three runtime JavaScript files, zero emitted WASM/model/ONNX files, and no concrete forbidden runtime signatures. The reviewed detached pre-change reproduction remains `101,275,193` bytes, confirming `99,769,355` bytes / `98.51%` reduction.
- Disclosures remain honest and non-blocking for this lock: assembly `npm ls --all` exits `ELSPROBLEMS` only for the pre-existing local-link `@aerobeat/web-input -> @aerobeat/web-contracts@0.0.0` diagnostic plus optional omissions; CV `test:browser` is a placeholder console-posture check, while substantive browser proof is in assembly and the committed independent QA evidence. The historical replay fixture ID is compatibility data, not a shipped MoveNet runtime.

## Completion Gate

Complete only when:

- no concrete MoveNet/ONNX import or dependency remains in CV or shipped assembly;
- no-query behavior matches the approved production configuration;
- clean release artifacts prove unused vendor runtimes are absent;
- coder, QA, and auditor independently pass;
- plan and Beads are closed with all intended changes committed and pushed.

## Final Result

Accepted. All completion gates are proven; implementation, QA, audit, release proof, Bead closure, and pushed repository alignment are complete.
