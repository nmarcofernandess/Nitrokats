import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Plane, Raycaster, Vector2, Vector3 } from 'three';
import { useGameStore } from '../store';
import { gameRegistry } from '../Utils/ObjectRegistry';

const tmpAimPoint = new Vector3();
const tmpEnemyDir = new Vector3();
const tmpCameraDir = new Vector3();
const centerScreen = new Vector2(0, 0);

export const AimSystem = () => {
  const { camera } = useThree();

  const setAimPoint = useGameStore((state) => state.setAimPoint);

  const raycaster = useMemo(() => new Raycaster(), []);
  const fallbackPlane = useMemo(() => new Plane(new Vector3(0, 1, 0), 0), []);

  useFrame(() => {
    const game = useGameStore.getState();
    if (game.gameState !== 'playing' || game.isPaused) {
      return;
    }

    raycaster.setFromCamera(centerScreen, camera);

    const hitPlane = raycaster.ray.intersectPlane(fallbackPlane, tmpAimPoint);
    if (!hitPlane) {
      setAimPoint(null, null);
      return;
    }

    tmpCameraDir.copy(raycaster.ray.direction).normalize();

    let bestTargetId: string | null = null;
    let bestAngle = Number.POSITIVE_INFINITY;

    const maxCone = 0.065;
    const enemies = gameRegistry.getEnemies();

    for (const enemy of enemies) {
      tmpEnemyDir.copy(enemy.ref.position).sub(camera.position).normalize();
      const angle = tmpEnemyDir.angleTo(tmpCameraDir);

      if (angle < maxCone && angle < bestAngle) {
        bestAngle = angle;
        bestTargetId = enemy.id;
      }
    }

    setAimPoint(tmpAimPoint, bestTargetId);
  });

  return null;
};
