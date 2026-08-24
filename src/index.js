// @ts-check

import { createMoveNetMockPoseAdapter } from "@aerobeat/web-vendor-movenet";

/**
 * AeroBeat-owned CV service ID consumed through assembly wiring.
 *
 * @type {"aero.cv.pose"}
 */
export const aeroCvPoseServiceId = "aero.cv.pose";

/**
 * Public CV lifecycle states.
 *
 * @type {Readonly<{
 *   idle: "idle",
 *   loading: "loading",
 *   running: "running",
 *   stopped: "stopped",
 *   error: "error"
 * }>}
 */
export const aeroCvLifecycleStates = Object.freeze({
  idle: "idle",
  loading: "loading",
  running: "running",
  stopped: "stopped",
  error: "error"
});

/**
 * @typedef {"live-camera" | "loaded-video" | "replay-video-feed" | "replay-fixture"} CvFrameSourceKind
 */

/**
 * @typedef {HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageBitmap | ImageData | VideoFrame} AeroCvBrowserFrameSource
 */

/**
 * @typedef {Object} AeroCvFrameSample
 * @property {AeroCvBrowserFrameSource} frameSource Browser frame-like source used for adapter inference.
 * @property {string | undefined} sourceId Source identifier override for this exact sample.
 * @property {number | undefined} timestampMs Capture/media timestamp override in milliseconds.
 * @property {boolean | undefined} mirrored Mirrored override for this exact sample.
 * @property {number | undefined} frameWidth Frame width override.
 * @property {number | undefined} frameHeight Frame height override.
 */

/**
 * @typedef {Object} AeroCvFrameSourceDescriptor
 * @property {CvFrameSourceKind} kind Truthful source kind.
 * @property {string} sourceId Truthful source identifier from the owning video/replay source.
 * @property {boolean} mirrored Whether output should be mirrored for player-facing display.
 * @property {AeroCvBrowserFrameSource | undefined} frameSource Static browser frame-like source.
 * @property {(() => AeroCvBrowserFrameSource | undefined) | undefined} getFrameSource Reads the latest browser frame-like source.
 * @property {(() => number | undefined) | undefined} getTimestampMs Reads the latest capture/media timestamp in milliseconds.
 * @property {(() => boolean) | undefined} isFrameAvailable Returns whether the current source can be sampled.
 * @property {number | undefined} frameWidth Source width override.
 * @property {number | undefined} frameHeight Source height override.
 */

/**
 * @typedef {Object} AeroVideoSurfaceLike
 * @property {CvFrameSourceKind | undefined} sourceKind Current video source kind.
 * @property {string | undefined} sourceId Current video source identifier.
 * @property {boolean | undefined} mirrored Whether the surface is mirrored.
 * @property {number | undefined} intrinsicWidth Current video intrinsic width.
 * @property {number | undefined} intrinsicHeight Current video intrinsic height.
 * @property {number | undefined} currentTimeSeconds Current playback position.
 */

/**
 * @typedef {import("@aerobeat/web-contracts").NormalizedPoseFrame} NormalizedPoseFrame
 * @typedef {import("@aerobeat/web-vendor-movenet").MoveNetPoseAdapter} MoveNetPoseAdapter
 */

/**
 * @typedef {Object} AeroCameraCvServiceOptions
 * @property {MoveNetPoseAdapter | undefined} poseAdapter Optional normalized pose adapter.
 * @property {MoveNetPoseAdapter | undefined} fallbackPoseAdapter Optional deterministic fallback adapter.
 * @property {CvFrameSourceKind | undefined} sourceKind Source kind reported by deterministic replay mode.
 * @property {string | undefined} sourceId Source identifier reported by deterministic replay mode.
 * @property {boolean | undefined} mirrored Mirrored flag reported by deterministic replay mode.
 * @property {boolean | undefined} useFallbackOnError Whether adapter errors should produce fallback replay frames.
 * @property {AeroCvScheduler | undefined} scheduler Optional frame scheduler.
 */

/**
 * @typedef {Object} AeroCvScheduler
 * @property {(callback: () => void) => number} schedule Schedules the next frame pump.
 * @property {(handle: number) => void} cancel Cancels a scheduled frame pump.
 */

