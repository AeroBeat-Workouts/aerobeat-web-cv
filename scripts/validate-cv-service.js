// @ts-check

import assert from "node:assert/strict";
import {
  aeroCvPerformancePresets,
  aeroCvTimingWindowCapacity,
  createAeroCameraCvService,
  createAeroCvFrameScheduler,
  createAeroCvFrameSourceFromVideoSurface,
  getAeroCvPerformancePreset,
  createReplayPoseFrame
} from "../src/index.js";

/**
 * @typedef {import("@aerobeat/web-contracts").NormalizedPoseFrame} NormalizedPoseFrame
 * @typedef {import("@aerobeat/web-contracts").AeroPoseAdapter} AeroPoseAdapter
 * @typedef {import("@aerobeat/web-contracts").AeroPoseEstimateOptions} AeroPoseEstimateOptions
 */

await validatesDeterministicReplay();
await validatesVideoSourceMetadata();
await validatesLatestFrameWins();
await validatesPacedSamplingAndTruthfulTelemetry();
validatesVideoFrameSchedulerPreferenceAndFallback();
await validatesStopAndRestart();
await validatesTerminalDisposalAndNoStaleResult();
await validatesFallbackReporting();
await validatesProviderTelemetryAndLegacyExecutionCompatibility();
await validatesRollingTimingDistributionAndLifecycle();
await validatesTimingBudgetBoundaryPrecision();
await validatesPerformancePresetReporting();

console.log("CV live inference service validation passed.");

/**
 * @returns {Promise<void>}
 */
async function validatesDeterministicReplay() {
  const frame = await createReplayPoseFrame();
  assert.equal(frame.sourceId, "aero.movenet.replay.basic-upper-body");
  assert.equal(frame.mirrored, true);
  assert.equal(frame.landmarks.length, 3);
}

/**
 * @returns {Promise<void>}
 */
async function validatesVideoSourceMetadata() {
  const adapter = createRecordingAdapter();
  const video = createFrameSource(640, 360, 1.25);
  const source = createAeroCvFrameSourceFromVideoSurface(video, {
    sourceKind: "live-camera",
    sourceId: "camera.front.test",
    mirrored: true,
    intrinsicWidth: 640,
    intrinsicHeight: 360,
    currentTimeSeconds: 1.25
  });
  const service = createAeroCameraCvService({
    poseAdapter: adapter,
    scheduler: createNoopScheduler()
  });

  await service.start(source);
  const frame = await service.nextPoseFrame();
  const status = service.getStatus();

  assert.equal(frame.sourceId, "camera.front.test");
  assert.equal(frame.timestampMs, 1250);
  assert.equal(frame.mirrored, true);
  assert.equal(adapter.calls.length, 1);
  assert.equal(adapter.calls[0]?.sourceId, "camera.front.test");
  assert.equal(adapter.calls[0]?.frameWidth, 640);
  assert.equal(adapter.calls[0]?.frameHeight, 360);
  assert.equal(status.sourceKind, "live-camera");
  assert.equal(status.sourceId, "camera.front.test");
  assert.equal(status.inferenceCount, 1);
  assert.equal(status.poseFrameCount, 1);
  assert.equal(typeof status.framePrepMs, "number");
  assert.equal(typeof status.adapterInferenceMs, "number");
  assert.equal(typeof status.totalCvMs, "number");
  assert.equal(typeof status.averageFramePrepMs, "number");
  assert.equal(typeof status.averageAdapterInferenceMs, "number");
  assert.equal(typeof status.averageTotalCvMs, "number");
  assert.equal(status.latestOutputAgeMs !== undefined, true);
  await service.stop();
}

/**
 * @returns {Promise<void>}
 */
