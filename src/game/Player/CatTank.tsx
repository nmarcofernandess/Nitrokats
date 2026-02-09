import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DataTexture, Group, MathUtils, NearestFilter, RedFormat } from 'three';
import { Edges } from '@react-three/drei';
import { useGameStore } from '../store';
import { gameRegistry } from '../Utils/ObjectRegistry';

const createGradientMap = () => {
  const data = new Uint8Array([0, 65, 145, 255]);
  const texture = new DataTexture(data, data.length, 1, RedFormat);
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
};

export const CatTank = () => {
  const rootRef = useRef<Group>(null);
  const turretRef = useRef<Group>(null);
  const gradientMap = useMemo(() => createGradientMap(), []);

  useEffect(() => {
    if (!rootRef.current) {
      return;
    }

    rootRef.current.userData.ignoreCameraOcclusion = true;
    gameRegistry.registerPlayer(rootRef.current);

    return () => {
      gameRegistry.unregisterPlayer();
    };
  }, []);

  useFrame((state, delta) => {
    if (!rootRef.current || !turretRef.current) {
      return;
    }

    const game = useGameStore.getState();
    if (game.gameState !== 'playing') {
      return;
    }

    const moveAmount = Math.abs(game.input.moveForward) + Math.abs(game.input.moveRight);
    const bob = moveAmount > 0 ? Math.sin(state.clock.elapsedTime * 8.5) * 0.02 : 0;
    rootRef.current.position.y = MathUtils.damp(rootRef.current.position.y, 0.72 + bob, 10, delta);

    turretRef.current.rotation.z = MathUtils.damp(
      turretRef.current.rotation.z,
      game.input.isFiring ? -0.04 : 0,
      8,
      delta,
    );
  });

  return (
    <group ref={rootRef} position={[0, 0.72, 0]}>
      <mesh castShadow receiveShadow position={[0, -0.2, 0]}>
        <boxGeometry args={[2.2, 0.36, 2.6]} />
        <meshToonMaterial color="#1d2e56" gradientMap={gradientMap} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.06, 0]}>
        <boxGeometry args={[1.55, 0.62, 1.95]} />
        <meshToonMaterial color="#3e6fb8" gradientMap={gradientMap} />
        <Edges color="#131c34" threshold={12} />
      </mesh>

      <mesh position={[-0.98, -0.06, 0]}>
        <boxGeometry args={[0.34, 0.46, 2.42]} />
        <meshToonMaterial color="#162542" gradientMap={gradientMap} />
      </mesh>

      <mesh position={[0.98, -0.06, 0]}>
        <boxGeometry args={[0.34, 0.46, 2.42]} />
        <meshToonMaterial color="#162542" gradientMap={gradientMap} />
      </mesh>

      <group ref={turretRef} position={[0.1, 0.42, 0.2]}>
        <mesh castShadow receiveShadow position={[0, 0.2, 0]}>
          <boxGeometry args={[0.92, 0.58, 1.16]} />
          <meshToonMaterial color="#89bbff" gradientMap={gradientMap} />
          <Edges color="#17253f" threshold={12} />
        </mesh>

        <mesh castShadow receiveShadow position={[0, 0.1, 0.92]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.12, 1.3, 12]} />
          <meshToonMaterial color="#d8ecff" gradientMap={gradientMap} />
        </mesh>

        <group name="weapon_socket" position={[0, 0.1, 1.55]} />
      </group>
    </group>
  );
};
