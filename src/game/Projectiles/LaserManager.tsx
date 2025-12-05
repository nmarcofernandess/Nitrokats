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
    const enemies = useGameStore((state) => state.enemies);
    const removeEnemy = useGameStore((state) => state.removeEnemy);
    const addScore = useGameStore((state) => state.addScore);
    const playerPosition = useGameStore((state) => state.playerPosition);
    const takeDamage = useGameStore((state) => state.takeDamage);
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

        // Check Enemy Collision
        for (const enemy of enemies) {
            if (ref.current.position.distanceTo(enemy.position) < 1.5) {
                // Determine if this laser is from player or enemy?
                // For now, all lasers hurt enemies.
                // Ideally enemies have health.
                // Let's just kill them instantly for MVP satisfaction or add health logic.
                // Store has health for enemies? Yes, we added it.
                // But we don't have 'damageEnemy' action yet, only updateEnemy.
                // Let's just kill them for now.
                removeEnemy(enemy.id);
                removeLaser(id);
                addScore(100);
                addParticle(enemy.position, '#ff00ff', 15); // Big Explosion
                break;
            }
        }

        // Check Player Collision (Friendly Fire or Enemy Fire - for now all lasers hurt player)
        // Ideally we distinguish source, but for MVP chaos, let's say lasers hurt everyone.
        // Actually, let's make it so only "Enemy" lasers hurt player, but we don't have source info yet.
        // Hack: If laser is close to player, hurt player.
        if (playerPosition && ref.current.position.distanceTo(playerPosition) < 1.5) {
            takeDamage(10);
            removeLaser(id);
            addParticle(playerPosition, '#00ffff', 5); // Player hit sparks
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