async function validatesLatestFrameWins() {
  const adapter = createDeferredAdapter();
  const service = createAeroCameraCvService({
    poseAdapter: adapter,
    scheduler: createNoopScheduler()
  });

  await service.start({
    kind: "loaded-video",
    sourceId: "video.fixture",
    mirrored: false,
    frameSource: undefined,
    getFrameSource: undefined,
    getTimestampMs: undefined,
    isFrameAvailable: undefined,
    frameWidth: 320,
    frameHeight: 240
  });

  service.submitFrame(createSample("first", 100));
  service.submitFrame(createSample("second", 200));
  service.submitFrame(createSample("third", 300));

  await waitForAsyncDrain();
  assert.equal(adapter.calls.length, 1);
  adapter.resolveNext();
  await waitForAsyncDrain();
  assert.equal(adapter.calls.length, 2);
  adapter.resolveNext();
  await service.stop();

  assert.deepEqual(adapter.calls.map((call) => call.sourceId), ["first", "third"]);
  const latest = service.getLatestPoseFrame();
  const status = service.getStatus();
  assert.equal(latest?.sourceId, "third");
  assert.equal(status.submittedFrameCount, 3);
  assert.equal(status.inferenceCount, 2);
  assert.equal(status.poseFrameCount, 2);
  assert.equal(status.droppedFrameCount, 1);
  assert.equal(status.lastSubmittedTimestampMs, 300);
  assert.equal(status.lastSubmittedFrameAgeMs !== undefined, true);
  assert.equal(status.latestOutputAgeMs !== undefined, true);
}

/**
 * @returns {Promise<void>}
 */
async function validatesPacedSamplingAndTruthfulTelemetry() {
  let currentTimeMs = 0;
  const scheduler = createManualScheduler();
  const adapter = createRecordingAdapter();
  const frameSource = createFrameSource(640, 480, 0);
  const service = createAeroCameraCvService({
    poseAdapter: adapter,
    scheduler,
    submissionCadenceTargetFps: 10,
    now: () => currentTimeMs
  });
  await service.start({
    kind: "live-camera",
    sourceId: "paced.camera",
    mirrored: true,
    frameSource,
    getFrameSource: () => frameSource,
    getTimestampMs: () => currentTimeMs,
    isFrameAvailable: () => true,
    frameWidth: 640,
    frameHeight: 480
  });

  for (const sampleTimeMs of [0, 25, 99, 100, 150, 200]) {
    currentTimeMs = sampleTimeMs;
    scheduler.fireNext();
    await waitForAsyncDrain();
  }
  currentTimeMs = 250;
  const status = service.getStatus();

  assert.equal(status.submittedFrameCount, 3);
  assert.equal(status.inferenceCount, 3);
  assert.equal(status.poseFrameCount, 3);
  assert.equal(status.droppedFrameCount, 0);
  assert.equal(status.submissionCadenceTargetFps, 10);
  assert.equal(status.effectiveSubmissionRateFps, 10);
  assert.equal(status.effectivePoseOutputRateFps, 10);
  assert.equal(status.lastSubmittedFrameAgeMs, 50);
  assert.equal(status.latestOutputAgeMs, 50);
  assert.equal(status.samplingMode, "animation-frame-fallback");
  await service.stop();
}

/**
 * @returns {void}
 */
function validatesVideoFrameSchedulerPreferenceAndFallback() {
  /** @type {Map<number, () => void>} */
  const videoCallbacks = new Map();
  let nextVideoHandle = 1;
  const videoFrameSource = {
    width: 640,
    height: 480,
    currentTime: 0,
    requestVideoFrameCallback(callback) {
      const handle = nextVideoHandle;
      nextVideoHandle += 1;
      videoCallbacks.set(handle, callback);
      return handle;
    },
    cancelVideoFrameCallback(handle) {
      videoCallbacks.delete(handle);
    }
  };
  const videoScheduler = createAeroCvFrameScheduler();
  const videoHandle = videoScheduler.schedule(() => {}, videoFrameSource);
  assert.equal(videoScheduler.getMode?.(), "video-frame-callback");
  assert.equal(videoCallbacks.has(videoHandle), true);
  videoScheduler.cancel(videoHandle);
  assert.equal(videoCallbacks.size, 0);

  const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
  const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
  let fallbackRequestCount = 0;
  let cancelledHandle = 0;
  globalThis.requestAnimationFrame = () => {
    fallbackRequestCount += 1;
    return 71;
  };
  globalThis.cancelAnimationFrame = (handle) => {
    cancelledHandle = handle;
  };
  try {
    const fallbackScheduler = createAeroCvFrameScheduler();
    const fallbackHandle = fallbackScheduler.schedule(() => {});
    assert.equal(fallbackHandle, 71);
    assert.equal(fallbackScheduler.getMode?.(), "animation-frame-fallback");
    assert.equal(fallbackRequestCount, 1);
    fallbackScheduler.cancel(fallbackHandle);
    assert.equal(cancelledHandle, 71);
  } finally {
    if (originalRequestAnimationFrame) {
      globalThis.requestAnimationFrame = originalRequestAnimationFrame;
    } else {
      delete globalThis.requestAnimationFrame;
    }
    if (originalCancelAnimationFrame) {
      globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
    } else {
      delete globalThis.cancelAnimationFrame;
    }
  }
}

