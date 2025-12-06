import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '../store';
import { MathUtils } from 'three';

export const VFXManager = () => {
    const particles = useGameStore((state) => state.particles);
    const updateParticles = useGameStore((state) => state.updateParticles);
    const { camera } = useThree();

    const shake = useGameStore((state) => state.shake);
    const triggerShake = useGameStore((state) => state.triggerShake);

    // Shake state (local for smooth decay, but triggered by store)
    const currentShake = useRef(0);

    // Sync store shake to local ref
    if (shake > 0) {
        currentShake.current = shake;
        triggerShake(0); // Reset store immediately
    }

    useFrame((_, delta) => {
        updateParticles(delta);

        // Screen Shake Decay
        if (currentShake.current > 0) {
            const intensity = currentShake.current;
            const intensity = currentShake.current;
            // camera.position.x += (Math.random() - 0.5) * intensity;
            // camera.position.y += (Math.random() - 0.5) * intensity;
            // camera.position.z += (Math.random() - 0.5) * intensity;
            // Shake Disabled for Performance

            currentShake.current = MathUtils.lerp(currentShake.current, 0, delta * 10);
        }
    });

    // Expose shake function globally or via store? 
    // For now, let's just use a window event or simple export if possible.
    // Actually, let's attach it to the window for "Red Pill" hacky speed, 
    // or better, add 'triggerShake' to store.
    // But for now, let's just render particles.

    return (
        <>
            {particles.map((p) => (
                <mesh key={p.id} position={p.position}>
                    <boxGeometry args={[0.2, 0.2, 0.2]} />
                    <meshBasicMaterial color={p.color} />
                </mesh>
            ))}
        </>
    );
};
