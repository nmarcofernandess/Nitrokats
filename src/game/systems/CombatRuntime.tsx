import { useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '../store';
import { aiManager } from '../Utils/AIManager';
import { AimSystem } from './AimSystem';
import { InputSystem } from './InputSystem';
import { PlayerControllerSystem } from './PlayerControllerSystem';
import { ThirdPersonCameraSystem } from './ThirdPersonCameraSystem';
import { MatchSystem } from './MatchSystem';

export const CombatRuntime = () => {
  const { gl } = useThree();
  const gameState = useGameStore((state) => state.gameState);
  const matchPhase = useGameStore((state) => state.matchPhase);

  useEffect(() => {
    const shouldReleasePointer =
      gameState !== 'playing' || matchPhase === 'perk_select' || matchPhase === 'completed';

    if (shouldReleasePointer && document.pointerLockElement === gl.domElement) {
      document.exitPointerLock();
    }
  }, [gameState, matchPhase, gl.domElement]);

  useFrame((_, delta) => {
    if (gameState !== 'playing') {
      return;
    }

    aiManager.update(delta);
  });

  return (
    <>
      <InputSystem />
      <ThirdPersonCameraSystem />
      <AimSystem />
      <PlayerControllerSystem />
      <MatchSystem />
    </>
  );
};