/**
 * @returns {Promise<void>}
 */
function waitForAsyncDrain() {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, 0);
  });
}

/**
 * @returns {Promise<void>}
 */
async function validatesStopAndRestart() {
  const adapter = createRecordingAdapter();
  const service = createAeroCameraCvService({
    poseAdapter: adapter,
    scheduler: createNoopScheduler()
  });
  await service.start();
  await service.nextPoseFrame(createSample("first-run", 100));
  await service.stop();
  service.submitFrame(createSample("ignored", 400));
  assert.equal(adapter.calls.length, 1);
  assert.equal(adapter.disposeCount, 0);
  assert.equal(service.getStatus().lifecycleState, "stopped");

  await service.start();
  await service.nextPoseFrame(createSample("second-run", 500));
  assert.equal(adapter.calls.length, 2);
  assert.equal(service.getLatestPoseFrame()?.sourceId, "second-run");
  await service.stop();
  assert.equal(adapter.disposeCount, 0);
  await service.dispose();
  assert.equal(adapter.disposeCount, 1);
}

/**
 * @returns {Promise<void>}
 */
async function validatesTerminalDisposalAndNoStaleResult() {
  const adapter = createDeferredAdapter();
  const service = createAeroCameraCvService({
    poseAdapter: adapter,
    scheduler: createNoopScheduler()
  });
  await service.start();
  const pendingFrame = service.nextPoseFrame(createSample("stale", 900));
  const pendingRejection = assert.rejects(pendingFrame, /stopped before pose inference completed/u);
  await waitForAsyncDrain();
  const disposal = service.dispose();
  adapter.resolveNext();
  await disposal;

  await pendingRejection;
  assert.equal(service.getLatestPoseFrame(), undefined);
  assert.equal(service.getStatus().poseFrameCount, 0);
  assert.equal(service.getStatus().disposed, true);
  assert.equal(adapter.disposeCount, 1);
  await assert.rejects(service.start(), /CV service is disposed/u);
  service.submitFrame(createSample("ignored-after-dispose", 1000));
  assert.equal(adapter.calls.length, 1);
}

/**
 * @returns {Promise<void>}
 */
async function validatesFallbackReporting() {
  const service = createAeroCameraCvService({
    poseAdapter: createFailingAdapter(),
    fallbackPoseAdapter: createRecordingAdapter("fallback.fixture"),
    useFallbackOnError: true,
    scheduler: createNoopScheduler()
  });

  await service.start();
  const status = service.getStatus();
  const latest = service.getLatestPoseFrame();

  assert.equal(status.lifecycleState, "error");
  assert.equal(status.lastError, "adapter failed");
  assert.equal(status.fallbackActive, true);
  assert.equal(status.sourceKind, "replay-fixture");
  assert.equal(status.sourceId, "fallback.fixture");
  assert.equal(status.selectedVendorId, "failing-vendor");
  assert.equal(status.effectiveVendorId, "test-vendor");
  assert.equal(status.effectiveBackendId, "test-vendor");
  assert.equal(status.adapterExecutionFallback, true);
  assert.equal(latest?.sourceId, "fallback.fixture");
  await service.dispose();
}

/**
 * @returns {Promise<void>}
 */
