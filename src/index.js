// @ts-check

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
 * @typedef {Object} AeroCameraCvService
 * @property {"aero.cv.pose"} serviceId Stable service ID.
 * @property {readonly CvFrameSourceKind[]} supportedSources Supported frame-source kinds.
 * @property {() => Promise<void>} start Starts camera/CV frame production.
 * @property {() => Promise<void>} stop Stops camera/CV frame production.
 */

/**
 * Creates the vendor-agnostic camera/CV singleton boundary.
 *
 * @returns {AeroCameraCvService}
 */
export function createAeroCameraCvService() {
  return {
    serviceId: aeroCvPoseServiceId,
    supportedSources: ["live-camera", "video-file", "replay-fixture"],
    async start() {
      throw new Error("Camera/CV start is not implemented in the skeleton.");
    },
    async stop() {
      throw new Error("Camera/CV stop is not implemented in the skeleton.");
    }
  };
}
