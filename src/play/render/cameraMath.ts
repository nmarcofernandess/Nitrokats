import type { Vec2 } from '../core/model';

export interface CameraFrame {
  center: Vec2;
  halfHeight: number;
}

export interface FramePoint {
  x: number;
  z: number;
}

// Keep this basis in sync with the camera offset in SharedCamera.
export const CAMERA_AZIMUTH = Math.PI / 4;
export const CAMERA_ELEVATION = Math.PI / 4;
const RIGHT_X = Math.cos(CAMERA_AZIMUTH);
const RIGHT_Z = -Math.sin(CAMERA_AZIMUTH);
const UP_GROUND_X = -Math.sin(CAMERA_AZIMUTH) * Math.sin(CAMERA_ELEVATION);
const UP_GROUND_Z = -Math.cos(CAMERA_AZIMUTH) * Math.sin(CAMERA_ELEVATION);
const PLAYER_FRAME_RADIUS = 1.25;
const SAFE_HALF_EXTENT = 0.78;
const MIN_HALF_HEIGHT = 8;
const DEFAULT_ASPECT = 16 / 9;

function validAspect(aspect: number): number {
  return Number.isFinite(aspect) && aspect > 0 ? aspect : DEFAULT_ASPECT;
}

function toCameraPlane(point: FramePoint): { right: number; up: number } {
  return {
    right: point.x * RIGHT_X + point.z * RIGHT_Z,
    up: point.x * UP_GROUND_X + point.z * UP_GROUND_Z,
  };
}

function fromCameraPlane(right: number, up: number): Vec2 {
  const sineElevation = Math.sin(CAMERA_ELEVATION);
  return {
    x: right * RIGHT_X - up * Math.sin(CAMERA_AZIMUTH) / sineElevation,
    z: right * RIGHT_Z - up * Math.cos(CAMERA_AZIMUTH) / sineElevation,
  };
}

/** Fits all valid ground points with room for the player chassis and HUD. */
export function computeCameraFrame(points: readonly FramePoint[], aspect: number): CameraFrame {
  const validPoints = points.filter(point => Number.isFinite(point.x) && Number.isFinite(point.z));
  if (validPoints.length === 0) return { center: { x: 0, z: 0 }, halfHeight: MIN_HALF_HEIGHT };

  const projected = validPoints.map(toCameraPlane);
  const minRight = Math.min(...projected.map(point => point.right));
  const maxRight = Math.max(...projected.map(point => point.right));
  const minUp = Math.min(...projected.map(point => point.up));
  const maxUp = Math.max(...projected.map(point => point.up));
  const center = fromCameraPlane((minRight + maxRight) / 2, (minUp + maxUp) / 2);
  const safeAspect = validAspect(aspect);
  const halfHeight = Math.max(
    MIN_HALF_HEIGHT,
    ((maxUp - minUp) / 2 + PLAYER_FRAME_RADIUS) / SAFE_HALF_EXTENT,
    ((maxRight - minRight) / 2 + PLAYER_FRAME_RADIUS) / (SAFE_HALF_EXTENT * safeAspect),
  );
  return { center, halfHeight };
}

/** Projects a ground point into normalized device coordinates for this frame. */
export function projectToFrame(point: FramePoint, frame: CameraFrame, aspect: number): { x: number; y: number } {
  const safeFrame = Number.isFinite(frame.halfHeight) && frame.halfHeight > 0
    ? frame
    : { center: { x: 0, z: 0 }, halfHeight: MIN_HALF_HEIGHT };
  const delta = { x: point.x - safeFrame.center.x, z: point.z - safeFrame.center.z };
  const projected = toCameraPlane(delta);
  const height = safeFrame.halfHeight;
  const width = height * validAspect(aspect);
  return {
    x: Number.isFinite(projected.right) ? projected.right / width : 0,
    y: Number.isFinite(projected.up) ? projected.up / height : 0,
  };
}