async function validatesProviderTelemetryAndLegacyExecutionCompatibility() {
  const adapter = createRecordingAdapter("provider.fixture", "onnxruntime");
  const service = createAeroCameraCvService({
    poseAdapter: adapter,
    requestedBackendId: "onnx",
    selectedBackendId: "onnx",
    scheduler: createNoopScheduler()
  });
  await service.start();
  await service.nextPoseFrame(createSample("provider.fixture", 12));
  const status = service.getStatus();

  assert.equal(status.requestedBackendId, "onnx");
  assert.equal(status.selectedBackendId, "onnx");
  assert.equal(status.selectedVendorId, "onnxruntime");
  assert.equal(status.effectiveBackendId, "onnx");
  assert.equal(status.effectiveVendorId, "onnxruntime");
  assert.equal(status.selectedModel.modelId, "onnxruntime-model");
  assert.equal(status.effectiveModel.runtimeId, "test-runtime");
  assert.equal(status.adapterExecutionLocation, "main-thread");
  assert.equal(status.adapterExecutionProvider, "webgpu");
  assert.equal(status.adapterExecutionFallback, false);
  assert.equal(status.adapterLoadDurationMs, 12);
  assert.equal(status.adapterEstimateDurationMs, 7);
  assert.equal(status.adapterRuntimeInferenceDurationMs, 5);
  assert.equal(status.adapterPostprocessDurationMs, 2);
  assert.equal(status.adapterTelemetry.runtimeInferenceDurationMs, 5);
  assert.equal(status.adapterTelemetry.postprocessDurationMs, 2);
  assert.deepEqual(status.adapterCapabilities?.executionProviders, ["webgpu", "wasm"]);
  await service.dispose();

  const legacyService = createAeroCameraCvService({
    poseAdapter: createLegacyExecutionAdapter(),
    scheduler: createNoopScheduler()
  });
  await legacyService.start();
  const legacyStatus = legacyService.getStatus();
  assert.equal(legacyStatus.adapterExecutionLocation, "worker");
  assert.equal(legacyStatus.adapterExecutionDetail, "legacy MoveNet worker");
  await legacyService.dispose();
}

/**
 * @returns {Promise<void>}
 */
async function validatesRollingTimingDistributionAndLifecycle() {
  let currentTimeMs = 0;
  const durationsMs = Array.from({ length: 126 }, (_, index) => index + 1);
  const landmarkCounts = durationsMs.map((durationMs) => (
    durationMs <= 5 || durationMs % 10 === 0 ? 6 : 7
  ));
  const adapter = createTimedAdapter(durationsMs, landmarkCounts, (durationMs) => {
    currentTimeMs += durationMs;
  });
  const service = createAeroCameraCvService({
    poseAdapter: adapter,
    scheduler: createNoopScheduler(),
    submissionCadenceTargetFps: 15,
    now: () => currentTimeMs
  });

  await service.start();
  const emptyStatus = service.getStatus();
  assert.equal(emptyStatus.timingWindowCapacity, aeroCvTimingWindowCapacity);
  assert.equal(emptyStatus.timingWindowSampleCount, 0);
  assert.equal(emptyStatus.timingBudgetMs, 66.7);
  assert.equal(emptyStatus.rollingAdapterInferenceP50Ms, undefined);
  assert.equal(emptyStatus.rollingTotalCvP95Ms, undefined);
  assert.equal(emptyStatus.timingWindowOverBudgetCount, 0);
  assert.equal(emptyStatus.timingWindowIncompletePoseCount, 0);

  for (let index = 0; index < 125; index += 1) {
    await service.nextPoseFrame(createSample(`timed-${index + 1}`, index + 1));
  }
  const boundedStatus = service.getStatus();
  assert.equal(boundedStatus.timingWindowSampleCount, 120);
  assert.equal(boundedStatus.rollingAdapterInferenceP50Ms, 65);
  assert.equal(boundedStatus.rollingAdapterInferenceP95Ms, 119);
  assert.equal(boundedStatus.rollingAdapterInferenceMaxMs, 125);
  assert.equal(boundedStatus.rollingTotalCvP50Ms, 65);
  assert.equal(boundedStatus.rollingTotalCvP95Ms, 119);
  assert.equal(boundedStatus.rollingTotalCvMaxMs, 125);
  assert.equal(boundedStatus.timingWindowOverBudgetCount, 59);
  assert.equal(boundedStatus.timingWindowIncompletePoseCount, 12);

  await service.stop();
  assert.equal(service.getStatus().timingWindowSampleCount, 120);
  assert.equal(service.getStatus().rollingTotalCvP50Ms, 65);

  await service.start();
  await service.nextPoseFrame(createSample("timed-126", 126));
  const restartedStatus = service.getStatus();
  assert.equal(restartedStatus.timingWindowSampleCount, 120);
  assert.equal(restartedStatus.rollingAdapterInferenceP50Ms, 66);
  assert.equal(restartedStatus.rollingAdapterInferenceP95Ms, 120);
  assert.equal(restartedStatus.rollingAdapterInferenceMaxMs, 126);
  assert.equal(restartedStatus.timingWindowOverBudgetCount, 60);
  assert.equal(restartedStatus.timingWindowIncompletePoseCount, 12);

  await service.dispose();
  const disposedStatus = service.getStatus();
  assert.equal(disposedStatus.disposed, true);
  assert.equal(disposedStatus.timingWindowSampleCount, 120);
  assert.equal(disposedStatus.rollingTotalCvMaxMs, 126);
  assert.equal(disposedStatus.timingWindowIncompletePoseCount, 12);
}