/**
 * @typedef {Object} AeroCvServiceStatus
 * @property {"aero.cv.pose"} serviceId Stable service ID.
 * @property {"idle" | "loading" | "running" | "stopped" | "error"} lifecycleState Current CV lifecycle state.
 * @property {boolean} running Whether frame production is active.
 * @property {"idle" | "loading" | "ready" | "failed" | undefined} modelStatus Current adapter model status.
 * @property {CvFrameSourceKind | undefined} sourceKind Current truthful source kind.
 * @property {string | undefined} sourceId Current truthful source identifier.
 * @property {boolean} mirrored Whether the current source is mirrored.
 * @property {number} submittedFrameCount Number of samples submitted to the scheduler.
 * @property {number} inferenceCount Number of adapter inference calls attempted.
 * @property {number} poseFrameCount Number of normalized pose frames produced.
 * @property {number} droppedFrameCount Number of superseded samples dropped by latest-frame-wins.
 * @property {string | undefined} lastError Last lifecycle or inference error message.
 * @property {boolean} fallbackActive Whether the latest pose came from fallback replay.
 * @property {string | undefined} fallbackSourceId Fallback source identifier when active.
 */

/**
 * @typedef {Object} AeroCameraCvService
 * @property {"aero.cv.pose"} serviceId Stable service ID.
 * @property {readonly CvFrameSourceKind[]} supportedSources Supported frame-source kinds.
 * @property {CvFrameSourceKind} sourceKind Current frame source kind.
 * @property {boolean} running Whether frame production is active.
 * @property {(source?: AeroCvFrameSourceDescriptor) => Promise<void>} start Starts camera/CV frame production.
 * @property {() => Promise<void>} stop Stops camera/CV frame production.
 * @property {(sample?: AeroCvFrameSample) => Promise<NormalizedPoseFrame>} nextPoseFrame Pulls the next normalized pose frame.
 * @property {(sample?: AeroCvFrameSample) => void} submitFrame Submits a frame with latest-frame-wins scheduling.
 * @property {() => NormalizedPoseFrame | undefined} getLatestPoseFrame Reads the latest normalized pose frame.
 * @property {() => AeroCvServiceStatus} getStatus Reads lifecycle, source, counter, and error metadata.
 */

/**
 * Creates a CV frame source from a browser video element and public video
 * surface metadata from `@aerobeat/web-video`.
 *
 * @param {AeroCvBrowserFrameSource} frameSource
 * @param {AeroVideoSurfaceLike} surface
 * @returns {AeroCvFrameSourceDescriptor}
 */
export function createAeroCvFrameSourceFromVideoSurface(frameSource, surface) {
  return {
    kind: surface.sourceKind ?? "loaded-video",
    sourceId: surface.sourceId ?? "aero.video.unknown",
    mirrored: surface.mirrored ?? false,
    frameSource,
    getFrameSource: undefined,
    getTimestampMs: () =>
      typeof surface.currentTimeSeconds === "number" ? surface.currentTimeSeconds * 1000 : undefined,
    isFrameAvailable: () => true,
    frameWidth: surface.intrinsicWidth,
    frameHeight: surface.intrinsicHeight
  };
}

/**
 * Creates the vendor-agnostic camera/CV singleton boundary.
 *
 * @param {AeroCameraCvServiceOptions} [options]
 * @returns {AeroCameraCvService}
 */
