import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 as ThreeVector3, Group, Euler } from 'three'; // Renamed to avoid collision with Yuka
import { Edges } from '@react-three/drei';
import { Vehicle, ArriveBehavior } from 'yuka';
import { useGameStore } from '../store';
import { aiManager } from '../Utils/AIManager';
import { generateCatFaceTexture, generateTracksTexture, generateChassisTexture } from '../Utils/TextureGenerator';

import { gameRegistry } from '../Utils/ObjectRegistry';

const ENEMY_SPEED = 3;
const SHOOT_DISTANCE = 15;
const SHOOT_COOLDOWN = 2.0;

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
                addEnemy(new ThreeVector3(x, 0, z));
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

const EnemyTank = ({ data }: { data: { id: string, position: ThreeVector3, rotation: number } }) => {
    const bodyRef = useRef<Group>(null);
    const headRef = useRef<Group>(null);
    const vehicleRef = useRef<Vehicle>(null);

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

    // Initialize Yuka Vehicle
    useEffect(() => {
        const vehicle = new Vehicle();
        vehicle.position.set(data.position.x, data.position.y, data.position.z);
        vehicle.maxSpeed = ENEMY_SPEED;
        vehicle.mass = 1;

        // Behavior 1: Arrive at Player (smart pursuit)
        const arriveBehavior = new ArriveBehavior(aiManager.getPlayerEntity().position, 2.5, 0.5);
        vehicle.steering.add(arriveBehavior);

        // Register to Manager
        aiManager.registerEnemy(vehicle);
        vehicleRef.current = vehicle;

        return () => {
            aiManager.unregisterEnemy(vehicle);
        };
    }, []);

    useFrame((state, delta) => {
        if (!bodyRef.current || !headRef.current || !vehicleRef.current) return;
        // Respect pause state
        if (isPaused) return;

        // 1. Update AI World
        // Note: Usually manager updates all, but we need to sync visuals here.
        // aiManager.update(delta) is called globally? No, we should call it once in Scene.
        // But for component encapsulation, let's assume Scene calls it or we do it here?
        // Better: Scene handles ONE update loop for AI.
        // Refactoring: We need an AIUpdater component in Scene.
        // For now, let's just cheat and let the vehicle calculate its own steering force here if we haven't set up a global loop.
        // Actually, Yuka emphasizes a Manager. Let's make sure Scene calls aiManager.update().

        // Sync Visuals with AI
        const vPos = vehicleRef.current.position;
        // const vRot = vehicleRef.current.rotation; // Quaternion - Unused for now

        bodyRef.current.position.set(vPos.x, vPos.y, vPos.z);

        // --- Collision Avoidance (Player) ---
        // If too close to player, push back (Hard Collision)
        const pPos = gameRegistry.getPlayerPosition();
        if (pPos) {
            // Manual Distance Check (Yuka Vec3 to Three Vec3)
            const dx = vPos.x - pPos.x;
            const dy = vPos.y - pPos.y; // Should be negligible
            const dz = vPos.z - pPos.z;
            const distSq = dx * dx + dy * dy + dz * dz;

            if (distSq < 9.0) { // 3.0^2 = 9
                // Push enemy back
                const length = Math.sqrt(distSq);
                const pushX = (dx / length) * (10 * delta);
                const pushZ = (dz / length) * (10 * delta);

                vehicleRef.current.position.x += pushX;
                vehicleRef.current.position.z += pushZ;
            }
        }

        // --- Collision Avoidance (Other Enemies) ---
        // Prevent stacking
        const others = gameRegistry.getEnemies();
        for (const other of others) {
            if (other.id !== data.id) {
                const oPos = other.ref.position;
                const dx = vPos.x - oPos.x;
                const dz = vPos.z - oPos.z;
                const distSq = dx * dx + dz * dz;

                if (distSq < 6.25) { // 2.5^2 = 6.25
                    const length = Math.sqrt(distSq);
                    const pushX = (dx / length) * (4 * delta);
                    const pushZ = (dz / length) * (4 * delta);

                    vehicleRef.current.position.x += pushX;
                    vehicleRef.current.position.z += pushZ;
                }
            }
        }

        // Rotate body to face velocity (movement direction)
        const velocity = vehicleRef.current.velocity;
        if (velocity.squaredLength() > 0.1) {
            const targetRotation = Math.atan2(velocity.x, velocity.z);
            bodyRef.current.rotation.y = targetRotation;
        }

        // --- Combat Logic (Aiming) ---
        const playerPos = gameRegistry.getPlayerPosition();
        if (playerPos) {
            const currentPos = bodyRef.current.position;
            const dist = currentPos.distanceTo(playerPos);

            // Head always looks at player
            headRef.current.lookAt(playerPos.x, headRef.current.position.y, playerPos.z);

            // Shoot if close enough
            if (dist < SHOOT_DISTANCE && state.clock.elapsedTime - lastShootTime > SHOOT_COOLDOWN) {
                // Shoot a bit randomized
                const spread = (Math.random() - 0.5) * 0.2;
                // const fireDir = headRef.current.rotation.clone(); // Unused
                // Manual Yuka->Three Euler conversion fix if needed, but lookAt works on Group (Threejs)
                // fireDir is Three.Euler

                // Add Y spread
                const euler = new Euler().copy(headRef.current.rotation);
                euler.y += spread;

                addLaser(
                    headRef.current.position.clone().add(new ThreeVector3(0, 0, 1).applyEuler(headRef.current.rotation)).add(bodyRef.current.position),
                    euler,
                    'enemy'
                );
                setLastShootTime(state.clock.elapsedTime);
            }
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