/**
 * @returns {Promise<void>}
 */
async function validatesTimingBudgetBoundaryPrecision() {
  let currentTimeMs = 0;
  const exactBudgetMs = 1000 / 15;
  const durationsMs = [66.64, 66.66, exactBudgetMs, 66.7, 67];
  const adapter = createTimedAdapter(durationsMs, durationsMs.map(() => 7), (durationMs) => {
    currentTimeMs += durationMs;
  });
  const service = createAeroCameraCvService({
    poseAdapter: adapter,
    scheduler: createNoopScheduler(),
    submissionCadenceTargetFps: 15,
    now: () => currentTimeMs
  });

  await service.start();
  for (let index = 0; index < durationsMs.length; index += 1) {
    await service.nextPoseFrame(createSample(`budget-boundary-${index + 1}`, index + 1));
    const status = service.getStatus();
    assert.equal(status.timingBudgetMs, 66.7);
    assert.equal(
      status.timingWindowOverBudgetCount,
      index === durationsMs.length - 1 ? 1 : 0
    );
    if (index >= 1 && index <= 3) {
      assert.equal(status.rollingTotalCvMaxMs, status.timingBudgetMs);
    }
  }

  const status = service.getStatus();
  assert.equal(status.rollingTotalCvP50Ms, 66.7);
  assert.equal(status.rollingTotalCvMaxMs, 67);
  assert.equal(status.timingWindowSampleCount, 5);
  await service.dispose();
}

/**
 * @returns {Promise<void>}
 */
async function validatesPerformancePresetReporting() {
  assert.deepEqual(Object.keys(aeroCvPerformancePresets), [
    "full",
    "direct-256",
    "direct-192",
    "direct-160",
    "balanced",
    "fast",
    "rescue"
  ]);
  assert.equal(aeroCvPerformancePresets.full.executionPolicy, "main-thread");
  assert.equal(aeroCvPerformancePresets["direct-256"].cameraWidth, undefined);
  assert.equal(aeroCvPerformancePresets["direct-192"].cameraWidth, undefined);
  assert.equal(aeroCvPerformancePresets["direct-160"].cameraWidth, undefined);
  assert.equal(aeroCvPerformancePresets.balanced.executionPolicy, "worker-experimental");
  assert.match(aeroCvPerformancePresets.balanced.label, /Experimental worker/u);

  const adapter = createRecordingAdapter();
  const service = createAeroCameraCvService({
    poseAdapter: adapter,
    performancePreset: getAeroCvPerformancePreset("direct-192"),
    scheduler: createNoopScheduler()
  });

  await service.start({
    kind: "live-camera",
    sourceId: "camera.direct.fixture",
    mirrored: true,
    frameSource: createFrameSource(192, 144, 2),
    getFrameSource: undefined,
    getTimestampMs: undefined,
    isFrameAvailable: undefined,
    frameWidth: 192,
    frameHeight: 144
  });
  await service.nextPoseFrame();
  const status = service.getStatus();

  assert.equal(status.performancePresetId, "direct-192");
  assert.equal(status.performancePresetLabel, "Direct downscale 192");
  assert.equal(status.performancePresetSummary, "main thread / camera default / 192px canvas resize / no worker transfer");
  assert.equal(status.adapterExecution, "main-thread");
  assert.equal(status.adapterExecutionDetail, "generic test adapter");
  assert.equal(status.resizePath, "none (input already within preset)");
  assert.equal(status.inferenceInputWidth, 192);
  assert.equal(status.inferenceInputHeight, 144);
  assert.equal(typeof status.framePrepMs, "number");
  assert.equal(typeof status.averageFramePrepMs, "number");
  await service.stop();
}

