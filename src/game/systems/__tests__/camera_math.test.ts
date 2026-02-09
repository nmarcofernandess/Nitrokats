import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { getCameraBasis, getThirdPersonDesiredPosition } from '../runtimeMath';

describe('third person camera math', () => {
  it('keeps camera behind player for yaw=0', () => {
    const target = new Vector3(0, 1.6, 0);

    const desired = getThirdPersonDesiredPosition({
      target,
      yaw: 0,
      pitch: 0,
      distance: 4.5,
      shoulderOffset: 0,
    });

    const toPlayer = target.clone().sub(desired).setY(0).normalize();
    const { forward } = getCameraBasis(0);

    expect(desired.z).toBeLessThan(target.z);
    expect(toPlayer.dot(forward)).toBeGreaterThan(0.999);
  });
});
