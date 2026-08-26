// @ts-check

/**
 * Compatibility fixture ID retained so existing replay checkpoints keep the
 * same visible source while CV no longer depends on the MoveNet package.
 *
 * @type {"aero.movenet.replay.basic-upper-body"}
 */
export const aeroCvReplayFixtureId = "aero.movenet.replay.basic-upper-body";

/**
 * Stable CV-owned deterministic adapter identity.
 *
 * @type {"aero-cv-replay"}
 */
export const aeroCvReplayVendorId = "aero-cv-replay";

/**
 * @typedef {import("@aerobeat/web-contracts").NormalizedPoseFrame} NormalizedPoseFrame
 * @typedef {import("@aerobeat/web-contracts").AeroPoseAdapter} AeroPoseAdapter
 */

/**
 * @typedef {Object} AeroCvReplayPoseSource
 * @property {"replay-fixture"} sourceKind Deterministic replay source kind.
 * @property {string} sourceId Replay source identifier.
 * @property {readonly NormalizedPoseFrame[]} frames Normalized replay frames.
 */

/**
 * Creates the deterministic replay sequence historically used by CV proving.
 * The data is CV-owned so orchestration has no runtime vendor dependency.
 *
 * @returns {AeroCvReplayPoseSource}
 */
export function createAeroCvReplayPoseSource() {
  return {
    sourceKind: "replay-fixture",
    sourceId: aeroCvReplayFixtureId,
    frames: [
      createReplayFrame(0, {
        nose: [0.5, 0.2, 0.96],
        leftWrist: [0.25, 0.44, 0.92],
        rightWrist: [0.74, 0.45, 0.91]
      }),
      createReplayFrame(500, {
        nose: [0.5, 0.24, 0.95],
        leftWrist: [0.2, 0.35, 0.93],
        rightWrist: [0.78, 0.6, 0.9]
      }),
      createReplayFrame(1000, {
        nose: [0.48, 0.56, 0.94],
        leftWrist: [0.34, 0.52, 0.9],
        rightWrist: [0.68, 0.5, 0.9]
      })
    ]
  };
}

/**
 * Creates a CV-owned replay adapter for deterministic fallback and tests.
 *
 * @param {{ source?: AeroCvReplayPoseSource }} [options]
 * @returns {AeroPoseAdapter}
 */
export function createAeroCvMockPoseAdapter(options = {}) {
  const source = options.source ?? createAeroCvReplayPoseSource();
  let cursor = 0;
  /** @type {import("@aerobeat/web-contracts").AeroPoseAdapterLifecycleStatus} */
  let status = "idle";

  return {
    vendorId: aeroCvReplayVendorId,
    model: {
      vendorId: aeroCvReplayVendorId,
      modelId: "basic-upper-body-replay",
      modelVersion: "1",
      runtimeId: "aerobeat-cv-replay",
      runtimeVersion: "1"
    },
    capabilities: {
      supportsMainThread: true,
      supportsWorker: false,
      supportsMirroring: true,
      supportsFrameSizeOverride: true,
      executionProviders: ["deterministic-replay"]
    },
    get status() {
      return status;
    },
    async load() {
      if (status === "disposed") {
        throw new Error("CV replay pose adapter is disposed");
      }
      status = "ready";
    },
    async estimateNormalizedPoseFrame() {
      if (status !== "ready") {
        await this.load();
      }
      const frame = source.frames[cursor % source.frames.length];
      cursor += 1;
      return clonePoseFrame(frame);
    },
    getExecutionTelemetry() {
      return {
        location: "main-thread",
        provider: "deterministic-replay",
        detail: "CV-owned deterministic replay adapter",
        fallback: false,
        loadDurationMs: 0,
        estimateDurationMs: 0
      };
    },
    dispose() {
      status = "disposed";
    }
  };
}

/**
 * @param {number} timestampMs
 * @param {Readonly<{
 *   nose: readonly [number, number, number],
 *   leftWrist: readonly [number, number, number],
 *   rightWrist: readonly [number, number, number]
 * }>} points
 * @returns {NormalizedPoseFrame}
 */
function createReplayFrame(timestampMs, points) {
  return {
    sourceId: aeroCvReplayFixtureId,
    timestampMs,
    mirrored: true,
    landmarks: [
      createLandmark("nose", points.nose),
      createLandmark("left_wrist", points.leftWrist),
      createLandmark("right_wrist", points.rightWrist)
    ]
  };
}

/**
 * @param {string} name
 * @param {readonly [number, number, number]} point
 * @returns {{ name: string, x: number, y: number, confidence: number }}
 */
function createLandmark(name, point) {
  return {
    name,
    x: point[0],
    y: point[1],
    confidence: point[2]
  };
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
    landmarks: frame.landmarks.map((landmark) => ({ ...landmark }))
  };
}
