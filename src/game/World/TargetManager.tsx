import { useEffect, useRef } from 'react';
import { Group, Vector3 } from 'three';
import { Edges } from '@react-three/drei';
import { useGameStore } from '../store';
import { gameRegistry } from '../Utils/ObjectRegistry';

interface TargetProps {
  id: string;
  position: Vector3;
}

const Target = ({ id, position }: TargetProps) => {
  const meshRef = useRef<Group>(null);

  useEffect(() => {
    if (meshRef.current) {
      gameRegistry.registerBlock(id, meshRef.current);
    }

    return () => {
      gameRegistry.unregisterBlock(id);
    };
  }, [id]);

  return (
    <group ref={meshRef} position={position}>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
        <Edges scale={1.01} color="black" />
      </mesh>
    </group>
  );
};

export const TargetManager = () => {
  const targets = useGameStore((state) => state.targets);
  const addTarget = useGameStore((state) => state.addTarget);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current || targets.length > 0) {
      return;
    }

    initializedRef.current = true;
    addTarget(new Vector3(5, 0.5, 5));
    addTarget(new Vector3(-5, 0.5, 5));
    addTarget(new Vector3(5, 0.5, -5));
    addTarget(new Vector3(-5, 0.5, -5));
    addTarget(new Vector3(10, 0.5, 0));
  }, [addTarget, targets.length]);

  return (
    <>
      {targets.map((target) => (
        <Target key={target.id} id={target.id} position={target.position} />
      ))}
    </>
  );
};
