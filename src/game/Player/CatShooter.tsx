import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DataTexture, Group, MathUtils, NearestFilter, RedFormat } from 'three';
import { Edges } from '@react-three/drei';
import { useGameStore } from '../store';
import { gameRegistry } from '../Utils/ObjectRegistry';

const createGradientMap = () => {
  const data = new Uint8Array([0, 70, 150, 255]);
  const texture = new DataTexture(data, data.length, 1, RedFormat);
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
};

export const CatShooter = () => {
  const rootRef = useRef<Group>(null);
  const hipsRef = useRef<Group>(null);
  const torsoRef = useRef<Group>(null);
  const leftLegRef = useRef<Group>(null);
  const rightLegRef = useRef<Group>(null);

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
    if (!rootRef.current || !hipsRef.current || !torsoRef.current || !leftLegRef.current || !rightLegRef.current) {
      return;
    }

    const game = useGameStore.getState();
    if (game.gameState !== 'playing') {
      return;
    }

    const moveAmount = Math.abs(game.input.moveForward) + Math.abs(game.input.moveRight);
    const walkBlend = Math.min(1, moveAmount);
    const walk = Math.sin(state.clock.elapsedTime * 9.5) * walkBlend;

    leftLegRef.current.rotation.x = MathUtils.damp(leftLegRef.current.rotation.x, walk * 0.45, 12, delta);
    rightLegRef.current.rotation.x = MathUtils.damp(rightLegRef.current.rotation.x, -walk * 0.45, 12, delta);

    hipsRef.current.position.y = MathUtils.damp(hipsRef.current.position.y, 0.95 + Math.abs(walk) * 0.03, 10, delta);
    torsoRef.current.rotation.z = MathUtils.damp(
      torsoRef.current.rotation.z,
      game.input.isFiring ? -0.04 : 0,
      12,
      delta,
    );
  });

  return (
    <group ref={rootRef} position={[0, 0.95, 0]}>
      <group ref={hipsRef} position={[0, 0.95, 0]}>
        <group ref={leftLegRef} position={[-0.22, -0.5, 0]}>
          <mesh castShadow receiveShadow position={[0, -0.42, 0]}>
            <boxGeometry args={[0.26, 0.82, 0.3]} />
            <meshToonMaterial color="#2f477a" gradientMap={gradientMap} />
            <Edges color="#111827" threshold={12} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, -0.88, 0.02]}>
            <boxGeometry args={[0.32, 0.12, 0.45]} />
            <meshToonMaterial color="#223357" gradientMap={gradientMap} />
          </mesh>
        </group>

        <group ref={rightLegRef} position={[0.22, -0.5, 0]}>
          <mesh castShadow receiveShadow position={[0, -0.42, 0]}>
            <boxGeometry args={[0.26, 0.82, 0.3]} />
            <meshToonMaterial color="#2f477a" gradientMap={gradientMap} />
            <Edges color="#111827" threshold={12} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, -0.88, 0.02]}>
            <boxGeometry args={[0.32, 0.12, 0.45]} />
            <meshToonMaterial color="#223357" gradientMap={gradientMap} />
          </mesh>
        </group>

        <group ref={torsoRef} position={[0, 0.18, 0]}>
          <mesh castShadow receiveShadow position={[0, 0.3, 0]}>
            <boxGeometry args={[0.9, 0.95, 0.52]} />
            <meshToonMaterial color="#4f8cff" gradientMap={gradientMap} />
            <Edges color="#1c2b4b" threshold={12} />
          </mesh>

          <mesh castShadow receiveShadow position={[0, 0.95, 0.03]}>
            <boxGeometry args={[0.68, 0.68, 0.58]} />
            <meshToonMaterial color="#8fc4ff" gradientMap={gradientMap} />
            <Edges color="#1c2b4b" threshold={12} />
          </mesh>

          <mesh position={[-0.2, 1.38, -0.05]} rotation={[0, 0, 0.2]}>
            <coneGeometry args={[0.12, 0.26, 4]} />
            <meshToonMaterial color="#8fc4ff" gradientMap={gradientMap} />
          </mesh>
          <mesh position={[0.2, 1.38, -0.05]} rotation={[0, 0, -0.2]}>
            <coneGeometry args={[0.12, 0.26, 4]} />
            <meshToonMaterial color="#8fc4ff" gradientMap={gradientMap} />
          </mesh>

          <mesh position={[-0.16, 0.96, 0.34]}>
            <sphereGeometry args={[0.06, 10, 10]} />
            <meshStandardMaterial color="#ffffff" emissive="#7dc4ff" emissiveIntensity={1.5} />
          </mesh>
          <mesh position={[0.16, 0.96, 0.34]}>
            <sphereGeometry args={[0.06, 10, 10]} />
            <meshStandardMaterial color="#ffffff" emissive="#7dc4ff" emissiveIntensity={1.5} />
          </mesh>

          <mesh castShadow receiveShadow position={[0.34, 0.52, 0.38]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.09, 0.11, 1.02, 12]} />
            <meshToonMaterial color="#e4f3ff" gradientMap={gradientMap} />
          </mesh>

          <mesh castShadow receiveShadow position={[0.34, 0.52, 0.9]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.075, 0.32, 10]} />
            <meshToonMaterial color="#39d4ff" gradientMap={gradientMap} />
          </mesh>

          <group name="weapon_socket" position={[0.34, 0.52, 1.08]} />
        </group>
      </group>
    </group>
  );
};
