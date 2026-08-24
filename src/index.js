// @ts-check

import { createMoveNetMockPoseAdapter } from "@aerobeat/web-vendor-movenet";

/**
 * AeroBeat-owned CV service ID consumed through assembly wiring.
 *
 * @type {"aero.cv.pose"}
 */
export const aeroCvPoseServiceId = "aero.cv.pose";

/**
 * @typedef {"live-camera" | "video-file" | "replay-fixture"} CvFrameSourceKind
 */

/**
 * @typedef {import("@aerobeat/web-contracts").NormalizedPoseFrame} NormalizedPoseFrame
 * @typedef {import("@aerobeat/web-vendor-movenet").MoveNetPoseAdapter} MoveNetPoseAdapter
 */

/**
 * @typedef {Object} AeroCameraCvServiceOptions
 * @property {MoveNetPoseAdapter | undefined} poseAdapter Optional normalized pose adapter.
 * @property {CvFrameSourceKind | undefined} sourceKind Source kind reported by this service.
 */

/**
 * @typedef {Object} AeroCameraCvService
 * @property {"aero.cv.pose"} serviceId Stable service ID.
 * @property {readonly CvFrameSourceKind[]} supportedSources Supported frame-source kinds.
 * @property {CvFrameSourceKind} sourceKind Current frame source kind.
 * @property {boolean} running Whether frame production is active.
 * @property {() => Promise<void>} start Starts camera/CV frame production.
 * @property {() => Promise<void>} stop Stops camera/CV frame production.
 * @property {() => Promise<NormalizedPoseFrame>} nextPoseFrame Pulls the next normalized pose frame.
 * @property {() => NormalizedPoseFrame | undefined} getLatestPoseFrame Reads the latest normalized pose frame.
 */

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
 * Creates the vendor-agnostic camera/CV singleton boundary.
 *
 * @param {AeroCameraCvServiceOptions} [options]
 * @returns {AeroCameraCvService}
 */
export function createAeroCameraCvService(options = {}) {
  const poseAdapter = options.poseAdapter ?? createMoveNetMockPoseAdapter();
  const sourceKind = options.sourceKind ?? "replay-fixture";
  let running = false;
  /** @type {NormalizedPoseFrame | undefined} */
  let latestPoseFrame;

  return {
    serviceId: aeroCvPoseServiceId,
    supportedSources: ["live-camera", "video-file", "replay-fixture"],
    sourceKind,
    get running() {
      return running;
    },
    async start() {
      await poseAdapter.load();
      running = true;
    },
    async stop() {
      running = false;
    },
    async nextPoseFrame() {
      if (!running) {
        await this.start();
      }
      latestPoseFrame = await poseAdapter.estimateNormalizedPoseFrame();
      return clonePoseFrame(latestPoseFrame);
    },
    getLatestPoseFrame() {
      return latestPoseFrame ? clonePoseFrame(latestPoseFrame) : undefined;
    }
  };
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
