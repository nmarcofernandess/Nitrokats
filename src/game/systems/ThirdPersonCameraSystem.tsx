import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Raycaster, Vector3 } from 'three';
import { useGameStore } from '../store';
import { gameRegistry } from '../Utils/ObjectRegistry';
import { getThirdPersonDesiredPosition } from './runtimeMath';

const tmpTarget = new Vector3();
const tmpDesired = new Vector3();
const tmpDirection = new Vector3();
const tmpForward = new Vector3();

const shouldIgnoreOcclusion = (object: { userData?: Record<string, unknown>; parent?: unknown }) => {
  const userData = object.userData ?? {};
  if (userData.ignoreCameraOcclusion) {
    return true;
  }

  const parent = object.parent as { userData?: Record<string, unknown> } | undefined;
  return Boolean(parent?.userData?.ignoreCameraOcclusion);
};

export const ThirdPersonCameraSystem = () => {
  const { camera, scene } = useThree();

  const setCameraState = useGameStore((state) => state.setCameraState);
  const clearLookInput = useGameStore((state) => state.clearLookInput);

  const raycasterRef = useRef(new Raycaster());
  const lookAtTargetRef = useRef(new Vector3());

  useFrame((_, delta) => {
    const player = gameRegistry.getPlayer();
    if (!player) {
      return;
    }

    const game = useGameStore.getState();
    if (game.gameState !== 'playing') {
      if (game.input.lookDeltaX !== 0 || game.input.lookDeltaY !== 0) {
        clearLookInput();
      }
      return;
    }

    const { input, camera: cameraState } = game;
    const lookDeltaX = input.lookDeltaX;
    const lookDeltaY = input.lookDeltaY;

    let yaw = cameraState.yaw;
    let pitch = cameraState.pitch;

    if (lookDeltaX !== 0 || lookDeltaY !== 0) {
      yaw -= lookDeltaX * cameraState.sensitivity;
      pitch -= lookDeltaY * cameraState.sensitivity;

      pitch = Math.max(cameraState.pitchMin, Math.min(cameraState.pitchMax, pitch));

      setCameraState({ yaw, pitch });
      clearLookInput();
    }

    tmpTarget.copy(player.position);
    tmpTarget.y += cameraState.height;

    tmpDesired.copy(
      getThirdPersonDesiredPosition({
        target: tmpTarget,
        yaw,
        pitch,
        distance: cameraState.distance,
        shoulderOffset: cameraState.shoulderOffset,
      }),
    );

    tmpDirection.copy(tmpDesired).sub(tmpTarget);
    const desiredDistance = tmpDirection.length();
    tmpDirection.normalize();

    const raycaster = raycasterRef.current;
    raycaster.set(tmpTarget, tmpDirection);
    raycaster.far = desiredDistance;

    const intersections = raycaster.intersectObjects(scene.children, true);
    const hit = intersections.find((entry) => !shouldIgnoreOcclusion(entry.object));

    if (hit) {
      const clampedDistance = Math.max(1.2, hit.distance - cameraState.collisionPadding);
      tmpDesired.copy(tmpTarget).addScaledVector(tmpDirection, clampedDistance);
    }

    const smoothFactor = 1 - Math.exp(-delta / Math.max(0.001, cameraState.smoothing));
    camera.position.lerp(tmpDesired, smoothFactor);

    tmpForward.set(
      player.position.x,
      player.position.y + cameraState.height * 0.7,
      player.position.z,
    );
    lookAtTargetRef.current.lerp(tmpForward, Math.min(1, smoothFactor * 1.2));
    camera.lookAt(lookAtTargetRef.current);
  });

  return null;
};
