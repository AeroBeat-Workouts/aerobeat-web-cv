// @ts-check

import { createAeroCvMockPoseAdapter } from "./replay-pose-adapter.js";

export {
  aeroCvReplayFixtureId,
  aeroCvReplayVendorId,
  createAeroCvMockPoseAdapter,
  createAeroCvReplayPoseSource
} from "./replay-pose-adapter.js";

/**
 * AeroBeat-owned CV service ID consumed through assembly wiring.
 *
 * @type {"aero.cv.pose"}
 */
export const aeroCvPoseServiceId = "aero.cv.pose";

/**
 * Maximum number of completed estimates retained for rolling timing diagnostics.
 *
 * @type {120}
 */
export const aeroCvTimingWindowCapacity = 120;

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
 * @typedef {import("@aerobeat/web-contracts").AeroPoseAdapter} AeroPoseAdapter
 * @typedef {import("@aerobeat/web-contracts").AeroPoseModelIdentity} AeroPoseModelIdentity
 * @typedef {import("@aerobeat/web-contracts").AeroPoseAdapterCapabilities} AeroPoseAdapterCapabilities
 * @typedef {import("@aerobeat/web-contracts").AeroPoseExecutionTelemetry} AeroPoseExecutionTelemetry
 */

/**
 * @typedef {Object} AeroCameraCvServiceOptions
 * @property {AeroPoseAdapter | undefined} poseAdapter Optional normalized pose adapter.
 * @property {AeroPoseAdapter | undefined} fallbackPoseAdapter Optional deterministic fallback adapter.
 * @property {string | undefined} requestedBackendId Backend ID requested by assembly/query policy.
 * @property {string | undefined} selectedBackendId Backend ID selected by assembly after policy/capability resolution.
 * @property {CvFrameSourceKind | undefined} sourceKind Source kind reported by deterministic replay mode.
 * @property {string | undefined} sourceId Source identifier reported by deterministic replay mode.
 * @property {boolean | undefined} mirrored Mirrored flag reported by deterministic replay mode.
 * @property {boolean | undefined} useFallbackOnError Whether adapter errors should produce fallback replay frames.
 * @property {AeroCvScheduler | undefined} scheduler Optional video/display frame scheduler.
 * @property {AeroCvPerformancePreset | undefined} performancePreset Optional CV workload preset.
 * @property {number | undefined} submissionCadenceTargetFps Maximum video-frame sample submission rate.
 * @property {(() => number) | undefined} now Optional monotonic clock for deterministic validation.
 */

/**
 * @typedef {Object} AeroCvScheduler
 * @property {(callback: () => void, frameSource?: AeroCvBrowserFrameSource) => number} schedule Schedules the next video or display frame pump.
 * @property {(handle: number) => void} cancel Cancels a scheduled frame pump.
 * @property {(() => "video-frame-callback" | "animation-frame-fallback" | "timer-fallback") | undefined} getMode Reports the scheduling primitive used for the latest request.
 */