/**
 * @param {string} sourceId
 * @param {number} timestampMs
 * @returns {import("../src/index.js").AeroCvFrameSample}
 */
function createSample(sourceId, timestampMs) {
  return {
    frameSource: createFrameSource(320, 240, timestampMs / 1000),
    sourceId,
    timestampMs,
    mirrored: false,
    frameWidth: 320,
    frameHeight: 240
  };
}

/**
 * @param {number} width
 * @param {number} height
 * @param {number} currentTime
 * @returns {{ width: number, height: number, currentTime: number }}
 */
function createFrameSource(width, height, currentTime) {
  return {
    width,
    height,
    currentTime
  };
}

/**
 * @returns {import("../src/index.js").AeroCvScheduler & { fireNext: () => void }}
 */
function createManualScheduler() {
  /** @type {Map<number, () => void>} */
  const callbacks = new Map();
  let nextHandle = 1;
  return {
    schedule(callback) {
      const handle = nextHandle;
      nextHandle += 1;
      callbacks.set(handle, callback);
      return handle;
    },
    cancel(handle) {
      callbacks.delete(handle);
    },
    getMode() {
      return "animation-frame-fallback";
    },
    fireNext() {
      const next = callbacks.entries().next().value;
      if (!next) {
        throw new Error("No scheduled CV callback was available.");
      }
      const [handle, callback] = next;
      callbacks.delete(handle);
      callback();
    }
  };
}

/**
 * @returns {import("../src/index.js").AeroCvScheduler}
 */
function createNoopScheduler() {
  return {
    schedule() {
      return 1;
    },
    cancel() {}
  };
}

/**
 * @param {readonly number[]} durationsMs
 * @param {readonly number[]} landmarkCounts
 * @param {(durationMs: number) => void} advanceClock
 * @returns {AeroPoseAdapter}
 */
function createTimedAdapter(durationsMs, landmarkCounts, advanceClock) {
  let cursor = 0;
  /** @type {import("@aerobeat/web-contracts").AeroPoseAdapterLifecycleStatus} */
  let status = "idle";
  return {
    vendorId: "timed-vendor",
    model: {
      vendorId: "timed-vendor",
      modelId: "timed-model",
      runtimeId: "deterministic-clock"
    },
    get status() {
      return status;
    },
    async load() {
      status = "ready";
    },
    async estimateNormalizedPoseFrame(frameSource, options = {}) {
      const durationMs = durationsMs[cursor];
      const landmarkCount = landmarkCounts[cursor];
      if (durationMs === undefined || landmarkCount === undefined) {
        throw new Error("Timed adapter exhausted deterministic samples.");
      }
      cursor += 1;
      advanceClock(durationMs);
      return createLandmarkFrame(
        options.sourceId ?? "timed.fixture",
        options.timestampMs ?? 0,
        options.mirrored ?? false,
        landmarkCount
      );
    },
    dispose() {
      status = "disposed";
    }
  };
}

/**
 * @param {string} [defaultSourceId]
 * @param {string} [vendorId]
 * @returns {AeroPoseAdapter & { calls: AeroPoseEstimateOptions[], readonly disposeCount: number }}
 */
function createRecordingAdapter(defaultSourceId = "adapter.fixture", vendorId = "test-vendor") {
  /** @type {AeroPoseEstimateOptions[]} */
  const calls = [];
  /** @type {import("@aerobeat/web-contracts").AeroPoseAdapterLifecycleStatus} */
  let status = "idle";
  let disposeCount = 0;
  return {
    vendorId,
    model: {
      vendorId,
      modelId: `${vendorId}-model`,
      modelVersion: "1",
      runtimeId: "test-runtime",
      runtimeVersion: "1"
    },
    capabilities: {
      supportsMainThread: true,
      supportsWorker: false,
      supportsMirroring: true,
      supportsFrameSizeOverride: true,
      executionProviders: ["webgpu", "wasm"]
    },
    calls,
    get status() {
      return status;
    },
    get disposeCount() {
      return disposeCount;
    },
    async load() {
      if (status === "disposed") {
        throw new Error("adapter disposed");
      }
      status = "ready";
    },
    async estimateNormalizedPoseFrame(frameSource, options = {}) {
      calls.push(options);
      return createFrame(options.sourceId ?? defaultSourceId, options.timestampMs ?? 0, options.mirrored ?? false);
    },
    getExecutionTelemetry() {
      return {
        location: "main-thread",
        provider: "webgpu",
        detail: "generic test adapter",
        fallback: false,
        loadDurationMs: 12,
        estimateDurationMs: 7,
        runtimeInferenceDurationMs: 5,
        postprocessDurationMs: 2
      };
    },
    dispose() {
      disposeCount += 1;
      status = "disposed";
    }
  };
}

