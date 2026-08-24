// @ts-check

import assert from "node:assert/strict";
import {
  createAeroCameraCvService,
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
  const adapter = createRecordingAdapter();
  const service = createAeroCameraCvService({
    poseAdapter: adapter,
    performancePreset: getAeroCvPerformancePreset("fast"),
    scheduler: createNoopScheduler()
  });

  await service.start({
    kind: "live-camera",
    sourceId: "camera.fast.fixture",
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

  assert.equal(status.performancePresetId, "fast");
  assert.equal(status.performancePresetLabel, "Fast phone");
  assert.equal(status.performancePresetSummary, "480p camera / 192px CV");
  assert.equal(status.inferenceInputWidth, 192);
  assert.equal(status.inferenceInputHeight, 144);
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