/**
 * @typedef {Object} AeroCvServiceStatus
 * @property {"aero.cv.pose"} serviceId Stable service ID.
 * @property {"idle" | "loading" | "running" | "stopped" | "error"} lifecycleState Current CV lifecycle state.
 * @property {boolean} running Whether frame production is active.
 * @property {boolean} disposed Whether terminal cleanup has been requested.
 * @property {import("@aerobeat/web-contracts").AeroPoseAdapterLifecycleStatus} modelStatus Current effective adapter model status.
 * @property {string} requestedBackendId Backend requested by assembly/query policy.
 * @property {string} selectedBackendId Backend selected by assembly policy.
 * @property {string} selectedVendorId Vendor that owns the selected adapter.
 * @property {string} effectiveBackendId Backend currently producing output, including fallback.
 * @property {string} effectiveVendorId Vendor currently producing output, including fallback.
 * @property {AeroPoseModelIdentity} selectedModel Selected adapter vendor/model/runtime identity.
 * @property {AeroPoseModelIdentity} effectiveModel Effective adapter vendor/model/runtime identity.
 * @property {AeroPoseAdapterCapabilities | undefined} adapterCapabilities Effective adapter capabilities.
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
 * @property {string} adapterExecution Compatibility alias for the actual execution location.
 * @property {"worker" | "main-thread" | "native" | "unknown"} adapterExecutionLocation Actual execution location.
 * @property {string | undefined} adapterExecutionProvider Actual provider/backend such as webgl, wasm, or webgpu.
 * @property {string} adapterExecutionDetail Adapter execution policy or fallback detail.
 * @property {boolean} adapterExecutionFallback Whether the requested adapter execution path fell back.
 * @property {number | undefined} adapterLoadDurationMs Adapter-reported model/runtime load duration.
 * @property {number | undefined} adapterEstimateDurationMs Adapter-reported latest estimate duration.
 * @property {number | undefined} adapterRuntimeInferenceDurationMs Adapter-reported vendor runtime/model invocation duration excluding postprocessing.
 * @property {number | undefined} adapterPostprocessDurationMs Adapter-reported decoding/normalization duration after runtime inference.
 * @property {AeroPoseExecutionTelemetry} adapterTelemetry Full normalized adapter execution telemetry.
 * @property {string} resizePath Actual resize path used for the latest inference input.
 * @property {number | undefined} framePrepMs Last frame preparation/downscale duration.
 * @property {number | undefined} averageFramePrepMs Average frame preparation/downscale duration.
 * @property {number | undefined} adapterInferenceMs Last adapter inference duration.
 * @property {number | undefined} averageAdapterInferenceMs Average adapter inference duration.
 * @property {number | undefined} totalCvMs Last end-to-end CV duration.
 * @property {number | undefined} averageTotalCvMs Average end-to-end CV duration.
 * @property {120} timingWindowCapacity Maximum completed estimates retained in the rolling window.
 * @property {number} timingWindowSampleCount Completed estimates currently retained in the rolling window.
 * @property {number} timingBudgetMs Per-estimate budget derived from the configured submission cadence.
 * @property {number | undefined} rollingAdapterInferenceP50Ms Nearest-rank p50 adapter duration in the rolling window.
 * @property {number | undefined} rollingAdapterInferenceP95Ms Nearest-rank p95 adapter duration in the rolling window.
 * @property {number | undefined} rollingAdapterInferenceMaxMs Maximum adapter duration in the rolling window.
 * @property {number | undefined} rollingTotalCvP50Ms Nearest-rank p50 total CV duration in the rolling window.
 * @property {number | undefined} rollingTotalCvP95Ms Nearest-rank p95 total CV duration in the rolling window.
 * @property {number | undefined} rollingTotalCvMaxMs Maximum total CV duration in the rolling window.
 * @property {number} timingWindowOverBudgetCount Retained estimates whose total CV duration strictly exceeds timingBudgetMs.
 * @property {number} timingWindowIncompletePoseCount Retained successful estimates that returned other than seven landmarks.
 * @property {number | undefined} lastSubmittedTimestampMs Latest submitted sample timestamp.
 * @property {number | undefined} lastSubmittedFrameAgeMs Wall-clock age of the latest submitted sample.
 * @property {number | undefined} latestOutputAgeMs Wall-clock age of the latest produced pose frame.
 * @property {"video-frame-callback" | "animation-frame-fallback" | "timer-fallback"} samplingMode Actual browser scheduling primitive used for sampling.
 * @property {number} submissionCadenceTargetFps Configured maximum video sample submission rate.
 * @property {number | undefined} effectiveSubmissionRateFps Effective rate of samples submitted since start.
 * @property {number | undefined} effectivePoseOutputRateFps Effective rate of pose outputs produced since start.
 */

