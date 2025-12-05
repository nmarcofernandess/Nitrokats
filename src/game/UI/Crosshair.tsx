import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Mesh } from 'three';

export const Crosshair = ({ position }: { position: Vector3 }) => {
    const ref = useRef<Mesh>(null);

    useFrame(() => {
        if (ref.current) {
            // Rotate crosshair for style
            ref.current.rotation.z += 0.05;
        }
    });

    return (
        <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.5, 0.6, 32]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.6} />
        </mesh>
    );
};
