import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { Edges } from '@react-three/drei';
import { Vehicle, ArriveBehavior } from 'yuka';
import { useGameStore } from '../store';
import { aiManager } from '../Utils/AIManager';
import { generateCatFaceTexture } from '../Utils/TextureGenerator';
import { gameRegistry } from '../Utils/ObjectRegistry';
import { audioManager } from '../Utils/AudioManager';
import { GameBalance } from '../Utils/GameBalance';

const RAT_SPEED = 6.0; // Slightly faster than zombies? Or same.
const EXPLOSION_RANGE = 2.0;

export const ZombieRat = ({ data }: { data: { id: string, position: any, rotation: number } }) => {
    const bodyRef = useRef<Group>(null);
    const headRef = useRef<Group>(null);
    const vehicleRef = useRef<Vehicle>(null);

    const takeDamage = useGameStore((state) => state.takeDamage);
    const removeEnemy = useGameStore((state) => state.removeEnemy);
    const addParticle = useGameStore((state) => state.addParticle);
    const isPaused = useGameStore((state) => state.isPaused);
    const wave = useGameStore((state) => state.wave);

    // Textures
    // const [face] = useState(() => generateCatFaceTexture('#4a4a4a', '#ff0000')); // Unused currently

    // Initialize Yuka Vehicle
    useEffect(() => {
        const vehicle = new Vehicle();
        vehicle.position.set(data.position.x, data.position.y, data.position.z);
        vehicle.maxSpeed = RAT_SPEED;
        vehicle.mass = 0.8; // Smaller mass

        // Pursuit
        const arriveBehavior = new ArriveBehavior(aiManager.getPlayerEntity().position, 0.5, 0.5);
        vehicle.steering.add(arriveBehavior);

        aiManager.registerEnemy(vehicle);
        vehicleRef.current = vehicle;

        return () => {
            aiManager.unregisterEnemy(vehicle);
        };
    }, []);

    // Registration
    useEffect(() => {
        if (bodyRef.current) gameRegistry.registerEnemy(data.id, bodyRef.current);
        return () => gameRegistry.unregisterEnemy(data.id);
    }, [data.id]);

    const legMod = useRef(0);
    const tailMod = useRef(0);

    useFrame((state, _) => {
        if (!bodyRef.current || !vehicleRef.current || isPaused) return;

        // Sync Visuals
        const vPos = vehicleRef.current.position;
        bodyRef.current.position.set(vPos.x, vPos.y, vPos.z);

        // Anti-Stacking (Simple Repulsion)
        const others = gameRegistry.getEnemies();
        for (const other of others) {
            if (other.id !== data.id) {
                const dx = vPos.x - other.ref.position.x;
                const dz = vPos.z - other.ref.position.z;
                const distSq = dx * dx + dz * dz;

                if (distSq < 1.5) { // Smaller collision radius
                    const length = Math.sqrt(distSq);
                    const force = 5 * 0.016;
                    if (length > 0.001) {
                        vehicleRef.current.position.x += (dx / length) * force;
                        vehicleRef.current.position.z += (dz / length) * force;
                    }
                }
            }
        }

        // Rotate to velocity
        const velocity = vehicleRef.current.velocity;
        if (velocity.squaredLength() > 0.1) {
            bodyRef.current.rotation.y = Math.atan2(velocity.x, velocity.z);
        }

        // KAMIKAZE LOGIC
        const playerPos = gameRegistry.getPlayerPosition();
        if (playerPos) {
            headRef.current?.lookAt(playerPos.x, headRef.current.position.y, playerPos.z);

            const dist = bodyRef.current.position.distanceTo(playerPos);
            if (dist < EXPLOSION_RANGE) {
                const damage = GameBalance.getDamageForWave(wave);
                takeDamage(damage);
                addParticle(bodyRef.current.position.clone(), '#ff00ff', 30); // Purple/Toxic Explosion for Rats
                audioManager.playExplosion();
                removeEnemy(data.id);
            }
        }

        // Animation
        legMod.current = state.clock.elapsedTime * 20; // Faster legs
        tailMod.current = Math.sin(state.clock.elapsedTime * 15);
        bodyRef.current.position.y = 0.3 + Math.abs(Math.sin(legMod.current)) * 0.05; // Lower to ground
    });

    return (
        <group ref={bodyRef} position={data.position} rotation={[0, data.rotation, 0]}>
            {/* --- ZOMBIE RAT MODEL --- */}

            {/* MAIN BODY (Lower and Longer) */}
            <mesh castShadow receiveShadow position={[0, 0.3, -0.1]}>
                <boxGeometry args={[0.7, 0.5, 1.4]} />
                <meshStandardMaterial color="#4a4a4a" /> {/* Dark Grey Fur */}
                <Edges color="#222" threshold={15} />
            </mesh>

            {/* LEGS (Small and fast) */}
            <group position={[-0.35, 0.2, 0.4]} rotation={[Math.sin(legMod.current), 0, 0]}>
                <mesh position={[0, -0.2, 0]}><boxGeometry args={[0.15, 0.4, 0.15]} /><meshStandardMaterial color="#333" /></mesh>
            </group>
            <group position={[0.35, 0.2, 0.4]} rotation={[Math.sin(legMod.current + Math.PI), 0, 0]}>
                <mesh position={[0, -0.2, 0]}><boxGeometry args={[0.15, 0.4, 0.15]} /><meshStandardMaterial color="#333" /></mesh>
            </group>
            <group position={[-0.35, 0.2, -0.6]} rotation={[Math.sin(legMod.current + Math.PI), 0, 0]}>
                <mesh position={[0, -0.2, 0]}><boxGeometry args={[0.15, 0.4, 0.15]} /><meshStandardMaterial color="#333" /></mesh>
            </group>
            <group position={[0.35, 0.2, -0.6]} rotation={[Math.sin(legMod.current), 0, 0]}>
                <mesh position={[0, -0.2, 0]}><boxGeometry args={[0.15, 0.4, 0.15]} /><meshStandardMaterial color="#333" /></mesh>
            </group>

            {/* TAIL (Long, Pink, Animated) */}
            <group position={[0, 0.4, -0.8]} rotation={[-0.2, tailMod.current * 0.5, 0]}>
                <mesh position={[0, 0, -0.6]}>
                    <boxGeometry args={[0.1, 0.1, 1.2]} />
                    <meshStandardMaterial color="#ffaaaa" /> {/* Pink Tail */}
                </mesh>
            </group>

            {/* HEAD (Pointy) */}
            <group ref={headRef} position={[0, 0.6, 0.6]}>
                <mesh castShadow position={[0, 0, 0.2]}>
                    {/* Elongated Snout */}
                    <boxGeometry args={[0.5, 0.5, 0.8]} />
                    <meshStandardMaterial color="#4a4a4a" />
                    <Edges color="#ff0000" threshold={15} />
                </mesh>

                {/* Eyes (Glowing Red) */}
                <mesh position={[-0.15, 0.1, 0.6]}>
                    <boxGeometry args={[0.1, 0.1, 0.05]} />
                    <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
                </mesh>
                <mesh position={[0.15, 0.1, 0.6]}>
                    <boxGeometry args={[0.1, 0.1, 0.05]} />
                    <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
                </mesh>

                {/* Ears (Round) */}
                <mesh position={[-0.2, 0.3, -0.1]} rotation={[Math.PI / 2, 0, 0.2]}><cylinderGeometry args={[0.15, 0.15, 0.05]} /><meshStandardMaterial color="#ffaaaa" /></mesh>
                <mesh position={[0.2, 0.3, -0.1]} rotation={[Math.PI / 2, 0, -0.2]}><cylinderGeometry args={[0.15, 0.15, 0.05]} /><meshStandardMaterial color="#ffaaaa" /></mesh>
            </group>
        </group>
    );
};
