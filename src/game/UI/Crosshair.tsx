import { useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3 } from 'three';

interface CrosshairProps {
  targetRef: RefObject<Vector3>;
}

export const Crosshair = ({ targetRef }: CrosshairProps) => {
  const ref = useRef<Mesh>(null);

  useFrame(() => {
    if (!ref.current || !targetRef.current) {
      return;
    }

    ref.current.rotation.z += 0.05;
    ref.current.position.copy(targetRef.current);
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.5, 0.6, 32]} />
      <meshBasicMaterial color="#00ffff" transparent opacity={0.6} />
    </mesh>
  );
};
