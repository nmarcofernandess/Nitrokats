import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group, Euler } from 'three';
import { Edges } from '@react-three/drei';
import { Vehicle, ArriveBehavior } from 'yuka';
import { useGameStore } from '../store';
import { aiManager } from '../Utils/AIManager';
import { generateCatFaceTexture, generateTracksTexture, generateChassisTexture } from '../Utils/TextureGenerator';
import { gameRegistry } from '../Utils/ObjectRegistry';

const ENEMY_SPEED = 3;
const SHOOT_DISTANCE = 15;
const SHOOT_COOLDOWN = 2.0;

export const EnemyTank = ({ data }: { data: { id: string, position: any, rotation: number } }) => {
    const bodyRef = useRef<Group>(null);
    const headRef = useRef<Group>(null);
    const vehicleRef = useRef<Vehicle>(null);
    const addLaser = useGameStore((state) => state.addLaser);
    const isPaused = useGameStore((state) => state.isPaused);
    const [lastShootTime, setLastShootTime] = useState(0);

    // Textures
    const [catFace] = useState(() => generateCatFaceTexture('#2e1a1a', '#ffff00')); // Evil Brown/Yellow
    const [tracks] = useState(() => generateTracksTexture());
    const [chassis] = useState(() => generateChassisTexture('#4a2a2a'));

    useEffect(() => {
        const vehicle = new Vehicle();
        vehicle.position.set(data.position.x, data.position.y, data.position.z);
        vehicle.maxSpeed = ENEMY_SPEED;
        vehicle.mass = 1;

        const arriveBehavior = new ArriveBehavior(aiManager.getPlayerEntity().position, 2.5, 0.5);
        vehicle.steering.add(arriveBehavior);

        aiManager.registerEnemy(vehicle);
        vehicleRef.current = vehicle;

        return () => {
            aiManager.unregisterEnemy(vehicle);
        };
    }, []);

    useEffect(() => {
        if (bodyRef.current) gameRegistry.registerEnemy(data.id, bodyRef.current);
        return () => gameRegistry.unregisterEnemy(data.id);
    }, [data.id]);

    useFrame((state, delta) => {
        if (!bodyRef.current || !headRef.current || !vehicleRef.current || isPaused) return;

        // Sync Visuals
        const vPos = vehicleRef.current.position;
        bodyRef.current.position.set(vPos.x, vPos.y, vPos.z);

        // Simple manual separation
        const others = gameRegistry.getEnemies();
        for (const other of others) {
            if (other.id !== data.id) {
                const dx = vPos.x - other.ref.position.x;
                const dz = vPos.z - other.ref.position.z;
                const distSq = dx * dx + dz * dz;

                if (distSq < 4) {
                    const length = Math.sqrt(distSq);
                    const force = 4 * delta;
                    if (length > 0.001) {
                        vehicleRef.current.position.x += (dx / length) * force;
                        vehicleRef.current.position.z += (dz / length) * force;
                    }
                }
            }
        }

        const velocity = vehicleRef.current.velocity;
        if (velocity.squaredLength() > 0.1) {
            bodyRef.current.rotation.y = Math.atan2(velocity.x, velocity.z);
        }

        // Combat
        const playerPos = gameRegistry.getPlayerPosition();
        if (playerPos) {
            headRef.current.lookAt(playerPos.x, headRef.current.position.y, playerPos.z);
            const dist = bodyRef.current.position.distanceTo(playerPos);

            if (dist < SHOOT_DISTANCE && state.clock.elapsedTime - lastShootTime > SHOOT_COOLDOWN) {
                const euler = new Euler().copy(headRef.current.rotation);
                euler.y += (Math.random() - 0.5) * 0.2; // Spread
                addLaser(
                    headRef.current.position.clone().add(new Vector3(0, 0, 1).applyEuler(headRef.current.rotation)).add(bodyRef.current.position),
                    euler,
                    'enemy'
                );
                setLastShootTime(state.clock.elapsedTime);
            }
        }
    });

    return (
        <group ref={bodyRef} position={data.position} rotation={[0, data.rotation, 0]}>
            {/* CHASSIS */}
            <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
                <boxGeometry args={[1.8, 0.8, 2.2]} />
                <meshStandardMaterial map={chassis} />
                <Edges color="#ff0000" threshold={15} />
            </mesh>
            <mesh position={[-1, 0, 0]}><boxGeometry args={[0.4, 0.6, 2.4]} /><meshStandardMaterial map={tracks} /></mesh>
            <mesh position={[1, 0, 0]}><boxGeometry args={[0.4, 0.6, 2.4]} /><meshStandardMaterial map={tracks} /></mesh>

            {/* HEAD */}
            <group ref={headRef} position={[0, 0.8, 0]}>
                <mesh castShadow position={[0, 0.3, 0]}>
                    <boxGeometry args={[1, 0.8, 0.9]} />
                    <meshStandardMaterial map={catFace} />
                    <Edges color="#ff0000" threshold={15} />
                </mesh>
                <mesh position={[-0.35, 0.8, 0]} rotation={[0, 0, 0.2]}><coneGeometry args={[0.15, 0.4, 4]} /><meshStandardMaterial color="#2e1a1a" /></mesh>
                <mesh position={[0.35, 0.8, 0]} rotation={[0, 0, -0.2]}><coneGeometry args={[0.15, 0.4, 4]} /><meshStandardMaterial color="#2e1a1a" /></mesh>
            </group>
        </group>
    );
};
