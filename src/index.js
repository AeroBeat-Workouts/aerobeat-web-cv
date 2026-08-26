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
 * Phone-testable CV workload presets. Direct full remains the default. The
 * direct downscale presets keep camera constraints and main-thread execution
 * constant so inference width is isolated; worker variants remain explicit
 * experimental controls.
 *
 * @type {Readonly<Record<AeroCvPerformancePresetId, AeroCvPerformancePreset>>}
 */
export const aeroCvPerformancePresets = Object.freeze({
  full: Object.freeze({
    id: "full",
    label: "Direct full (recommended)",
    summary: "main thread / camera default / full input / no resize",
    cameraWidth: undefined,
    cameraHeight: undefined,
    inferenceMaxWidth: undefined,
    inferenceMaxHeight: undefined,
    executionPolicy: "main-thread",
    configuredResizePath: "none",
    preferImageBitmap: false
  }),
  "direct-256": Object.freeze({
    id: "direct-256",
    label: "Direct downscale 256",
    summary: "main thread / camera default / 256px canvas resize / no worker transfer",
    cameraWidth: undefined,
    cameraHeight: undefined,
    inferenceMaxWidth: 256,
    inferenceMaxHeight: 192,
    executionPolicy: "main-thread",
    configuredResizePath: "main-thread canvas",
    preferImageBitmap: false
  }),
  "direct-192": Object.freeze({
    id: "direct-192",
    label: "Direct downscale 192",
    summary: "main thread / camera default / 192px canvas resize / no worker transfer",
    cameraWidth: undefined,
    cameraHeight: undefined,
    inferenceMaxWidth: 192,
    inferenceMaxHeight: 144,
    executionPolicy: "main-thread",
    configuredResizePath: "main-thread canvas",
    preferImageBitmap: false
  }),
  "direct-160": Object.freeze({
    id: "direct-160",
    label: "Direct downscale 160",
    summary: "main thread / camera default / 160px canvas resize / no worker transfer",
    cameraWidth: undefined,
    cameraHeight: undefined,
    inferenceMaxWidth: 160,
    inferenceMaxHeight: 120,
    executionPolicy: "main-thread",
    configuredResizePath: "main-thread canvas",
    preferImageBitmap: false
  }),
  balanced: Object.freeze({
    id: "balanced",
    label: "Experimental worker downscale 256",
    summary: "worker preferred / 720p camera / 256px bitmap transfer control",
    cameraWidth: 1280,
    cameraHeight: 720,
    inferenceMaxWidth: 256,
    inferenceMaxHeight: 192,
    executionPolicy: "worker-experimental",
    configuredResizePath: "main-thread canvas to ImageBitmap",
    preferImageBitmap: true
  }),
  fast: Object.freeze({
    id: "fast",
    label: "Experimental worker downscale 192",
    summary: "worker preferred / 480p camera / 192px bitmap transfer control",
    cameraWidth: 640,
    cameraHeight: 480,
    inferenceMaxWidth: 192,
    inferenceMaxHeight: 144,
    executionPolicy: "worker-experimental",
    configuredResizePath: "main-thread canvas to ImageBitmap",
    preferImageBitmap: true
  }),
  rescue: Object.freeze({
    id: "rescue",
    label: "Experimental worker downscale 160",
    summary: "worker preferred / 360p camera / 160px bitmap transfer control",
    cameraWidth: 480,
    cameraHeight: 360,
    inferenceMaxWidth: 160,
    inferenceMaxHeight: 120,
    executionPolicy: "worker-experimental",
    configuredResizePath: "main-thread canvas to ImageBitmap",
    preferImageBitmap: true
  })
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
 * @typedef {"full" | "direct-256" | "direct-192" | "direct-160" | "balanced" | "fast" | "rescue"} AeroCvPerformancePresetId
 */

/**
 * @typedef {"main-thread" | "worker-experimental"} AeroCvExecutionPolicy
 */

/**
 * @typedef {Object} AeroCvPerformancePreset
 * @property {AeroCvPerformancePresetId} id Stable preset identifier.
 * @property {string} label Visible preset label.
 * @property {string} summary Visible short workload summary.
 * @property {number | undefined} cameraWidth Camera width constraint target.
 * @property {number | undefined} cameraHeight Camera height constraint target.
 * @property {number | undefined} inferenceMaxWidth Maximum inference frame width.
 * @property {number | undefined} inferenceMaxHeight Maximum inference frame height.
 * @property {AeroCvExecutionPolicy} executionPolicy Declared adapter execution selection.
 * @property {string} configuredResizePath Declared resize path for visible comparisons.
 * @property {boolean} preferImageBitmap Whether to transfer a small ImageBitmap when supported.
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
 * @property {AeroCvPerformancePreset | undefined} performancePreset Optional CV workload preset.
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
 * @property {AeroCvPerformancePresetId} performancePresetId Selected CV performance preset ID.
 * @property {string} performancePresetLabel Selected CV performance preset label.
 * @property {string} performancePresetSummary Selected CV performance preset summary.
 * @property {number | undefined} inferenceInputWidth Last frame width submitted to the adapter.
 * @property {number | undefined} inferenceInputHeight Last frame height submitted to the adapter.
 * @property {string} adapterExecution Actual execution location, such as worker or main-thread.
 * @property {string} adapterExecutionDetail Adapter execution policy or worker/fallback detail.
 * @property {string} resizePath Actual resize path used for the latest inference input.
 * @property {number | undefined} framePrepMs Last frame preparation/downscale duration.
 * @property {number | undefined} averageFramePrepMs Average frame preparation/downscale duration.
 * @property {number | undefined} adapterInferenceMs Last adapter inference duration.
 * @property {number | undefined} averageAdapterInferenceMs Average adapter inference duration.
 * @property {number | undefined} totalCvMs Last end-to-end CV duration.
 * @property {number | undefined} averageTotalCvMs Average end-to-end CV duration.
 * @property {number | undefined} lastSubmittedTimestampMs Latest submitted sample timestamp.
 * @property {number | undefined} lastSubmittedFrameAgeMs Wall-clock age of the latest submitted sample.
 * @property {number | undefined} latestOutputAgeMs Wall-clock age of the latest produced pose frame.
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
 * Returns a public CV performance preset, defaulting conservatively to full.
 *
 * @param {AeroCvPerformancePresetId | string | undefined} presetId
 * @returns {AeroCvPerformancePreset}
 */
export function getAeroCvPerformancePreset(presetId) {
  if (
    presetId === "full"
    || presetId === "direct-256"
    || presetId === "direct-192"
    || presetId === "direct-160"
    || presetId === "balanced"
    || presetId === "fast"
    || presetId === "rescue"
  ) {
    return aeroCvPerformancePresets[presetId];
  }
  return aeroCvPerformancePresets.full;
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
  const performancePreset = options.performancePreset ?? aeroCvPerformancePresets.full;

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
  /** @type {number | undefined} */
  let inferenceInputWidth;
  /** @type {number | undefined} */
  let inferenceInputHeight;
  let resizePath = performancePreset.configuredResizePath;
  /** @type {number | undefined} */
  let framePrepMs;
  /** @type {number | undefined} */
  let adapterInferenceMs;
  /** @type {number | undefined} */
  let totalCvMs;
  /** @type {number} */
  let framePrepTotalMs = 0;
  /** @type {number} */
  let adapterInferenceTotalMs = 0;
  /** @type {number} */
  let totalCvTotalMs = 0;
  /** @type {number} */
  let timingSampleCount = 0;
  /** @type {number | undefined} */
  let lastSubmittedTimestampMs;
  /** @type {number | undefined} */
  let lastSubmittedAtMs;
  /** @type {number | undefined} */
  let latestOutputAtMs;

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
      recordSubmittedSample(resolvedSample);
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
        fallbackSourceId,
        performancePresetId: performancePreset.id,
        performancePresetLabel: performancePreset.label,
        performancePresetSummary: performancePreset.summary,
        inferenceInputWidth,
        inferenceInputHeight,
        adapterExecution: readAdapterExecution(poseAdapter)?.mode ?? "main-thread",
        adapterExecutionDetail: readAdapterExecution(poseAdapter)?.detail
          ?? (performancePreset.executionPolicy === "main-thread" ? "direct adapter" : "worker experimental adapter"),
        resizePath,
        framePrepMs,
        averageFramePrepMs: averageMs(framePrepTotalMs, timingSampleCount),
        adapterInferenceMs,
        averageAdapterInferenceMs: averageMs(adapterInferenceTotalMs, timingSampleCount),
        totalCvMs,
        averageTotalCvMs: averageMs(totalCvTotalMs, timingSampleCount),
        lastSubmittedTimestampMs,
        lastSubmittedFrameAgeMs: ageMs(lastSubmittedAtMs),
        latestOutputAgeMs: ageMs(latestOutputAtMs)
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
    recordSubmittedSample(sample);
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
    const totalStartMs = nowMs();
    if (!sample) {
      const adapterStartMs = nowMs();
      const frame = await poseAdapter.estimateNormalizedPoseFrame();
      recordTiming(0, nowMs() - adapterStartMs, nowMs() - totalStartMs);
      latestOutputAtMs = nowMs();
      return frame;
    }
    const prepStartMs = nowMs();
    const prepared = await prepareInferenceSample(sample, performancePreset);
    const preparedAtMs = nowMs();
    resizePath = prepared.resizePath;
    inferenceInputWidth = prepared.sample.frameWidth;
    inferenceInputHeight = prepared.sample.frameHeight;
    const frame = await poseAdapter.estimateNormalizedPoseFrame(prepared.sample.frameSource, {
      sourceId: prepared.sample.sourceId ?? sourceId,
      timestampMs: prepared.sample.timestampMs,
      mirrored: prepared.sample.mirrored ?? mirrored,
      frameWidth: prepared.sample.frameWidth,
      frameHeight: prepared.sample.frameHeight
    });
    const finishedAtMs = nowMs();
    recordTiming(preparedAtMs - prepStartMs, finishedAtMs - preparedAtMs, finishedAtMs - totalStartMs);
    latestOutputAtMs = finishedAtMs;
    return frame;
  }

  /**
   * @param {AeroCvFrameSample} sample
   * @returns {void}
   */
  function recordSubmittedSample(sample) {
    lastSubmittedTimestampMs = sample.timestampMs;
    lastSubmittedAtMs = nowMs();
  }

  /**
   * @param {number} nextFramePrepMs
   * @param {number} nextAdapterInferenceMs
   * @param {number} nextTotalCvMs
   * @returns {void}
   */
  function recordTiming(nextFramePrepMs, nextAdapterInferenceMs, nextTotalCvMs) {
    framePrepMs = roundMs(nextFramePrepMs);
    adapterInferenceMs = roundMs(nextAdapterInferenceMs);
    totalCvMs = roundMs(nextTotalCvMs);
    framePrepTotalMs += framePrepMs;
    adapterInferenceTotalMs += adapterInferenceMs;
    totalCvTotalMs += totalCvMs;
    timingSampleCount += 1;
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
    latestOutputAtMs = nowMs();
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
 * @param {AeroCvFrameSample} sample
 * @param {AeroCvPerformancePreset} preset
 * @returns {Promise<{ sample: AeroCvFrameSample, resizePath: string }>}
 */
async function prepareInferenceSample(sample, preset) {
  if (!preset.inferenceMaxWidth || !preset.inferenceMaxHeight) {
    return { sample, resizePath: "none" };
  }
  const sourceSize = readFrameSize(sample.frameSource, sample.frameWidth, sample.frameHeight);
  const targetSize = fitWithin(sourceSize.width, sourceSize.height, preset.inferenceMaxWidth, preset.inferenceMaxHeight);
  if (
    !sourceSize.width
    || !sourceSize.height
    || targetSize.width >= sourceSize.width
    || targetSize.height >= sourceSize.height
  ) {
    return {
      sample: {
        ...sample,
        frameWidth: sourceSize.width || sample.frameWidth,
        frameHeight: sourceSize.height || sample.frameHeight
      },
      resizePath: "none (input already within preset)"
    };
  }
  const resized = await drawResizedFrame(sample.frameSource, targetSize.width, targetSize.height, preset);
  if (!resized) {
    return { sample, resizePath: "resize unavailable (original input)" };
  }
  return {
    sample: {
      ...sample,
      frameSource: resized.frameSource,
      frameWidth: targetSize.width,
      frameHeight: targetSize.height
    },
    resizePath: resized.resizePath
  };
}

/**
 * @param {AeroCvBrowserFrameSource} frameSource
 * @param {number | undefined} fallbackWidth
 * @param {number | undefined} fallbackHeight
 * @returns {{ width: number, height: number }}
 */
function readFrameSize(frameSource, fallbackWidth, fallbackHeight) {
  return {
    width: readNumericFrameProperty(frameSource, "videoWidth")
      || readNumericFrameProperty(frameSource, "naturalWidth")
      || readNumericFrameProperty(frameSource, "width")
      || fallbackWidth
      || 0,
    height: readNumericFrameProperty(frameSource, "videoHeight")
      || readNumericFrameProperty(frameSource, "naturalHeight")
      || readNumericFrameProperty(frameSource, "height")
      || fallbackHeight
      || 0
  };
}

/**
 * @param {AeroCvBrowserFrameSource} frameSource
 * @param {"videoWidth" | "videoHeight" | "naturalWidth" | "naturalHeight" | "width" | "height"} property
 * @returns {number | undefined}
 */
function readNumericFrameProperty(frameSource, property) {
  const value = frameSource[property];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/**
 * @param {number} width
 * @param {number} height
 * @param {number} maxWidth
 * @param {number} maxHeight
 * @returns {{ width: number, height: number }}
 */
function fitWithin(width, height, maxWidth, maxHeight) {
  if (!width || !height) {
    return { width: 0, height: 0 };
  }
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  };
}

/**
 * @param {AeroCvBrowserFrameSource} frameSource
 * @param {number} width
 * @param {number} height
 * @param {AeroCvPerformancePreset} preset
 * @returns {Promise<{ frameSource: AeroCvBrowserFrameSource, resizePath: string } | undefined>}
 */
async function drawResizedFrame(frameSource, width, height, preset) {
  const canvas = createResizeCanvas(width, height);
  const context = canvas?.getContext("2d", { alpha: false });
  if (!canvas || !context) {
    return undefined;
  }
  try {
    context.drawImage(frameSource, 0, 0, width, height);
    if (preset.preferImageBitmap && typeof globalThis.createImageBitmap === "function") {
      return {
        frameSource: await globalThis.createImageBitmap(canvas),
        resizePath: "main-thread canvas to ImageBitmap"
      };
    }
    return {
      frameSource: canvas,
      resizePath: "main-thread canvas"
    };
  } catch {
    return undefined;
  }
}

/**
 * @param {number} width
 * @param {number} height
 * @returns {(HTMLCanvasElement | OffscreenCanvas) | undefined}
 */
function createResizeCanvas(width, height) {
  if (typeof globalThis.OffscreenCanvas === "function") {
    return new globalThis.OffscreenCanvas(width, height);
  }
  const documentRef = globalThis.document;
  if (!documentRef?.createElement) {
    return undefined;
  }
  const canvas = documentRef.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * @param {MoveNetPoseAdapter} adapter
 * @returns {{ mode: string, detail: string } | undefined}
 */
function readAdapterExecution(adapter) {
  if ("getExecutionStatus" in adapter && typeof adapter.getExecutionStatus === "function") {
    return adapter.getExecutionStatus();
  }
  return undefined;
}

/**
 * @returns {number}
 */
function nowMs() {
  return globalThis.performance?.now?.() ?? Date.now();
}

/**
 * @param {number} value
 * @returns {number}
 */
function roundMs(value) {
  return Math.max(0, Math.round(value * 10) / 10);
}

/**
 * @param {number} totalMs
 * @param {number} count
 * @returns {number | undefined}
 */
function averageMs(totalMs, count) {
  return count > 0 ? roundMs(totalMs / count) : undefined;
}

/**
 * @param {number | undefined} timestampMs
 * @returns {number | undefined}
 */
function ageMs(timestampMs) {
  return timestampMs === undefined ? undefined : roundMs(nowMs() - timestampMs);
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
