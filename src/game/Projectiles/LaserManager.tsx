import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group } from 'three';
import { useGameStore } from '../store';

const LASER_SPEED = 20;
const MAX_DISTANCE = 100;

const Laser = ({ id, position, rotation }: { id: string; position: Vector3; rotation: any }) => {
    const ref = useRef<Group>(null);
    const removeLaser = useGameStore((state) => state.removeLaser);
    const targets = useGameStore((state) => state.targets);
    const removeTarget = useGameStore((state) => state.removeTarget);
    const addParticle = useGameStore((state) => state.addParticle);
    const startPos = useRef(position.clone());

    useFrame((_, delta) => {
        if (!ref.current) return;

        // Move forward in local Z (or whatever direction the tank was facing)
        // Since we pass the rotation, we can just move along the forward vector
        ref.current.translateZ(LASER_SPEED * delta);

        // Check distance
        if (ref.current.position.distanceTo(startPos.current) > MAX_DISTANCE) {
            removeLaser(id);
            return;
        }

        // Check collision with targets
        // Simple distance check (O(N) per laser)
        for (const target of targets) {
            if (ref.current.position.distanceTo(target.position) < 1) {
                removeTarget(target.id);
                removeLaser(id);
                addParticle(target.position, '#ff0000', 10); // Explosion
                break; // One hit per laser
            }
        }
    });

    return (
        <group ref={ref} position={position} rotation={rotation}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 1]} />
                <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={10} toneMapped={false} />
            </mesh>
            <pointLight color="#ff00ff" intensity={2} distance={5} decay={2} />
        </group>
    );
};

export const LaserManager = () => {
    const lasers = useGameStore((state) => state.lasers);
    return (
        <>
            {lasers.map((laser) => (
                <Laser key={laser.id} {...laser} />
            ))}
        </>
    );
};
