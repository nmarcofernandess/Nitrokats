import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group } from 'three';
import { Edges } from '@react-three/drei';
import { useGameStore } from '../store';
import { generateCatFaceTexture, generateTracksTexture, generateChassisTexture } from '../Utils/TextureGenerator';

const ENEMY_SPEED = 3;
const CHASE_DISTANCE = 30;
const SHOOT_DISTANCE = 15;
const SHOOT_COOLDOWN = 2;

// Enemy Manager Component
export const EnemyManager = () => {
    const enemies = useGameStore((state) => state.enemies);
    const addEnemy = useGameStore((state) => state.addEnemy);

    // Spawn initial enemies
    useEffect(() => {
        if (enemies.length === 0) {
            addEnemy(new Vector3(10, 0, 10));
            addEnemy(new Vector3(-10, 0, -10));
            addEnemy(new Vector3(10, 0, -10));
        }
    }, []);

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

    const playerPosition = useGameStore((state) => state.playerPosition);
    const addLaser = useGameStore((state) => state.addLaser);
    const updateEnemy = useGameStore((state) => state.updateEnemy);

    const [lastShootTime, setLastShootTime] = useState(0);

    // Textures
    const [catFace] = useState(() => generateCatFaceTexture('#2e1a1a', '#ffff00')); // Evil Red/Brown with Yellow Eyes
    const [tracks] = useState(() => generateTracksTexture());
    const [chassis] = useState(() => generateChassisTexture('#4a2a2a'));

    // Local state for smooth movement before syncing to store (optimization)
    // Actually, let's sync to store every frame so collision works? 
    // Or just use local ref for logic and sync periodically?
    // For MVP, sync every frame is fine for 3 enemies.

    useFrame((state, delta) => {
        if (!bodyRef.current || !headRef.current || !playerPosition) return;

        // Sync initial position from store if needed, but we drive it here
        // Actually, we should initialize ref once.

        const currentPos = bodyRef.current.position;
        const dist = currentPos.distanceTo(playerPosition);

        if (dist < CHASE_DISTANCE) {
            // Chase Logic
            const direction = playerPosition.clone().sub(currentPos).normalize();

            // Move towards player
            if (dist > 5) {
                // Simple Collision Check against Player
                // If too close to player, stop.
                if (dist > 3) {
                    bodyRef.current.position.add(direction.multiplyScalar(ENEMY_SPEED * delta));
                }
            }

            // Rotate Body to face player
            bodyRef.current.lookAt(playerPosition.x, currentPos.y, playerPosition.z);

            // Rotate Head to face player
            headRef.current.lookAt(playerPosition.x, headRef.current.position.y, playerPosition.z);

            // Shoot Logic
            if (dist < SHOOT_DISTANCE && state.clock.elapsedTime - lastShootTime > SHOOT_COOLDOWN) {
                addLaser(
                    headRef.current.position.clone().add(new Vector3(0, 0, 1).applyEuler(headRef.current.rotation)),
                    headRef.current.rotation.clone()
                );
                setLastShootTime(state.clock.elapsedTime);
            }

            // Sync back to store for collision/logic
            updateEnemy(data.id, bodyRef.current.position.clone(), bodyRef.current.rotation.y);
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
