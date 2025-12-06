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

const ZOMBIE_SPEED = 5.0; // Fast
const EXPLOSION_RANGE = 2.0;
// const EXPLOSION_DAMAGE = 20; // Replaced by GameBalance

export const ZombieCat = ({ data }: { data: { id: string, position: any, rotation: number } }) => {
    const bodyRef = useRef<Group>(null);
    const headRef = useRef<Group>(null);
    const vehicleRef = useRef<Vehicle>(null);

    const takeDamage = useGameStore((state) => state.takeDamage);
    const removeEnemy = useGameStore((state) => state.removeEnemy);
    const addParticle = useGameStore((state) => state.addParticle);
    const isPaused = useGameStore((state) => state.isPaused);
    const wave = useGameStore((state) => state.wave); // Need wave for damage calc

    // Textures
    const [catFace] = useState(() => generateCatFaceTexture('#2b4a2b', '#ff0000')); // Green/Red

    // Initialize Yuka Vehicle
    useEffect(() => {
        const vehicle = new Vehicle();
        vehicle.position.set(data.position.x, data.position.y, data.position.z);
        vehicle.maxSpeed = ZOMBIE_SPEED;
        vehicle.mass = 1;

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
                // Convert Yuka vec to Three vec for distance check?
                // Actually Yuka Vector3 DOES have distanceToSquared. 
                // But wait, my linter says "Property ... does not exist". 
                // Maybe my Yuka d.ts is incomplete or I am importing THREE Vector3 as just 'Vector3' which shadows Yuka?
                // In imports: "import { Vector3, Group, Euler } from 'three';"
                // Ah, `vehicleRef.current` is Yuka.Vehicle. `vehicleRef.current.position` is Yuka.Vector3.
                // But I have imported THREE.Vector3 as `Vector3`. 
                // Yuka.Vector3 and THREE.Vector3 are different classes.
                // I should treat `vPos` as Yuka Vector3.
                // Logic:
                const dx = vPos.x - other.ref.position.x;
                const dz = vPos.z - other.ref.position.z;
                const distSq = dx * dx + dz * dz;

                if (distSq < 2) {
                    const length = Math.sqrt(distSq);
                    // Push direction normalized: dx/len, dz/len
                    // Scale by push force
                    const force = 5 * 0.016; // Speed * delta
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
                // EXPLODE!
                const damage = GameBalance.getDamageForWave(wave);
                takeDamage(damage);
                addParticle(bodyRef.current.position.clone(), '#00ff00', 30); // Green Slime Explosion
                audioManager.playExplosion();
                removeEnemy(data.id); // Die
            }
        }

        // Animation
        legMod.current = state.clock.elapsedTime * 15;
        tailMod.current = Math.sin(state.clock.elapsedTime * 10);
        bodyRef.current.position.y = 0.5 + Math.abs(Math.sin(legMod.current)) * 0.1;
    });

    return (
        <group ref={bodyRef} position={data.position} rotation={[0, data.rotation, 0]}>
            {/* --- ZOMBIE CAT MODEL --- */}

            {/* MAIN BODY */}
            <mesh castShadow receiveShadow position={[0, 0.4, -0.2]}>
                <boxGeometry args={[1.0, 0.8, 1.8]} />
                <meshStandardMaterial color="#2b4a2b" /> {/* Green Rotten Skin */}
                <Edges color="#1a2e1a" threshold={15} />
            </mesh>

            {/* LEGS */}
            <group position={[-0.4, 0.4, 0.5]} rotation={[Math.sin(legMod.current), 0, 0]}>
                <mesh position={[0, -0.4, 0]}><boxGeometry args={[0.25, 0.8, 0.25]} /><meshStandardMaterial color="#1a2e1a" /></mesh>
            </group>
            <group position={[0.4, 0.4, 0.5]} rotation={[Math.sin(legMod.current + Math.PI), 0, 0]}>
                <mesh position={[0, -0.4, 0]}><boxGeometry args={[0.25, 0.8, 0.25]} /><meshStandardMaterial color="#1a2e1a" /></mesh>
            </group>
            <group position={[-0.4, 0.4, -0.9]} rotation={[Math.sin(legMod.current + Math.PI), 0, 0]}>
                <mesh position={[0, -0.4, 0]}><boxGeometry args={[0.25, 0.8, 0.25]} /><meshStandardMaterial color="#1a2e1a" /></mesh>
            </group>
            <group position={[0.4, 0.4, -0.9]} rotation={[Math.sin(legMod.current), 0, 0]}>
                <mesh position={[0, -0.4, 0]}><boxGeometry args={[0.25, 0.8, 0.25]} /><meshStandardMaterial color="#1a2e1a" /></mesh>
            </group>

            {/* TAIL */}
            <group position={[0, 0.6, -1.1]} rotation={[0, tailMod.current * 0.2, -0.5]}>
                <mesh position={[0, 0.3, -0.3]}><boxGeometry args={[0.15, 0.15, 0.8]} /><meshStandardMaterial color="#2b4a2b" /></mesh>
            </group>

            {/* HEAD */}
            <group ref={headRef} position={[0, 0.8, 0.8]}>
                <mesh castShadow position={[0, 0.3, 0]}>
                    <boxGeometry args={[0.9, 0.7, 0.7]} />
                    <meshStandardMaterial map={catFace} />
                    <Edges color="#ff0000" threshold={15} />
                </mesh>
                <mesh position={[-0.35, 0.8, 0]} rotation={[0, 0, 0.2]}><coneGeometry args={[0.15, 0.4, 4]} /><meshStandardMaterial color="#1a2e1a" /></mesh>
                <mesh position={[0.35, 0.8, 0]} rotation={[0, 0, -0.2]}><coneGeometry args={[0.15, 0.4, 4]} /><meshStandardMaterial color="#1a2e1a" /></mesh>
            </group>
        </group>
    );
};