export function createAeroCameraCvService(options = {}) {
  const poseAdapter = options.poseAdapter ?? createMoveNetMockPoseAdapter();
  const fallbackPoseAdapter = options.fallbackPoseAdapter ?? createMoveNetMockPoseAdapter();
  const scheduler = options.scheduler ?? createDefaultScheduler();

  /** @type {CvFrameSourceKind} */
  let sourceKind = options.sourceKind ?? "replay-fixture";
  const defaultSourceId = options.sourceId ?? "aero.cv.replay-fixture";
  let sourceId = defaultSourceId;
  let mirrored = options.mirrored ?? true;
  /** @type {"idle" | "loading" | "running" | "stopped" | "error"} */
  let lifecycleState = aeroCvLifecycleStates.idle;
  /** @type {AeroCvFrameSourceDescriptor | undefined} */
  let activeSource;
  /** @type {NormalizedPoseFrame | undefined} */
  let latestPoseFrame;
  /** @type {AeroCvFrameSample | undefined} */
  let latestSubmittedSample;
  /** @type {Promise<void> | undefined} */
  let inferenceTask;
  /** @type {number | undefined} */
  let scheduleHandle;
  let submittedFrameCount = 0;
  let inferenceCount = 0;
  let poseFrameCount = 0;
  let droppedFrameCount = 0;
  /** @type {string | undefined} */
  let lastError;
  let fallbackActive = false;
  /** @type {string | undefined} */
  let fallbackSourceId;

  return {
    serviceId: aeroCvPoseServiceId,
    supportedSources: ["live-camera", "loaded-video", "replay-video-feed", "replay-fixture"],
    get sourceKind() {
      return sourceKind;
    },
    get running() {
      return lifecycleState === aeroCvLifecycleStates.running;
    },
    async start(source) {
      lifecycleState = aeroCvLifecycleStates.loading;
      lastError = undefined;
      activeSource = source;
      if (source) {
        sourceKind = source.kind;
        sourceId = source.sourceId;
        mirrored = source.mirrored;
      }
      try {
        await poseAdapter.load();
        lifecycleState = aeroCvLifecycleStates.running;
        if (activeSource) {
          schedulePump();
        }
      } catch (error) {
        await handleInferenceError(error);
      }
    },
    async stop() {
      lifecycleState = aeroCvLifecycleStates.stopped;
      if (scheduleHandle !== undefined) {
        scheduler.cancel(scheduleHandle);
        scheduleHandle = undefined;
      }
      latestSubmittedSample = undefined;
      await inferenceTask;
    },
    async nextPoseFrame(sample) {
      if (lifecycleState !== aeroCvLifecycleStates.running) {
        await this.start(activeSource);
      }
      try {
        const frame = await estimateSample(sample ?? readSampleFromSource(activeSource));
        latestPoseFrame = frame;
        poseFrameCount += 1;
        return clonePoseFrame(frame);
      } catch (error) {
        await handleInferenceError(error, true);
        if (!latestPoseFrame) {
          throw error;
        }
        return clonePoseFrame(latestPoseFrame);
      }
    },
    submitFrame(sample) {
      if (lifecycleState !== aeroCvLifecycleStates.running) {
        return;
      }
      const resolvedSample = sample ?? readSampleFromSource(activeSource);
      if (!resolvedSample) {
        return;
      }
      if (latestSubmittedSample) {
        droppedFrameCount += 1;
      }
      submittedFrameCount += 1;
      latestSubmittedSample = resolvedSample;
      if (!inferenceTask) {
        inferenceTask = drainLatestSubmittedSample();
      }
    },
    getLatestPoseFrame() {
      return latestPoseFrame ? clonePoseFrame(latestPoseFrame) : undefined;
    },
    getStatus() {
      return {
        serviceId: aeroCvPoseServiceId,
        lifecycleState,
        running: lifecycleState === aeroCvLifecycleStates.running,
        modelStatus: poseAdapter.status,
        sourceKind,
        sourceId,
        mirrored,
        submittedFrameCount,
        inferenceCount,
        poseFrameCount,
        droppedFrameCount,
        lastError,
        fallbackActive,
        fallbackSourceId
      };
    }
  };

  /**
   * @returns {void}
   */
  function schedulePump() {
    if (lifecycleState !== aeroCvLifecycleStates.running || scheduleHandle !== undefined) {
      return;
    }
    scheduleHandle = scheduler.schedule(() => {
      scheduleHandle = undefined;
      if (lifecycleState !== aeroCvLifecycleStates.running) {
        return;
      }
      const sample = readSampleFromSource(activeSource);
      if (sample) {
        serviceSubmitFrame(sample);
      }
      schedulePump();
    });
  }

  /**
   * @param {AeroCvFrameSample} sample
   * @returns {void}
   */
  function serviceSubmitFrame(sample) {
    if (latestSubmittedSample) {
      droppedFrameCount += 1;
    }
    submittedFrameCount += 1;
    latestSubmittedSample = sample;
    if (!inferenceTask) {
      inferenceTask = drainLatestSubmittedSample();
    }
  }

  /**
   * @returns {Promise<void>}
   */
  async function drainLatestSubmittedSample() {
    while (latestSubmittedSample && lifecycleState === aeroCvLifecycleStates.running) {
      const sample = latestSubmittedSample;
      latestSubmittedSample = undefined;
      try {
        latestPoseFrame = await estimateSample(sample);
        poseFrameCount += 1;
      } catch (error) {
        await handleInferenceError(error, false);
      }
    }
    inferenceTask = undefined;
  }

  /**
   * @param {AeroCvFrameSample | undefined} sample
   * @returns {Promise<NormalizedPoseFrame>}
   */
  async function estimateSample(sample) {
    inferenceCount += 1;
    if (!sample) {
      return poseAdapter.estimateNormalizedPoseFrame();
    }
    return poseAdapter.estimateNormalizedPoseFrame(sample.frameSource, {
      sourceId: sample.sourceId ?? sourceId,
      timestampMs: sample.timestampMs,
      mirrored: sample.mirrored ?? mirrored,
      frameWidth: sample.frameWidth,
      frameHeight: sample.frameHeight
    });
  }

  /**
   * @param {unknown} error
   * @param {boolean} throwOnError
   * @returns {Promise<void>}
   */
  async function handleInferenceError(error, throwOnError = true) {
    lastError = readErrorMessage(error);
    if (!options.useFallbackOnError) {
      lifecycleState = aeroCvLifecycleStates.error;
      if (throwOnError) {
        throw error;
      }
      return;
    }
    await fallbackPoseAdapter.load();
    latestPoseFrame = await fallbackPoseAdapter.estimateNormalizedPoseFrame();
    fallbackActive = true;
    fallbackSourceId = latestPoseFrame.sourceId;
    sourceKind = "replay-fixture";
    sourceId = latestPoseFrame.sourceId;
    mirrored = latestPoseFrame.mirrored;
    poseFrameCount += 1;
    lifecycleState = aeroCvLifecycleStates.error;
  }
}

