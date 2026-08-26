// @ts-check

import assert from "node:assert/strict";
import {
  aeroCvPerformancePresets,
  createAeroCameraCvService,
  createAeroCvFrameScheduler,
  createAeroCvFrameSourceFromVideoSurface,
  getAeroCvPerformancePreset,
  createReplayPoseFrame
} from "../src/index.js";

/**
 * @typedef {import("@aerobeat/web-contracts").NormalizedPoseFrame} NormalizedPoseFrame
 * @typedef {import("@aerobeat/web-vendor-movenet").MoveNetPoseAdapter} MoveNetPoseAdapter
 */

await validatesDeterministicReplay();
await validatesVideoSourceMetadata();
await validatesLatestFrameWins();
await validatesPacedSamplingAndTruthfulTelemetry();
validatesVideoFrameSchedulerPreferenceAndFallback();
await validatesStoppedState();
await validatesFallbackReporting();
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
async function validatesStoppedState() {
  const adapter = createRecordingAdapter();
  const service = createAeroCameraCvService({
    poseAdapter: adapter,
    scheduler: createNoopScheduler()
  });
  await service.start();
  await service.stop();
  service.submitFrame(createSample("ignored", 400));
  assert.equal(adapter.calls.length, 0);
  assert.equal(service.getStatus().lifecycleState, "stopped");
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
  assert.equal(latest?.sourceId, "fallback.fixture");
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
  assert.equal(status.adapterExecutionDetail, "direct adapter");
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
 * @param {string} [defaultSourceId]
 * @returns {MoveNetPoseAdapter & { calls: import("@aerobeat/web-vendor-movenet").MoveNetEstimateOptions[] }}
 */
function createRecordingAdapter(defaultSourceId = "adapter.fixture") {
  /** @type {import("@aerobeat/web-vendor-movenet").MoveNetEstimateOptions[]} */
  const calls = [];
  /** @type {"idle" | "loading" | "ready" | "failed"} */
  let status = "idle";
  return {
    vendorId: "movenet",
    calls,
    get status() {
      return status;
    },
    async load() {
      status = "ready";
    },
    async estimateNormalizedPoseFrame(frameSource, options = {}) {
      calls.push(options);
      return createFrame(options.sourceId ?? defaultSourceId, options.timestampMs ?? 0, options.mirrored ?? false);
    }
  };
}

/**
 * @returns {MoveNetPoseAdapter & {
 *   calls: import("@aerobeat/web-vendor-movenet").MoveNetEstimateOptions[],
 *   resolveNext: () => void
 * }}
 */
function createDeferredAdapter() {
  /** @type {import("@aerobeat/web-vendor-movenet").MoveNetEstimateOptions[]} */
  const calls = [];
  /** @type {(() => void)[]} */
  const resolvers = [];
  /** @type {"idle" | "loading" | "ready" | "failed"} */
  let status = "idle";
  return {
    vendorId: "movenet",
    calls,
    get status() {
      return status;
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
    }
  };
}

/**
 * @returns {MoveNetPoseAdapter}
 */
function createFailingAdapter() {
  return {
    vendorId: "movenet",
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
 * @param {string} sourceId
 * @param {number} timestampMs
 * @param {boolean} mirrored
 * @returns {NormalizedPoseFrame}
 */
function createFrame(sourceId, timestampMs, mirrored) {
  return {
    sourceId,
    timestampMs,
    mirrored,
    landmarks: [
      {
        name: "nose",
        x: 0.5,
        y: 0.25,
        confidence: 0.9
      }
    ]
  };
}
