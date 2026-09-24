import { expect, it } from 'vitest';
import { OrthographicCamera, Vector3 } from 'three';
import { computeCameraFrame, projectToFrame } from './cameraMath';
import { SharedCameraController } from './SharedCamera';

it('mantém os dois jogadores dentro da margem útil', () => {
  const points = [{ x: -10, z: -8 }, { x: 10, z: 8 }];
  for (const aspect of [16 / 9, 16 / 10, 4 / 3]) {
    const frame = computeCameraFrame(points, aspect);
    for (const point of points) {
      const ndc = projectToFrame(point, frame, aspect);
      expect(Math.abs(ndc.x)).toBeLessThanOrEqual(0.85);
      expect(Math.abs(ndc.y)).toBeLessThanOrEqual(0.85);
    }
  }
});

it('mantém margem para personagem e HUD quando a arena fica mais estreita', () => {
  const points = [{ x: -30, z: 4 }, { x: 28, z: 4 }];
  for (const aspect of [1, 0.72, Number.NaN, 0]) {
    const frame = computeCameraFrame(points, aspect);
    for (const point of points) {
      const ndc = projectToFrame(point, frame, aspect);
      expect(Math.abs(ndc.x)).toBeLessThanOrEqual(0.85);
      expect(Math.abs(ndc.y)).toBeLessThanOrEqual(0.85);
    }
  }
});

it('usa um enquadramento finito e central para listas vazias ou pontos inválidos', () => {
  for (const points of [[], [{ x: Number.NaN, z: 2 }], [{ x: 4, z: Number.POSITIVE_INFINITY }]]) {
    const frame = computeCameraFrame(points, 16 / 9);
    expect(frame.center).toEqual({ x: 0, z: 0 });
    expect(Number.isFinite(frame.halfHeight)).toBe(true);
    expect(frame.halfHeight).toBeGreaterThan(0);
  }
});

it('não amplia o zoom ao infinito quando os jogadores coincidem', () => {
  const frame = computeCameraFrame([{ x: 3, z: -2 }, { x: 3, z: -2 }], 16 / 9);
  expect(frame.center.x).toBeCloseTo(3);
  expect(frame.center.z).toBeCloseTo(-2);
  expect(frame.halfHeight).toBeGreaterThan(1);
  const ndc = projectToFrame({ x: 3, z: -2 }, frame, 16 / 9);
  expect(ndc.x).toBeCloseTo(0);
  expect(ndc.y).toBeCloseTo(0);
});

it('usa a orientação de tela da câmera que olha da diagonal positiva para o centro', () => {
  const frame = { center: { x: 0, z: 0 }, halfHeight: 10 };
  const towardsArenaBack = projectToFrame({ x: 0, z: 4 }, frame, 16 / 9);
  const towardsArenaRight = projectToFrame({ x: 4, z: 0 }, frame, 16 / 9);
  expect(towardsArenaBack.y).toBeLessThan(0);
  expect(towardsArenaRight.y).toBeLessThan(0);
  expect(towardsArenaBack.x).toBeLessThan(0);
  expect(towardsArenaRight.x).toBeGreaterThan(0);
});

it('abre o zoom no mesmo frame para manter jogadores recém-separados visíveis', () => {
  const camera = new OrthographicCamera(-8 * (16 / 9), 8 * (16 / 9), 8, -8, 0.1, 100);
  const controller = new SharedCameraController();
  const aspect = 16 / 9;
  controller.update(camera, [{ x: 0, z: 0 }, { x: 0, z: 0 }], aspect, 1 / 60);
  expect(camera.top).toBe(8);

  const separated = [{ x: -20, z: 0 }, { x: 20, z: 0 }];
  controller.update(camera, separated, aspect, 0.016);

  for (const point of separated) {
    const projected = new Vector3(point.x, 0, point.z).project(camera);
    expect(Math.abs(projected.x)).toBeLessThanOrEqual(0.780001);
    expect(Math.abs(projected.y)).toBeLessThanOrEqual(0.780001);
  }

  const shifted = [{ x: 12, z: -3 }, { x: 52, z: -3 }];
  controller.update(camera, shifted, aspect, 0.016);
  for (const point of shifted) {
    const projected = new Vector3(point.x, 0, point.z).project(camera);
    expect(Math.abs(projected.x)).toBeLessThanOrEqual(0.780001);
    expect(Math.abs(projected.y)).toBeLessThanOrEqual(0.780001);
  }
});
