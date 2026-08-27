# MediaPipe 1.0.1 Module-Worker Reproduction — 2026-08-27

## Correction

The earlier conclusion that Tasks Vision 1.0.1 cannot create Pose Landmarker in an ES module worker was false. The observed `ModuleFactory not set.` error was caused by calling `FilesetResolver.forVisionTasks(wasmPath)` without its module-selection flag.

A Vite `{ type: "module" }` Worker must call:

```js
const fileset = await FilesetResolver.forVisionTasks(wasmPath, true);
```

The second argument defaults to `false`. `true` selects `vision_wasm_module_internal.{js,wasm}`. Omitted/false selects `vision_wasm_internal.{js,wasm}`; when that classic loader is dynamically imported inside a module worker, its top-level `var ModuleFactory` remains module-scoped and the library's `self.ModuleFactory` check throws.

The official [`google-ai-edge/mediapipe-samples-web`](https://github.com/google-ai-edge/mediapipe-samples-web) implementation at commit `bbb8974ffd450650ad5a1e7c1656c9debb8e38bf` uses the explicit `true` form in `src/workers/base-worker.ts`.

## Real Chromium Matrix

Environment:

- Chromium `151.0.7922.34`;
- `@mediapipe/tasks-vision@1.0.1`;
- Pose Landmarker Lite model SHA-256 `59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a`;
- Vite module Worker;
- non-cross-origin-isolated page;
- transferred ImageBitmap and VideoFrame;
- exact VIDEO timestamps 123456 ms and 123457 ms;
- VideoFrame media timestamp 123457000 µs.

| Resolver call | Requested delegate | Task creation | ImageBitmap VIDEO | VideoFrame VIDEO | Result |
|---|---|---:|---:|---:|---|
| `forVisionTasks(path, true)` | CPU | pass | pass, 126.1 ms | pass, 37.6 ms | pass |
| `forVisionTasks(path, true)` | GPU | pass | pass, 1986.2 ms | pass, 179.8 ms | pass |
| `forVisionTasks(path)` | CPU | fail | not reached | not reached | `ModuleFactory not set.` |
| `forVisionTasks(path)` | GPU | fail | not reached | not reached | `ModuleFactory not set.` |
| `forVisionTasks(path, false)` | CPU | fail | not reached | not reached | `ModuleFactory not set.` |
| `forVisionTasks(path, false)` | GPU | fail | not reached | not reached | `ModuleFactory not set.` |

All transferred inputs were closed in success and failure paths. Both successfully created tasks were closed. CPU explicitly logged creation of the TensorFlow Lite XNNPACK delegate.

The public Tasks Vision API does not expose a created-delegate introspector. The GPU-requested task created and inferred successfully, while Worker WebGL reported ANGLE/Vulkan SwiftShader. This proves the GPU delegate execution path against software WebGL in this headless run, not physical GPU acceleration.

The first ImageBitmap inference includes graph warm-up and must not be interpreted as a transport benchmark. The matrix exists to isolate resolver/module-worker capability and frame acceptance.

## Product Decision

The current AeroBeat worker's classic IIFE bootstrap remains a valid supported implementation. It is retained to avoid broad bootstrap churn during the bounded transport experiment, not because module workers are unsupported. Any future module-worker implementation must pass `true` explicitly and repeat provider, lifecycle, timestamp, ownership, and physical-device validation.
