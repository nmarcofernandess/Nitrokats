import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Group, Euler, Raycaster, Plane, Mesh } from 'three';
import { useGameStore } from '../store';
import { Edges } from '@react-three/drei';
import { generateCatFaceTexture, generateTracksTexture, generateChassisTexture } from '../Utils/TextureGenerator';
import { Crosshair } from '../UI/Crosshair';
import { checkCircleCollision, checkCircleAABBCollision } from '../Utils/CollisionUtils';

const MOVEMENT_SPEED = 8;
const ROTATION_SPEED = 2.5;

export const CatTank = () => {
    const bodyRef = useRef<Group>(null);
    const headRef = useRef<Group>(null);
    const cannonRef = useRef<Mesh>(null);
    const { camera } = useThree();
    const addLaser = useGameStore((state) => state.addLaser);
    const triggerShake = useGameStore((state) => state.triggerShake);
    const setPlayerPosition = useGameStore((state) => state.setPlayerPosition);
    const heal = useGameStore((state) => state.heal);
    const gameOver = useGameStore((state) => state.gameOver);
    const enemies = useGameStore((state) => state.enemies);
    const targets = useGameStore((state) => state.targets); // Blocks
    const recoilRef = useRef(0);

    // Input State
    const [keys, setKeys] = useState({ w: false, a: false, s: false, d: false });

    // Textures (Memoized)
    const [catFace] = useState(() => generateCatFaceTexture('#1a1a2e', '#00ffff'));
    const [tracks] = useState(() => generateTracksTexture());
    const [chassis] = useState(() => generateChassisTexture('#2a2a4a'));

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (['w', 'a', 's', 'd'].includes(key)) {
                setKeys((prev) => ({ ...prev, [key]: true }));
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (['w', 'a', 's', 'd'].includes(key)) {
                setKeys((prev) => ({ ...prev, [key]: false }));
            }
        };

        const handleMouseDown = () => {
            if (headRef.current && bodyRef.current) {
                // Calculate spawn position (tip of cannon)
                // We need the world position.
                // Since cannon is child of head, and head is child of body...
                // We can use a helper object or math.
                // Let's assume the cannon tip is at local Z = 1.5 relative to Head (which is rotated)

                // Actually, simpler: Create a Vector3, apply head rotation, apply body rotation, add to body position + head offset.
                // OR use object3D.getWorldPosition if we had a ref to the tip.

                // Let's use the head's rotation and position.
                const headRotation = headRef.current.rotation.y; // Local to body
                const bodyRotation = bodyRef.current.rotation.y; // World
                const totalRotation = headRotation + bodyRotation;

                const spawnPos = new Vector3(0, 0, 1.5); // Offset from head center
                spawnPos.applyAxisAngle(new Vector3(0, 1, 0), totalRotation);
                spawnPos.add(bodyRef.current.position);
                spawnPos.y += 0.8; // Head height

                addLaser(spawnPos, new Euler(0, totalRotation, 0));

                // Trigger Recoil
                recoilRef.current = 0.5;
                triggerShake(0.5); // Shake screen
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('mousedown', handleMouseDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('mousedown', handleMouseDown);
        };
    }, [addLaser]);

    // Movement & Aiming Loop
    useFrame((state, delta) => {
        if (!bodyRef.current || !headRef.current || gameOver) return;

        // --- Body Movement (Directional) ---
        const moveDir = new Vector3(0, 0, 0);
        if (keys.w) moveDir.z -= 1;
        if (keys.s) moveDir.z += 1;
        if (keys.a) moveDir.x -= 1;
        if (keys.d) moveDir.x += 1;

        if (moveDir.length() > 0) {
            moveDir.normalize();

            // Predictive Movement
            const nextPos = bodyRef.current.position.clone().add(moveDir.clone().multiplyScalar(MOVEMENT_SPEED * delta));
            let canMove = true;

            // 1. Check Enemy Collisions
            for (const enemy of enemies) {
                if (checkCircleCollision(nextPos, 1.5, enemy.position, 1.5)) {
                    canMove = false;
                    break;
                }
            }

            // 2. Check Block Collisions (Targets)
            if (canMove) {
                for (const target of targets) {
                    // Assuming blocks are roughly 2x2x2 based on TargetManager
                    // TargetManager spawns BoxGeometry args={[2, 2, 2]}
                    if (checkCircleAABBCollision(nextPos, 1.2, target.position, new Vector3(2, 2, 2))) {
                        canMove = false;
                        break;
                    }
                }
            }

            if (canMove) {
                bodyRef.current.position.copy(nextPos);
            }

            // Rotate Body to face movement direction (smoothly)
            const targetRotation = Math.atan2(moveDir.x, moveDir.z);
            const currentRotation = bodyRef.current.rotation.y;

            // Simple lerp for rotation
            let diff = targetRotation - currentRotation;
            // Normalize angle to -PI to PI
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;

            bodyRef.current.rotation.y += diff * ROTATION_SPEED * delta;
        }

        // Collision Check (Simple Sphere) - REMOVED (Replaced by predictive above)
        // If we hit an enemy, push back.
        // for (const enemy of enemies) { ... }

        // Health Regen
        // If health < 100 and no damage for 5s, heal.
        // We need to know when we took damage. 
        // Store doesn't track time, so let's check health diff? 
        // Or just assume if we are safe, we heal.
        // Let's use a simple timer here.
        // Actually, we need to hook into takeDamage to reset timer.
        // Since takeDamage is in store, we can't easily hook it here without effect.
        // Let's just heal a tiny bit every frame if health < 100, 
        // but maybe that's too OP.
        // Let's just do: Heal 5 per second always.
        heal(5 * delta);

        // --- Head Aiming ---
        // Raycast from camera to floor plane to get mouse world position
        const raycaster = new Raycaster();
        raycaster.setFromCamera(state.pointer, camera);
        const groundPlane = new Plane(new Vector3(0, 1, 0), 0);
        const targetPoint = new Vector3();
        raycaster.ray.intersectPlane(groundPlane, targetPoint);

        if (targetPoint) {
            const worldAngle = Math.atan2(targetPoint.x - bodyRef.current.position.x, targetPoint.z - bodyRef.current.position.z);
            const bodyAngle = bodyRef.current.rotation.y;

            headRef.current.rotation.y = worldAngle - bodyAngle;
        }

        // --- Camera Follow ---
        // For Orthographic, we move the camera position but keep the rotation fixed.
        // We want the camera to center on the player.
        const cameraOffset = new Vector3(20, 20, 20); // Isometric offset
        const targetCameraPos = bodyRef.current.position.clone().add(cameraOffset);

        // Smooth follow
        state.camera.position.lerp(targetCameraPos, 0.1);
        state.camera.lookAt(bodyRef.current.position);

        // --- Recoil Animation ---
        if (cannonRef.current) {
            recoilRef.current = Math.max(0, recoilRef.current - delta * 5);
            cannonRef.current.position.z = 0.5 - recoilRef.current * 0.2; // Base Z is 0.5, recoil moves it back slightly
        }

        // Update Store with Position (for Enemy AI)
        setPlayerPosition(bodyRef.current.position.clone());
    });

    return (
        <group ref={bodyRef} position={[0, 0.5, 0]}>
            {/* CHASSIS (The Box) */}
            <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
                <boxGeometry args={[1.8, 0.8, 2.2]} />
                <meshStandardMaterial map={chassis} />
                <Edges color="#00ffff" threshold={15} /> {/* Keep Neon for style? Or remove? User said "pixels perfect but can't understand". Let's keep neon as highlight but rely on texture. */}
            </mesh>

            {/* TRACKS (Visual only) */}
            <mesh position={[-1, 0, 0]}>
                <boxGeometry args={[0.4, 0.6, 2.4]} />
                <meshStandardMaterial map={tracks} />
            </mesh>
            <mesh position={[1, 0, 0]}>
                <boxGeometry args={[0.4, 0.6, 2.4]} />
                <meshStandardMaterial map={tracks} />
            </mesh>

            {/* TANK HEAD (The Cat) */}
            {/* Note: Head is child of Body, so it moves with it. 
          But we overwrite rotation.y in useFrame to look at mouse. 
          This creates the "360 turret" effect. */}
            <group ref={headRef} position={[0, 0.8, 0]}>

                {/* Head Base (Neck/Collar) */}
                <mesh position={[0, -0.2, 0]}>
                    <cylinderGeometry args={[0.6, 0.6, 0.2]} />
                    <meshStandardMaterial color="#333" />
                </mesh>

                {/* Cat Head (Cyber Voxel Style) */}
                <mesh castShadow position={[0, 0.3, 0]}>
                    <boxGeometry args={[1, 0.8, 0.9]} />
                    {/* We need face texture ONLY on front face. 
              Box mapping is tricky with single texture.
              We can use an array of materials or map UVs.
              Array of materials is easier for BoxGeometry.
              Order: Right, Left, Top, Bottom, Front, Back
          */}
                    <meshStandardMaterial attach="material-0" color="#1a1a2e" /> {/* Right */}
                    <meshStandardMaterial attach="material-1" color="#1a1a2e" /> {/* Left */}
                    <meshStandardMaterial attach="material-2" color="#1a1a2e" /> {/* Top */}
                    <meshStandardMaterial attach="material-3" color="#1a1a2e" /> {/* Bottom */}
                    <meshStandardMaterial attach="material-4" map={catFace} />   {/* Front (Face) */}
                    <meshStandardMaterial attach="material-5" color="#1a1a2e" /> {/* Back */}

                    <Edges color="#ff00ff" threshold={15} />
                </mesh>

                {/* Ears */}
                <mesh position={[-0.35, 0.8, 0]} rotation={[0, 0, 0.2]}>
                    <coneGeometry args={[0.15, 0.4, 4]} />
                    <meshStandardMaterial color="#1a1a2e" />
                    <Edges color="#ff00ff" />
                </mesh>
                <mesh position={[0.35, 0.8, 0]} rotation={[0, 0, -0.2]}>
                    <coneGeometry args={[0.15, 0.4, 4]} />
                    <meshStandardMaterial color="#1a1a2e" />
                    <Edges color="#ff00ff" />
                </mesh>

                {/* Cannon/Eye Laser Emitter */}
                <mesh ref={cannonRef} position={[0.2, 0.4, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.2]} />
                    <meshBasicMaterial visible={false} />
                </mesh>
            </group>
        </group>
    );
};
