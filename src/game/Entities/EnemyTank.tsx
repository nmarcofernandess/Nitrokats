import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group } from 'three';
import { Edges } from '@react-three/drei';
import { useGameStore } from '../store';
import { generateCatFaceTexture, generateTracksTexture, generateChassisTexture } from '../Utils/TextureGenerator';

import { gameRegistry } from '../Utils/ObjectRegistry';

const ENEMY_SPEED = 3;
const CHASE_DISTANCE = 30;
const SHOOT_DISTANCE = 15;
const SHOOT_COOLDOWN = 2;

// Enemy Manager Component
export const EnemyManager = () => {
    const enemies = useGameStore((state) => state.enemies);
    const addEnemy = useGameStore((state) => state.addEnemy);
    const wave = useGameStore((state) => state.wave);
    const nextWave = useGameStore((state) => state.nextWave);
    const gameState = useGameStore((state) => state.gameState);

    // Separate effect for detecting wave clear?
    // Actually, let's keep it simple:
    // If enemies == 0, wait 1s, then increment wave, which triggers spawn.
    useEffect(() => {
        if (gameState === 'playing' && enemies.length === 0) {
            const timeout = setTimeout(() => {
                nextWave();
                // Note: nextWave changes 'wave', which triggers the spawn effect above if we had it there.
                // But wait, the spawn logic above needs to run WHEN wave changes.
            }, 1000);
            return () => clearTimeout(timeout);
        }
    }, [enemies.length, gameState, nextWave]);

    // Actual Spawn Effect
    useEffect(() => {
        if (gameState === 'playing' && enemies.length === 0) {
            const count = 2 + wave;
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = 20 + Math.random() * 10;
                const x = Math.sin(angle) * radius;
                const z = Math.cos(angle) * radius;
                addEnemy(new Vector3(x, 0, z));
            }
        }
    }, [wave, gameState, addEnemy, enemies.length]);

    return (
        <>
            {enemies.map(enemy => (
                <EnemyTank key={enemy.id} data={enemy} />
            ))}
        </>
    );
};

