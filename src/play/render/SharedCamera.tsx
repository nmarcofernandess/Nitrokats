import type { OrthographicCamera } from 'three';
import type { Vec2 } from '../core/model';
import { CAMERA_AZIMUTH, CAMERA_ELEVATION, computeCameraFrame, projectToFrame } from './cameraMath';

const CAMERA_DISTANCE = 36;
const OPEN_RATE = 9;
const CLOSE_RATE = 1.6;
const MAX_SAFE_NDC = 0.78;

/** Stateful camera smoothing owned by the single render-frame loop. */
export class SharedCameraController {
  private center: Vec2 | null = null;
  private halfHeight = 8;

  update(camera: OrthographicCamera, points: readonly Vec2[], aspect: number, deltaSeconds: number): void {
    const target = computeCameraFrame(points, aspect);
    if (!this.center) {
      this.center = { ...target.center };
      this.halfHeight = target.halfHeight;
    } else {
      const delta = Math.max(0, Math.min(deltaSeconds, 0.1));
      const centerAlpha = 1 - Math.exp(-delta * 5.5);
      this.center.x += (target.center.x - this.center.x) * centerAlpha;
      this.center.z += (target.center.z - this.center.z) * centerAlpha;

      let framingScale = 1;
      for (const point of points) {
        if (!Number.isFinite(point.x) || !Number.isFinite(point.z)) continue;
        const projected = projectToFrame(point, { center: this.center, halfHeight: target.halfHeight }, aspect);
        framingScale = Math.max(framingScale, Math.abs(projected.x) / MAX_SAFE_NDC, Math.abs(projected.y) / MAX_SAFE_NDC);
      }
      const safeTargetHalfHeight = target.halfHeight * framingScale;
      const zoomRate = safeTargetHalfHeight > this.halfHeight ? OPEN_RATE : CLOSE_RATE;
      const zoomAlpha = 1 - Math.exp(-delta * zoomRate);
      this.halfHeight += (safeTargetHalfHeight - this.halfHeight) * zoomAlpha;
      // Expansion is a visibility constraint: smoothing may close gradually,
      // but the applied frame must contain every active player immediately.
      this.halfHeight = Math.max(this.halfHeight, safeTargetHalfHeight);
    }

    const horizontal = CAMERA_DISTANCE * Math.cos(CAMERA_ELEVATION);
    camera.position.set(
      this.center.x + horizontal * Math.sin(CAMERA_AZIMUTH),
      CAMERA_DISTANCE * Math.sin(CAMERA_ELEVATION),
      this.center.z + horizontal * Math.cos(CAMERA_AZIMUTH),
    );
    camera.lookAt(this.center.x, 0, this.center.z);
    camera.updateMatrixWorld();
    camera.left = -this.halfHeight * aspect;
    camera.right = this.halfHeight * aspect;
    camera.top = this.halfHeight;
    camera.bottom = -this.halfHeight;
    camera.updateProjectionMatrix();
  }
}
