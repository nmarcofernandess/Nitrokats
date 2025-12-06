import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group } from 'three';
import { useGameStore } from '../store';
import { audioManager } from '../Utils/AudioManager';
import { checkCircleCollision } from '../Utils/CollisionUtils';
import { gameRegistry } from '../Utils/ObjectRegistry';

const LASER_SPEED = 20;
const MAX_DISTANCE = 100;

const Laser = ({ id, position, rotation, source }: { id: string; position: Vector3; rotation: any; source: 'player' | 'enemy' }) => {
    const ref = useRef<Group>(null);
    const removeLaser = useGameStore((state) => state.removeLaser);
    const targets = useGameStore((state) => state.targets);
    const removeTarget = useGameStore((state) => state.removeTarget);
    const addParticle = useGameStore((state) => state.addParticle);
    const spawnPowerUp = useGameStore((state) => state.spawnPowerUp);
    const incrementKills = useGameStore((state) => state.incrementKills);
    const removeEnemy = useGameStore((state) => state.removeEnemy);
    const addScore = useGameStore((state) => state.addScore);
    const takeDamage = useGameStore((state) => state.takeDamage);
    const wave = useGameStore((state) => state.wave);
    const isPaused = useGameStore((state) => state.isPaused);

    // Base damage is 10, increases by 20% per wave
    const getEnemyDamage = () => Math.floor(10 * (1 + (wave - 1) * 0.2));
    const startPos = useRef(position.clone());

    useFrame((_, delta) => {
        if (!ref.current) return;
        // Respect pause state
        if (isPaused) return;

        // Move forward in local Z (or whatever direction the tank was facing)
        ref.current.translateZ(LASER_SPEED * delta);

        // Check distance
        if (ref.current.position.distanceTo(startPos.current) > MAX_DISTANCE) {
            removeLaser(id);
            return;
        }

        // Check collision with targets
        for (const target of targets) {
            if (ref.current.position.distanceTo(target.position) < 1) {
                removeTarget(target.id);
                removeLaser(id);
                addParticle(target.position, '#ff0000', 10);
                break;
            }
        }

        // PLAYER LASERS hit ENEMIES (use gameRegistry for real-time positions!)
        if (source === 'player') {
            const enemies = gameRegistry.getEnemies();
            for (const enemy of enemies) {
                // Use the actual THREE.js ref position, not store position
                if (ref.current.position.distanceTo(enemy.ref.position) < 1.5) {
                    removeEnemy(enemy.id);
                    removeLaser(id);
                    addScore(100);
                    incrementKills();
                    addParticle(enemy.ref.position.clone(), '#ff00ff', 15);
                    audioManager.playExplosion();
                    spawnPowerUp(enemy.ref.position.clone());
                    break;
                }
            }
        }

        // ENEMY LASERS hit PLAYER (use gameRegistry for real-time position!)
        if (source === 'enemy') {
            const playerPos = gameRegistry.getPlayerPosition();
            if (playerPos && checkCircleCollision(ref.current.position, 0.5, playerPos, 1.5)) {
                takeDamage(getEnemyDamage());
                removeLaser(id);
                addParticle(ref.current.position, '#00ffff', 5);
                audioManager.playHit();
            }
        }
    });

    return (
        <group ref={ref} position={position} rotation={rotation}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 1]} />
                <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={5} toneMapped={false} />
            </mesh>
            {/* Removed PointLight for performance */}
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