const EnemyTank = ({ data }: { data: { id: string, position: Vector3, rotation: number } }) => {
    const bodyRef = useRef<Group>(null);
    const headRef = useRef<Group>(null);

    // const playerPosition = useGameStore((state) => state.playerPosition); // REMOVED store sub
    const addLaser = useGameStore((state) => state.addLaser);
    const isPaused = useGameStore((state) => state.isPaused);
    // const updateEnemy = useGameStore((state) => state.updateEnemy); // REMOVED store update

    const [lastShootTime, setLastShootTime] = useState(0);

    // Register Enemy
    useEffect(() => {
        if (bodyRef.current) {
            gameRegistry.registerEnemy(data.id, bodyRef.current);
        }
        return () => gameRegistry.unregisterEnemy(data.id);
    }, [data.id]);

    // Textures
    const [catFace] = useState(() => generateCatFaceTexture('#2e1a1a', '#ffff00')); // Evil Red/Brown with Yellow Eyes
    const [tracks] = useState(() => generateTracksTexture());
    const [chassis] = useState(() => generateChassisTexture('#4a2a2a'));

    // Local state for smooth movement before syncing to store (optimization)
    // Actually, let's sync to store every frame so collision works? 
    // Or just use local ref for logic and sync periodically?
    // For MVP, sync every frame is fine for 3 enemies.

    useFrame((state, delta) => {
        if (!bodyRef.current || !headRef.current) return;
        // Respect pause state
        if (isPaused) return;

        const playerPos = gameRegistry.getPlayerPosition();
        if (!playerPos) return;

        const currentPos = bodyRef.current.position;
        const dist = currentPos.distanceTo(playerPos);

        if (dist < CHASE_DISTANCE) {
            // Chase Logic
            const direction = playerPos.clone().sub(currentPos).normalize();

            // Move towards player
            if (dist > 5) {
                // Check collision with other enemies (Basic Flocking/Avoidance)
                let avoidForce = new Vector3(0, 0, 0);
                const others = gameRegistry.getEnemies();
                for (const other of others) {
                    if (other.id !== data.id) {
                        const d = currentPos.distanceTo(other.ref.position);
                        if (d < 3) {
                            const push = currentPos.clone().sub(other.ref.position).normalize();
                            avoidForce.add(push.multiplyScalar(2.0));
                        }
                    }
                }

                const moveDir = direction.add(avoidForce).normalize();
                bodyRef.current.position.add(moveDir.multiplyScalar(ENEMY_SPEED * delta));
            }

            // Rotate Body to face player
            bodyRef.current.lookAt(playerPos.x, currentPos.y, playerPos.z);

            // Rotate Head to face player
            headRef.current.lookAt(playerPos.x, headRef.current.position.y, playerPos.z);

            // Shoot Logic - Improved accuracy with less random spread
            if (dist < SHOOT_DISTANCE && state.clock.elapsedTime - lastShootTime > SHOOT_COOLDOWN) {
                // Smaller spread = more accurate
                const spread = (Math.random() - 0.5) * 0.1;
                const fireDir = headRef.current.rotation.clone();
                fireDir.y += spread;

                addLaser(
                    headRef.current.position.clone().add(new Vector3(0, 0, 1).applyEuler(headRef.current.rotation)).add(bodyRef.current.position),
                    fireDir,
                    'enemy'
                );
                setLastShootTime(state.clock.elapsedTime);
            }

            // Note: We do NOT sync back to store position anymore.
        }
    });

    return (
        <group ref={bodyRef} position={data.position} rotation={[0, data.rotation, 0]}>
            {/* CHASSIS (Cat Box) */}
            <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
                <boxGeometry args={[1.8, 0.8, 2.2]} />
                <meshStandardMaterial map={chassis} />
                <Edges color="#ff0000" threshold={15} /> {/* Red Neon */}
            </mesh>

            {/* TRACKS */}
            <mesh position={[-1, 0, 0]}>
                <boxGeometry args={[0.4, 0.6, 2.4]} />
                <meshStandardMaterial map={tracks} />
            </mesh>
            <mesh position={[1, 0, 0]}>
                <boxGeometry args={[0.4, 0.6, 2.4]} />
                <meshStandardMaterial map={tracks} />
            </mesh>

            {/* HEAD (Evil Cat) */}
            <group ref={headRef} position={[0, 0.8, 0]}>
                <mesh castShadow position={[0, 0.3, 0]}>
                    <boxGeometry args={[1, 0.8, 0.9]} />
                    <meshStandardMaterial attach="material-0" color="#2e1a1a" />
                    <meshStandardMaterial attach="material-1" color="#2e1a1a" />
                    <meshStandardMaterial attach="material-2" color="#2e1a1a" />
                    <meshStandardMaterial attach="material-3" color="#2e1a1a" />
                    <meshStandardMaterial attach="material-4" map={catFace} />
                    <meshStandardMaterial attach="material-5" color="#2e1a1a" />
                    <Edges color="#ff4444" threshold={15} />
                </mesh>

                {/* Ears */}
                <mesh position={[-0.35, 0.8, 0]} rotation={[0, 0, 0.2]}>
                    <coneGeometry args={[0.15, 0.4, 4]} />
                    <meshStandardMaterial color="#2e1a1a" />
                    <Edges color="#ff4444" />
                </mesh>
                <mesh position={[0.35, 0.8, 0]} rotation={[0, 0, -0.2]}>
                    <coneGeometry args={[0.15, 0.4, 4]} />
                    <meshStandardMaterial color="#2e1a1a" />
                    <Edges color="#ff4444" />
                </mesh>

                {/* Evil Eyes */}
                <mesh position={[0.2, 0.4, 0.46]}>
                    <boxGeometry args={[0.2, 0.2, 0.1]} />
                    <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={2} />
                </mesh>
                <mesh position={[-0.2, 0.4, 0.46]}>
                    <boxGeometry args={[0.2, 0.2, 0.1]} />
                    <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={2} />
                </mesh>
            </group>
        </group>
    );
};