/**
 * @returns {AeroPoseAdapter & {
 *   calls: AeroPoseEstimateOptions[],
 *   readonly disposeCount: number,
 *   resolveNext: () => void
 * }}
 */
function createDeferredAdapter() {
  /** @type {AeroPoseEstimateOptions[]} */
  const calls = [];
  /** @type {(() => void)[]} */
  const resolvers = [];
  /** @type {import("@aerobeat/web-contracts").AeroPoseAdapterLifecycleStatus} */
  let status = "idle";
  let disposeCount = 0;
  return {
    vendorId: "deferred-vendor",
    model: {
      vendorId: "deferred-vendor",
      modelId: "deferred-model",
      runtimeId: "test-runtime"
    },
    calls,
    get status() {
      return status;
    },
    get disposeCount() {
      return disposeCount;
    },
    async load() {
      status = "ready";
    },
    async estimateNormalizedPoseFrame(frameSource, options = {}) {
      calls.push(options);
      await new Promise((resolve) => {
        resolvers.push(resolve);
      });
      return createFrame(options.sourceId ?? "deferred.fixture", options.timestampMs ?? 0, options.mirrored ?? false);
    },
    resolveNext() {
      resolvers.shift()?.();
    },
    dispose() {
      disposeCount += 1;
      status = "disposed";
    }
  };
}

/**
 * @returns {AeroPoseAdapter}
 */
function createFailingAdapter() {
  return {
    vendorId: "failing-vendor",
    model: {
      vendorId: "failing-vendor",
      modelId: "failing-model",
      runtimeId: "test-runtime"
    },
    status: "idle",
    async load() {
      throw new Error("adapter failed");
    },
    async estimateNormalizedPoseFrame() {
      throw new Error("adapter failed");
    }
  };
}

/**
 * @returns {AeroPoseAdapter & { getExecutionStatus: () => { mode: string, detail: string } }}
 */
function createLegacyExecutionAdapter() {
  return {
    vendorId: "movenet",
    model: {
      vendorId: "movenet",
      modelId: "SINGLEPOSE_LIGHTNING",
      runtimeId: "tensorflow-js"
    },
    status: "idle",
    async load() {},
    async estimateNormalizedPoseFrame() {
      return createFrame("legacy.fixture", 0, true);
    },
    getExecutionStatus() {
      return { mode: "worker", detail: "legacy MoveNet worker" };
    }
  };
}

/**
 * @param {string} sourceId
 * @param {number} timestampMs
 * @param {boolean} mirrored
 * @returns {NormalizedPoseFrame}
 */
function createFrame(sourceId, timestampMs, mirrored) {
  return createLandmarkFrame(sourceId, timestampMs, mirrored, 1);
}

/**
 * @param {string} sourceId
 * @param {number} timestampMs
 * @param {boolean} mirrored
 * @param {number} landmarkCount
 * @returns {NormalizedPoseFrame}
 */
function createLandmarkFrame(sourceId, timestampMs, mirrored, landmarkCount) {
  const names = [
    "nose",
    "left_shoulder",
    "right_shoulder",
    "left_elbow",
    "right_elbow",
    "left_wrist",
    "right_wrist"
  ];
  return {
    sourceId,
    timestampMs,
    mirrored,
    landmarks: names.slice(0, landmarkCount).map((name, index) => ({
      name,
      x: 0.2 + (index * 0.1),
      y: 0.25 + (index * 0.05),
      confidence: 0.9
    }))
  };
}
