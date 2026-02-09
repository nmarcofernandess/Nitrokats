import { describe, expect, it } from 'vitest';
import { getMovementFromCamera } from '../runtimeMath';

describe('movement basis', () => {
  it('W follows camera forward when yaw=0', () => {
    const move = getMovementFromCamera(0, 1, 0).normalize();

    expect(move.z).toBeGreaterThan(0.99);
    expect(Math.abs(move.x)).toBeLessThan(0.001);
  });

  it('W follows camera forward when yaw=PI/2', () => {
    const move = getMovementFromCamera(Math.PI / 2, 1, 0).normalize();

    expect(move.x).toBeGreaterThan(0.99);
    expect(Math.abs(move.z)).toBeLessThan(0.001);
  });
});