/**
 * Runs one deterministic replay step for assembly and package-local proving.
 *
 * @param {AeroCameraCvServiceOptions} [options]
 * @returns {Promise<NormalizedPoseFrame>}
 */
export async function createReplayPoseFrame(options = {}) {
  const service = createAeroCameraCvService(options);
  const frame = await service.nextPoseFrame();
  await service.stop();
  return frame;
}

/**
 * Requests live camera access through the AeroBeat CV boundary.
 *
 * @param {MediaStreamConstraints} [constraints]
 * @returns {Promise<CameraPermissionRequestResult>}
 */
export async function requestLiveCameraPermission(constraints = defaultLiveCameraConstraints()) {
  const mediaDevices = globalThis.navigator?.mediaDevices;
  if (!mediaDevices?.getUserMedia) {
    return {
      status: "unsupported",
      stream: undefined,
      errorName: undefined,
      message: "Camera API unavailable in this browser context"
    };
  }

  try {
    const stream = await mediaDevices.getUserMedia(constraints);
    return {
      status: "granted",
      stream,
      errorName: undefined,
      message: "Camera permission granted"
    };
  } catch (error) {
    const cameraError = error instanceof DOMException ? error : undefined;
    return {
      status: "blocked",
      stream: undefined,
      errorName: cameraError?.name ?? "CameraRequestError",
      message: cameraError?.message ?? "Camera permission request failed"
    };
  }
}

/**
 * @typedef {"granted" | "unsupported" | "blocked"} CameraPermissionStatus
 */

/**
 * @typedef {Object} CameraPermissionRequestResult
 * @property {CameraPermissionStatus} status Browser camera request result.
 * @property {MediaStream | undefined} stream Live camera stream when granted.
 * @property {string | undefined} errorName Browser error name when blocked.
 * @property {string | undefined} message Browser-facing diagnostic message.
 */

/**
 * @param {AeroCvFrameSourceDescriptor | undefined} source
 * @returns {AeroCvFrameSample | undefined}
 */
function readSampleFromSource(source) {
  if (!source || source.isFrameAvailable?.() === false) {
    return undefined;
  }
  const frameSource = source.getFrameSource?.() ?? source.frameSource;
  if (!frameSource) {
    return undefined;
  }
  return {
    frameSource,
    sourceId: source.sourceId,
    timestampMs: source.getTimestampMs?.() ?? readFrameTimestampMs(frameSource),
    mirrored: source.mirrored,
    frameWidth: source.frameWidth,
    frameHeight: source.frameHeight
  };
}

/**
 * @param {AeroCvBrowserFrameSource} frameSource
 * @returns {number | undefined}
 */
function readFrameTimestampMs(frameSource) {
  if ("currentTime" in frameSource && typeof frameSource.currentTime === "number") {
    return frameSource.currentTime * 1000;
  }
  return undefined;
}

/**
 * @param {NormalizedPoseFrame} frame
 * @returns {NormalizedPoseFrame}
 */
function clonePoseFrame(frame) {
  return {
    sourceId: frame.sourceId,
    timestampMs: frame.timestampMs,
    mirrored: frame.mirrored,
    landmarks: frame.landmarks.map((landmark) => ({
      name: landmark.name,
      x: landmark.x,
      y: landmark.y,
      confidence: landmark.confidence
    }))
  };
}

/**
 * @returns {MediaStreamConstraints}
 */
function defaultLiveCameraConstraints() {
  return {
    audio: false,
    video: {
      facingMode: "user"
    }
  };
}

/**
 * @returns {AeroCvScheduler}
 */
function createDefaultScheduler() {
  return {
    schedule(callback) {
      const requestFrame = globalThis.requestAnimationFrame;
      if (typeof requestFrame === "function") {
        return requestFrame(callback);
      }
      return globalThis.setTimeout(callback, 16);
    },
    cancel(handle) {
      const cancelFrame = globalThis.cancelAnimationFrame;
      if (typeof cancelFrame === "function") {
        cancelFrame(handle);
      } else {
        globalThis.clearTimeout(handle);
      }
    }
  };
}

/**
 * @param {unknown} error
 * @returns {string}
 */
function readErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "CV pose inference failed";
}
