import { Vector3 } from 'three';

export const getCameraBasis = (yaw: number) => {
  const forward = new Vector3(Math.sin(yaw), 0, Math.cos(yaw)).normalize();
  const right = new Vector3(forward.z, 0, -forward.x).normalize();
  return { forward, right };
};

export const getThirdPersonDesiredPosition = (params: {
  target: Vector3;
  yaw: number;
  pitch: number;
  distance: number;
  shoulderOffset: number;
}) => {
  const { target, yaw, pitch, distance, shoulderOffset } = params;

  const { forward, right } = getCameraBasis(yaw);
  const planarDistance = distance * Math.cos(pitch);

  return target
    .clone()
    .addScaledVector(forward, -planarDistance)
    .addScaledVector(right, shoulderOffset)
    .add(new Vector3(0, Math.sin(pitch) * distance, 0));
};

export const getMovementFromCamera = (yaw: number, forwardInput: number, rightInput: number) => {
  const { forward, right } = getCameraBasis(yaw);
  return new Vector3().addScaledVector(forward, forwardInput).addScaledVector(right, rightInput);
};

export const getShortestAngleDelta = (current: number, target: number) =>
  Math.atan2(Math.sin(target - current), Math.cos(target - current));
