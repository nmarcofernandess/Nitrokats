import { useEffect } from 'react';
import { Vector3 } from 'three';
import { useGameStore } from '../store';

const Target = ({ position }: { id: string; position: Vector3 }) => {
    return (
        <mesh position={position}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
        </mesh>
    );
};

export const TargetManager = () => {
    const targets = useGameStore((state) => state.targets);
    const addTarget = useGameStore((state) => state.addTarget);

    useEffect(() => {
        // Spawn some initial targets
        if (targets.length === 0) {
            addTarget(new Vector3(5, 0.5, 5));
            addTarget(new Vector3(-5, 0.5, 5));
            addTarget(new Vector3(5, 0.5, -5));
            addTarget(new Vector3(-5, 0.5, -5));
            addTarget(new Vector3(10, 0.5, 0));
        }
    }, []); // Run once

    return (
        <>
            {targets.map((target) => (
                <Target key={target.id} {...target} />
            ))}
        </>
    );
};