/**
 * @typedef {Object} AeroCameraCvService
 * @property {"aero.cv.pose"} serviceId Stable service ID.
 * @property {readonly CvFrameSourceKind[]} supportedSources Supported frame-source kinds.
 * @property {CvFrameSourceKind} sourceKind Current frame source kind.
 * @property {boolean} running Whether frame production is active.
 * @property {(source?: AeroCvFrameSourceDescriptor) => Promise<void>} start Starts camera/CV frame production.
 * @property {() => Promise<void>} stop Pauses frame production while retaining adapters for restart.
 * @property {() => Promise<void>} dispose Permanently stops and releases adapter resources; later starts reject.
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
  const poseAdapter = options.poseAdapter ?? createAeroCvMockPoseAdapter();
  const fallbackPoseAdapter = options.fallbackPoseAdapter ?? createAeroCvMockPoseAdapter();
  const requestedBackendId = options.requestedBackendId ?? options.selectedBackendId ?? poseAdapter.vendorId;
  const selectedBackendId = options.selectedBackendId ?? poseAdapter.vendorId;
  const scheduler = options.scheduler ?? createAeroCvFrameScheduler();
  const performancePreset = options.performancePreset ?? aeroCvPerformancePresets.full;
  const clockNowMs = options.now ?? nowMs;
  const submissionCadenceTargetFps = normalizeCadenceFps(options.submissionCadenceTargetFps, 15);
  const submissionIntervalMs = 1000 / submissionCadenceTargetFps;

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
  /** @type {Set<Promise<NormalizedPoseFrame>>} */
  const inFlightEstimates = new Set();
  let lifecycleGeneration = 0;
  let stopping = false;
  let disposed = false;
  /** @type {number | undefined} */
  let measuredAdapterLoadDurationMs;
  /** @type {number | undefined} */
  let measuredFallbackLoadDurationMs;
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
  /** @type {{ adapterInferenceMs: number, totalCvMs: number, incompletePose: boolean }[]} */
  const timingWindow = [];
  /** @type {number | undefined} */
  let lastSubmittedTimestampMs;
  /** @type {number | undefined} */
  let firstSubmittedAtMs;
  /** @type {number | undefined} */
  let lastSubmittedAtMs;
  /** @type {number | undefined} */
  let lastSamplingAtMs;
  /** @type {number | undefined} */
  let firstOutputAtMs;
  /** @type {number | undefined} */
  let latestOutputAtMs;

  return {
    serviceId: aeroCvPoseServiceId,
    supportedSources: ["live-camera", "loaded-video", "replay-video-feed", "replay-fixture"],
    get sourceKind() {
      return sourceKind;
    },
    get running() {
      return !stopping && lifecycleState === aeroCvLifecycleStates.running;
    },
    async start(source) {
      if (disposed) {
        throw new Error("CV service is disposed");
      }
      if (stopping) {
        throw new Error("CV service is stopping");
      }
      const generation = ++lifecycleGeneration;
      lifecycleState = aeroCvLifecycleStates.loading;
      lastError = undefined;
      fallbackActive = false;
      fallbackSourceId = undefined;
      lastSamplingAtMs = undefined;
      activeSource = source;
      if (source) {
        sourceKind = source.kind;
        sourceId = source.sourceId;
        mirrored = source.mirrored;
      }
      const loadStartedAtMs = clockNowMs();
      try {
        await poseAdapter.load();
        measuredAdapterLoadDurationMs = roundMs(clockNowMs() - loadStartedAtMs);
        if (generation !== lifecycleGeneration) {
          return;
        }
        lifecycleState = aeroCvLifecycleStates.running;
        if (activeSource) {
          schedulePump();
        }
      } catch (error) {
        measuredAdapterLoadDurationMs = roundMs(clockNowMs() - loadStartedAtMs);
        if (generation !== lifecycleGeneration) {
          return;
        }
        await handleInferenceError(error);
      }
    },
    async stop() {
      await stopService();
    },
    async dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      await stopService(true);
      await disposePoseAdapterSafely(poseAdapter);
      if (fallbackPoseAdapter !== poseAdapter) {
        await disposePoseAdapterSafely(fallbackPoseAdapter);
      }
    },
    async nextPoseFrame(sample) {
      if (lifecycleState !== aeroCvLifecycleStates.running) {
        await this.start(activeSource);
      }
      const generation = lifecycleGeneration;
      try {
        const frame = await runTrackedEstimate(sample ?? readSampleFromSource(activeSource));
        if (generation !== lifecycleGeneration || lifecycleState === aeroCvLifecycleStates.stopped) {
          throw new Error("CV service stopped before pose inference completed");
        }
        latestPoseFrame = frame;
        recordOutput(clockNowMs());
        poseFrameCount += 1;
        return clonePoseFrame(frame);
      } catch (error) {
        if (generation !== lifecycleGeneration || lifecycleState === aeroCvLifecycleStates.stopped) {
          throw error;
        }
        await handleInferenceError(error, true);
        if (generation !== lifecycleGeneration || lifecycleState === aeroCvLifecycleStates.stopped) {
          throw error;
        }
        if (!latestPoseFrame) {
          throw error;
        }
        return clonePoseFrame(latestPoseFrame);
      }
    },
    submitFrame(sample) {
      if (stopping || lifecycleState !== aeroCvLifecycleStates.running) {
        return;
      }
      const resolvedSample = sample ?? readSampleFromSource(activeSource);
      if (resolvedSample) {
        serviceSubmitFrame(resolvedSample);
      }
    },
    getLatestPoseFrame() {
      return latestPoseFrame ? clonePoseFrame(latestPoseFrame) : undefined;
    },
    getStatus() {
      const effectiveAdapter = fallbackActive ? fallbackPoseAdapter : poseAdapter;
      const selectedModel = readAdapterModel(poseAdapter);
      const effectiveModel = readAdapterModel(effectiveAdapter);
      const adapterTelemetry = readAdapterExecution(effectiveAdapter, performancePreset);
      const timingDistribution = summarizeTimingWindow(timingWindow, submissionIntervalMs);
      return {
        serviceId: aeroCvPoseServiceId,
        lifecycleState,
        running: !stopping && lifecycleState === aeroCvLifecycleStates.running,
        disposed,
        modelStatus: effectiveAdapter.status,
        requestedBackendId,
        selectedBackendId,
        selectedVendorId: poseAdapter.vendorId,
        effectiveBackendId: fallbackActive ? fallbackPoseAdapter.vendorId : selectedBackendId,
        effectiveVendorId: effectiveAdapter.vendorId,
        selectedModel,
        effectiveModel,
        adapterCapabilities: cloneCapabilities(effectiveAdapter.capabilities),
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
        adapterExecution: adapterTelemetry.location,
        adapterExecutionLocation: adapterTelemetry.location,
        adapterExecutionProvider: adapterTelemetry.provider,
        adapterExecutionDetail: adapterTelemetry.detail
          ?? (performancePreset.executionPolicy === "main-thread" ? "direct adapter" : "worker experimental adapter"),
        adapterExecutionFallback: fallbackActive || adapterTelemetry.fallback === true,
        adapterLoadDurationMs: adapterTelemetry.loadDurationMs
          ?? (fallbackActive ? measuredFallbackLoadDurationMs : measuredAdapterLoadDurationMs),
        adapterEstimateDurationMs: adapterTelemetry.estimateDurationMs,
        adapterRuntimeInferenceDurationMs: adapterTelemetry.runtimeInferenceDurationMs,
        adapterPostprocessDurationMs: adapterTelemetry.postprocessDurationMs,
        adapterTelemetry: { ...adapterTelemetry, fallback: fallbackActive || adapterTelemetry.fallback === true },

        resizePath,
        framePrepMs,
        averageFramePrepMs: averageMs(framePrepTotalMs, timingSampleCount),
        adapterInferenceMs,
        averageAdapterInferenceMs: averageMs(adapterInferenceTotalMs, timingSampleCount),
        totalCvMs,
        averageTotalCvMs: averageMs(totalCvTotalMs, timingSampleCount),
        timingWindowCapacity: aeroCvTimingWindowCapacity,
        ...timingDistribution,
        lastSubmittedTimestampMs,
        lastSubmittedFrameAgeMs: ageMs(lastSubmittedAtMs, clockNowMs()),
        latestOutputAgeMs: ageMs(latestOutputAtMs, clockNowMs()),
        samplingMode: scheduler.getMode?.() ?? "animation-frame-fallback",
        submissionCadenceTargetFps,
        effectiveSubmissionRateFps: effectiveRateFps(submittedFrameCount, firstSubmittedAtMs, lastSubmittedAtMs),
        effectivePoseOutputRateFps: effectiveRateFps(poseFrameCount, firstOutputAtMs, latestOutputAtMs)
      };
    }
  };

  /**
   * Pauses sampling without disposing adapters so camera/device restarts can
   * start the same service instance again. A normal pause lets the one already
   * accepted estimate commit before stopping; terminal disposal invalidates it.
   *
   * @param {boolean} [terminal]
   * @returns {Promise<void>}
   */
  async function stopService(terminal = false) {
    stopping = true;
    if (terminal) {
      ++lifecycleGeneration;
      lifecycleState = aeroCvLifecycleStates.stopped;
    }
    if (scheduleHandle !== undefined) {
      scheduler.cancel(scheduleHandle);
      scheduleHandle = undefined;
    }
    latestSubmittedSample = undefined;
    await inferenceTask;
    await Promise.allSettled([...inFlightEstimates]);
    if (!terminal) {
      ++lifecycleGeneration;
      lifecycleState = aeroCvLifecycleStates.stopped;
    }
    stopping = false;
  }

  /**
   * @returns {void}
   */
  function schedulePump() {
    if (stopping || lifecycleState !== aeroCvLifecycleStates.running || scheduleHandle !== undefined) {
      return;
    }
    const frameSource = activeSource?.getFrameSource?.() ?? activeSource?.frameSource;
    scheduleHandle = scheduler.schedule(() => {
      scheduleHandle = undefined;
      if (stopping || lifecycleState !== aeroCvLifecycleStates.running) {
        return;
      }
      const sampledAtMs = clockNowMs();
      if (lastSamplingAtMs === undefined || sampledAtMs - lastSamplingAtMs >= submissionIntervalMs) {
        const sample = readSampleFromSource(activeSource);
        if (sample) {
          lastSamplingAtMs = sampledAtMs;
          serviceSubmitFrame(sample);
        }
      }
      schedulePump();
    }, frameSource);
  }

  /**
   * @param {AeroCvFrameSample} sample
   * @returns {void}
   */
  function serviceSubmitFrame(sample) {
    if (stopping || lifecycleState !== aeroCvLifecycleStates.running) {
      return;
    }
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
      const generation = lifecycleGeneration;
      latestSubmittedSample = undefined;
      try {
        const frame = await runTrackedEstimate(sample);
        if (generation === lifecycleGeneration && lifecycleState === aeroCvLifecycleStates.running) {
          latestPoseFrame = frame;
          recordOutput(clockNowMs());
          poseFrameCount += 1;
        }
      } catch (error) {
        if (generation === lifecycleGeneration && lifecycleState === aeroCvLifecycleStates.running) {
          await handleInferenceError(error, false);
        }
      }
    }
    inferenceTask = undefined;
  }

  /**
   * @param {AeroCvFrameSample | undefined} sample
   * @returns {Promise<NormalizedPoseFrame>}
   */
  function runTrackedEstimate(sample) {
    const estimate = estimateSample(sample);
    inFlightEstimates.add(estimate);
    void estimate.finally(() => {
      inFlightEstimates.delete(estimate);
    }).catch(() => {});
    return estimate;
  }

  /**
   * @param {AeroCvFrameSample | undefined} sample
   * @returns {Promise<NormalizedPoseFrame>}
   */
  async function estimateSample(sample) {
    inferenceCount += 1;
    const totalStartMs = clockNowMs();
    if (!sample) {
      const adapterStartMs = clockNowMs();
      const frame = await poseAdapter.estimateNormalizedPoseFrame();
      const finishedAtMs = clockNowMs();
      recordTiming(0, finishedAtMs - adapterStartMs, finishedAtMs - totalStartMs, frame);
      return frame;
    }
    const prepStartMs = clockNowMs();
    const prepared = await prepareInferenceSample(sample, performancePreset);
    const preparedAtMs = clockNowMs();
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
    const finishedAtMs = clockNowMs();
    recordTiming(preparedAtMs - prepStartMs, finishedAtMs - preparedAtMs, finishedAtMs - totalStartMs, frame);
    return frame;
  }

  /**
   * @param {AeroCvFrameSample} sample
   * @returns {void}
   */
  function recordSubmittedSample(sample) {
    const submittedAtMs = clockNowMs();
    lastSubmittedTimestampMs = sample.timestampMs;
    firstSubmittedAtMs ??= submittedAtMs;
    lastSubmittedAtMs = submittedAtMs;
  }

  /**
   * @param {number} outputAtMs
   * @returns {void}
   */
  function recordOutput(outputAtMs) {
    firstOutputAtMs ??= outputAtMs;
    latestOutputAtMs = outputAtMs;
  }

  /**
   * @param {number} nextFramePrepMs
   * @param {number} nextAdapterInferenceMs
   * @param {number} nextTotalCvMs
   * @param {NormalizedPoseFrame} frame
   * @returns {void}
   */
  function recordTiming(nextFramePrepMs, nextAdapterInferenceMs, nextTotalCvMs, frame) {
    framePrepMs = roundMs(nextFramePrepMs);
    adapterInferenceMs = roundMs(nextAdapterInferenceMs);
    totalCvMs = roundMs(nextTotalCvMs);
    framePrepTotalMs += framePrepMs;
    adapterInferenceTotalMs += adapterInferenceMs;
    totalCvTotalMs += totalCvMs;
    timingSampleCount += 1;
    timingWindow.push({
      adapterInferenceMs,
      totalCvMs,
      incompletePose: frame.landmarks.length !== 7
    });
    if (timingWindow.length > aeroCvTimingWindowCapacity) {
      timingWindow.shift();
    }
  }

  /**
   * @param {unknown} error
   * @param {boolean} throwOnError
   * @returns {Promise<void>}
   */
  async function handleInferenceError(error, throwOnError = true) {
    const generation = lifecycleGeneration;
    lastError = readErrorMessage(error);
    if (!options.useFallbackOnError) {
      lifecycleState = aeroCvLifecycleStates.error;
      if (throwOnError) {
        throw error;
      }
      return;
    }
    const fallbackLoadStartedAtMs = clockNowMs();
    await fallbackPoseAdapter.load();
    measuredFallbackLoadDurationMs = roundMs(clockNowMs() - fallbackLoadStartedAtMs);
    if (generation !== lifecycleGeneration) {
      return;
    }
    const fallbackFrame = await fallbackPoseAdapter.estimateNormalizedPoseFrame();
    if (generation !== lifecycleGeneration) {
      return;
    }
    latestPoseFrame = fallbackFrame;
    recordOutput(clockNowMs());
    fallbackActive = true;
    fallbackSourceId = latestPoseFrame.sourceId;
    sourceKind = "replay-fixture";
    sourceId = latestPoseFrame.sourceId;
    mirrored = latestPoseFrame.mirrored;
    poseFrameCount += 1;
    lifecycleState = aeroCvLifecycleStates.error;
  }

  /**
   * @param {AeroPoseAdapter} adapter
   * @returns {Promise<void>}
   */
  async function disposePoseAdapterSafely(adapter) {
    if (typeof adapter.dispose !== "function") {
      return;
    }
    try {
      await adapter.dispose();
    } catch (error) {
      lastError = `Adapter disposal failed: ${readErrorMessage(error)}`;
    }
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
 * Reads the generic execution contract first and temporarily accepts the old
 * MoveNet getExecutionStatus shape while that package lands its additive API.
 *
 * @param {AeroPoseAdapter} adapter
 * @param {AeroCvPerformancePreset} preset
 * @returns {AeroPoseExecutionTelemetry}
 */
function readAdapterExecution(adapter, preset) {
  if (typeof adapter.getExecutionTelemetry === "function") {
    return { ...adapter.getExecutionTelemetry() };
  }
  const legacyAdapter = /** @type {AeroPoseAdapter & { getExecutionStatus?: () => { mode: string, detail: string } }} */ (adapter);
  if (typeof legacyAdapter.getExecutionStatus === "function") {
    const legacy = legacyAdapter.getExecutionStatus();
    return {
      location: normalizeExecutionLocation(legacy.mode),
      detail: legacy.detail,
      fallback: legacy.mode === "fallback"
    };
  }
  return {
    location: preset.executionPolicy === "main-thread" ? "main-thread" : "unknown",
    detail: preset.executionPolicy === "main-thread" ? "direct adapter" : "worker experimental adapter",
    fallback: false
  };
}

/**
 * @param {string} mode
 * @returns {"worker" | "main-thread" | "native" | "unknown"}
 */
function normalizeExecutionLocation(mode) {
  if (mode === "worker" || mode === "main-thread" || mode === "native") {
    return mode;
  }
  return "unknown";
}

/**
 * @param {AeroPoseAdapter} adapter
 * @returns {AeroPoseModelIdentity}
 */
function readAdapterModel(adapter) {
  const model = adapter.model;
  if (model && model.vendorId && model.modelId) {
    return { ...model };
  }
  return {
    vendorId: adapter.vendorId,
    modelId: "unknown",
    runtimeId: "unknown"
  };
}

/**
 * @param {AeroPoseAdapterCapabilities | undefined} capabilities
 * @returns {AeroPoseAdapterCapabilities | undefined}
 */
function cloneCapabilities(capabilities) {
  if (!capabilities) {
    return undefined;
  }
  return {
    ...capabilities,
    executionProviders: [...capabilities.executionProviders]
  };
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
 * Summarizes the bounded completed-estimate window. The window survives ordinary
 * stop/start and terminal disposal for final inspection; only constructing a new
 * service resets it. Failed estimates are absent because they never complete.
 * Durations and the budget are both retained/reported at 0.1ms precision, so the
 * strict over-budget classification compares those same disclosed values.
 *
 * @param {readonly { adapterInferenceMs: number, totalCvMs: number, incompletePose: boolean }[]} window
 * @param {number} timingBudgetMs
 * @returns {{
 *   timingWindowSampleCount: number,
 *   timingBudgetMs: number,
 *   rollingAdapterInferenceP50Ms: number | undefined,
 *   rollingAdapterInferenceP95Ms: number | undefined,
 *   rollingAdapterInferenceMaxMs: number | undefined,
 *   rollingTotalCvP50Ms: number | undefined,
 *   rollingTotalCvP95Ms: number | undefined,
 *   rollingTotalCvMaxMs: number | undefined,
 *   timingWindowOverBudgetCount: number,
 *   timingWindowIncompletePoseCount: number
 * }}
 */
function summarizeTimingWindow(window, timingBudgetMs) {
  const adapterDurations = window.map((sample) => sample.adapterInferenceMs).sort(compareNumbers);
  const totalDurations = window.map((sample) => sample.totalCvMs).sort(compareNumbers);
  const reportedTimingBudgetMs = roundMs(timingBudgetMs);
  return {
    timingWindowSampleCount: window.length,
    timingBudgetMs: reportedTimingBudgetMs,
    rollingAdapterInferenceP50Ms: nearestRankPercentile(adapterDurations, 0.5),
    rollingAdapterInferenceP95Ms: nearestRankPercentile(adapterDurations, 0.95),
    rollingAdapterInferenceMaxMs: adapterDurations.at(-1),
    rollingTotalCvP50Ms: nearestRankPercentile(totalDurations, 0.5),
    rollingTotalCvP95Ms: nearestRankPercentile(totalDurations, 0.95),
    rollingTotalCvMaxMs: totalDurations.at(-1),
    timingWindowOverBudgetCount: window.filter(
      (sample) => sample.totalCvMs > reportedTimingBudgetMs
    ).length,
    timingWindowIncompletePoseCount: window.filter((sample) => sample.incompletePose).length
  };
}

/**
 * Uses the deterministic nearest-rank definition: ceil(percentile * n) - 1.
 *
 * @param {readonly number[]} sortedValues
 * @param {number} percentile
 * @returns {number | undefined}
 */
function nearestRankPercentile(sortedValues, percentile) {
  if (sortedValues.length === 0) {
    return undefined;
  }
  const index = Math.max(0, Math.ceil(percentile * sortedValues.length) - 1);
  return sortedValues[index];
}

/**
 * @param {number} left
 * @param {number} right
 * @returns {number}
 */
function compareNumbers(left, right) {
  return left - right;
}

/**
 * @param {number | undefined} timestampMs
 * @param {number} currentTimeMs
 * @returns {number | undefined}
 */
function ageMs(timestampMs, currentTimeMs) {
  return timestampMs === undefined ? undefined : roundMs(currentTimeMs - timestampMs);
}

/**
 * @param {number} count
 * @param {number | undefined} firstAtMs
 * @param {number | undefined} latestAtMs
 * @returns {number | undefined}
 */
function effectiveRateFps(count, firstAtMs, latestAtMs) {
  if (count < 2 || firstAtMs === undefined || latestAtMs === undefined || latestAtMs <= firstAtMs) {
    return undefined;
  }
  return Math.round((((count - 1) * 1000) / (latestAtMs - firstAtMs)) * 10) / 10;
}

/**
 * @param {number | undefined} value
 * @param {number} fallback
 * @returns {number}
 */
function normalizeCadenceFps(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
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
  await service.dispose();
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
export function createAeroCvFrameScheduler() {
  /** @type {Map<number, { mode: "video-frame-callback" | "animation-frame-fallback" | "timer-fallback", frameSource: VideoFrameCallbackSource | undefined }>} */
  const pending = new Map();
  /** @type {"video-frame-callback" | "animation-frame-fallback" | "timer-fallback"} */
  let mode = "animation-frame-fallback";
  return {
    schedule(callback, frameSource) {
      if (isVideoFrameCallbackSource(frameSource)) {
        mode = "video-frame-callback";
        const handle = frameSource.requestVideoFrameCallback(() => {
          pending.delete(handle);
          callback();
        });
        pending.set(handle, { mode, frameSource });
        return handle;
      }
      const requestFrame = globalThis.requestAnimationFrame;
      if (typeof requestFrame === "function") {
        mode = "animation-frame-fallback";
        const handle = requestFrame(() => {
          pending.delete(handle);
          callback();
        });
        pending.set(handle, { mode, frameSource: undefined });
        return handle;
      }
      mode = "timer-fallback";
      const handle = globalThis.setTimeout(() => {
        pending.delete(handle);
        callback();
      }, 16);
      pending.set(handle, { mode, frameSource: undefined });
      return handle;
    },
    cancel(handle) {
      const request = pending.get(handle);
      pending.delete(handle);
      if (request?.mode === "video-frame-callback" && request.frameSource) {
        request.frameSource.cancelVideoFrameCallback(handle);
        return;
      }
      if (request?.mode === "animation-frame-fallback") {
        globalThis.cancelAnimationFrame?.(handle);
        return;
      }
      globalThis.clearTimeout(handle);
    },
    getMode() {
      return mode;
    }
  };
}

/**
 * @typedef {AeroCvBrowserFrameSource & {
 *   requestVideoFrameCallback: (callback: () => void) => number,
 *   cancelVideoFrameCallback: (handle: number) => void
 * }} VideoFrameCallbackSource
 */

/**
 * @param {AeroCvBrowserFrameSource | undefined} frameSource
 * @returns {frameSource is VideoFrameCallbackSource}
 */
function isVideoFrameCallbackSource(frameSource) {
  return Boolean(
    frameSource
    && "requestVideoFrameCallback" in frameSource
    && typeof frameSource.requestVideoFrameCallback === "function"
    && "cancelVideoFrameCallback" in frameSource
    && typeof frameSource.cancelVideoFrameCallback === "function"
  );
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
