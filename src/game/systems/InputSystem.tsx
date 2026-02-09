import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '../store';
import { WEAPON_ROTATION_ORDER } from '../config/weapons';

export const InputSystem = () => {
  const { gl } = useThree();

  const setMoveInput = useGameStore((state) => state.setMoveInput);
  const setFireInput = useGameStore((state) => state.setFireInput);
  const setLookInput = useGameStore((state) => state.setLookInput);
  const setWeaponSwap = useGameStore((state) => state.setWeaponSwap);

  const movementKeysRef = useRef({ w: false, a: false, s: false, d: false });
  const firingRef = useRef(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
        movementKeysRef.current[key] = true;
      }

      if (event.key === 'Escape') {
        if (document.pointerLockElement === gl.domElement) {
          document.exitPointerLock();
        }

        const game = useGameStore.getState();
        if (game.gameState === 'playing' || game.gameState === 'paused') {
          game.togglePause();
        }
      }

      if (event.key === '1') setWeaponSwap(WEAPON_ROTATION_ORDER[0]);
      if (event.key === '2') setWeaponSwap(WEAPON_ROTATION_ORDER[1]);
      if (event.key === '3') setWeaponSwap(WEAPON_ROTATION_ORDER[2]);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
        movementKeysRef.current[key] = false;
      }
    };

    const onMouseDown = (event: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const insideCanvas =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (!insideCanvas) {
        return;
      }

      const game = useGameStore.getState();
      if (
        game.gameState !== 'playing' ||
        game.isPaused ||
        game.matchPhase === 'perk_select' ||
        game.matchPhase === 'completed'
      ) {
        return;
      }

      if (document.pointerLockElement !== gl.domElement) {
        gl.domElement.requestPointerLock();
      }

      firingRef.current = true;
    };

    const onMouseUp = () => {
      firingRef.current = false;
    };

    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement !== gl.domElement) {
        return;
      }

      const game = useGameStore.getState();
      if (
        game.gameState !== 'playing' ||
        game.isPaused ||
        game.matchPhase === 'perk_select' ||
        game.matchPhase === 'completed'
      ) {
        return;
      }

      setLookInput(event.movementX, event.movementY);
    };

    const onPointerLockChange = () => {
      if (document.pointerLockElement !== gl.domElement) {
        firingRef.current = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('pointerlockchange', onPointerLockChange);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
    };
  }, [gl.domElement, setLookInput, setWeaponSwap]);

  useFrame(() => {
    const game = useGameStore.getState();
    if (
      game.gameState !== 'playing' ||
      game.isPaused ||
      game.matchPhase === 'perk_select' ||
      game.matchPhase === 'completed'
    ) {
      setMoveInput(0, 0);
      setFireInput(false);
      return;
    }

    const keys = movementKeysRef.current;

    const moveForward = (keys.w ? 1 : 0) - (keys.s ? 1 : 0);
    const moveRight = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);

    setMoveInput(moveForward, moveRight);
    setFireInput(firingRef.current);
  });

  return null;
};
