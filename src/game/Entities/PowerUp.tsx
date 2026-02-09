import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import { Edges } from '@react-three/drei';
import { useGameStore } from '../store';
import { gameRegistry } from '../Utils/ObjectRegistry';
import { audioManager } from '../Utils/AudioManager';

interface PowerUpProps {
  id: string;
  position: Vector3;
}

export const PowerUp = ({ id, position }: PowerUpProps) => {
  const ref = useRef<Group>(null);
  const collectedRef = useRef(false);
  const collectPowerUp = useGameStore((state) => state.collectPowerUp);

  useFrame((state, delta) => {
    if (!ref.current || collectedRef.current) {
      return;
    }

    ref.current.rotation.y += delta;
    ref.current.position.y = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.2;

    const playerPos = gameRegistry.getPlayerPosition();
    if (playerPos && ref.current.position.distanceTo(playerPos) < 2) {
      collectedRef.current = true;
      collectPowerUp(id);
      audioManager.playPowerUp();
    }
  });

  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ffff00" transparent opacity={0.8} />
        <Edges color="#ffffff" />
      </mesh>
      <pointLight distance={3} intensity={2} color="#ffff00" />
    </group>
  );
};
