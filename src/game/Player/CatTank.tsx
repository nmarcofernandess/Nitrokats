import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Group, Euler, Raycaster, Plane, Mesh } from 'three';
import { useGameStore } from '../store';
import { Edges } from '@react-three/drei';

const MOVEMENT_SPEED = 5;
const ROTATION_SPEED = 3;

export const CatTank = () => {
    const bodyRef = useRef<Group>(null);
    const headRef = useRef<Group>(null);
    const cannonRef = useRef<Mesh>(null);
    const { camera } = useThree();
    const addLaser = useGameStore((state) => state.addLaser);
    const triggerShake = useGameStore((state) => state.triggerShake);
    const recoilRef = useRef(0);

    // Input State
    const [keys, setKeys] = useState({ w: false, a: false, s: false, d: false });

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
        if (!bodyRef.current || !headRef.current) return;

        // --- Body Movement ---
        const moveDir = new Vector3(0, 0, 0);
        if (keys.w) moveDir.z -= 1;
        if (keys.s) moveDir.z += 1;
        if (keys.a) moveDir.x -= 1;
        if (keys.d) moveDir.x += 1;

        if (moveDir.length() > 0) {
            moveDir.normalize();

            // Move
            bodyRef.current.position.add(moveDir.multiplyScalar(MOVEMENT_SPEED * delta));

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
            cannonRef.current.position.z = 1 - recoilRef.current; // Base Z is 1, recoil moves it back
        }
    });

    return (
        <group ref={bodyRef} position={[0, 0.5, 0]}>
            {/* TANK BODY - NEON VOXEL STYLE */}
            <mesh castShadow receiveShadow>
                <boxGeometry args={[1.5, 1, 2]} />
                <meshStandardMaterial color="#111" />
                <Edges color="#ff00ff" threshold={15} />
            </mesh>

            {/* TANK HEAD (Turret) */}
            <group ref={headRef} position={[0, 0.8, 0]}>
                {/* Head Shape */}
                <mesh castShadow>
                    <boxGeometry args={[1, 0.8, 1]} />
                    <meshStandardMaterial color="#111" />
                    <Edges color="#00ffff" threshold={15} />
                </mesh>

                {/* Cat Ears */}
                <mesh position={[-0.3, 0.5, 0]} rotation={[0, 0, 0.2]}>
                    <coneGeometry args={[0.2, 0.4, 4]} />
                    <meshStandardMaterial color="#111" />
                    <Edges color="#00ffff" threshold={15} />
                </mesh>
                <mesh position={[0.3, 0.5, 0]} rotation={[0, 0, -0.2]}>
                    <coneGeometry args={[0.2, 0.4, 4]} />
                    <meshStandardMaterial color="#111" />
                    <Edges color="#00ffff" threshold={15} />
                </mesh>

                {/* Cannon */}
                <mesh ref={cannonRef} position={[0, 0, 1]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.1, 0.1, 1.5]} />
                    <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
                </mesh>
            </group>
        </group>
    );
};
