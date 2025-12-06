import { useRef, useEffect } from 'react';
import { Vector3, Group } from 'three';
import { useGameStore } from '../store';
import { Edges } from '@react-three/drei';
import { gameRegistry } from '../Utils/ObjectRegistry';

const Target = ({ id, position }: { id: string; position: Vector3 }) => {
    const meshRef = useRef<Group>(null!);

    useEffect(() => {
        if (meshRef.current) {
            gameRegistry.registerBlock(id, meshRef.current);
        }
        return () => {
            gameRegistry.blocks.delete(id);
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
                <Target key={target.id} id={target.id} position={target.position} />
            ))}
        </>
    );
};
