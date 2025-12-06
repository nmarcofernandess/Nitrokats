import { useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Group, Euler, Raycaster, Plane, Mesh } from 'three';
import { useGameStore } from '../store';
import { Edges } from '@react-three/drei';
import { generateCatFaceTexture, generateTracksTexture, generateChassisTexture } from '../Utils/TextureGenerator';
import { Crosshair } from '../UI/Crosshair';
import { checkCircleCollision, checkCircleAABBCollision } from '../Utils/CollisionUtils';
import { audioManager } from '../Utils/AudioManager';

import { gameRegistry } from '../Utils/ObjectRegistry';
import { aiManager } from '../Utils/AIManager';

const MOVEMENT_SPEED = 8;
const ROTATION_SPEED = 2.5;

export const CatTank = () => {
    const bodyRef = useRef<Group>(null);
    const headRef = useRef<Group>(null);
    const cannonRef = useRef<Mesh>(null);
    const { camera } = useThree();
    const addLaser = useGameStore((state) => state.addLaser);
    const triggerShake = useGameStore((state) => state.triggerShake);

    // Removed setPlayerPosition to avoid store spam
    const health = useGameStore((state) => state.health);
    const heal = useGameStore((state) => state.heal);
    const gameOver = useGameStore((state) => state.gameOver);
    const gameState = useGameStore((state) => state.gameState);
    const togglePause = useGameStore((state) => state.togglePause);
    const isPaused = useGameStore((state) => state.isPaused);

    // Health Regeneration Logic
    useFrame((_, delta) => {
        if (!gameOver && gameState === 'playing' && health < 100) {
            // Regen 2 health per second (slow & steady)
            heal(2 * delta);
        }
    });

    // Register Player
    useEffect(() => {
        if (bodyRef.current) gameRegistry.registerPlayer(bodyRef.current);
    }, []);

    // We don't need enemies/targets from store for collision anymore, we use Registry
    const weaponType = useGameStore((state) => state.weaponType);
    const setWeaponType = useGameStore((state) => state.setWeaponType);
    const recoilRef = useRef(0);
    const lastFireTime = useRef(0);

    // Power-Up Duration Timer
    useEffect(() => {
        if (weaponType !== 'default') {
            const timer = setTimeout(() => {
                setWeaponType('default');
                audioManager.playPowerUp(); // Play sound to indicate end? Or maybe a power down sound. Re-using for now.
            }, 10000); // 10 Seconds
            return () => clearTimeout(timer);
        }
    }, [weaponType, setWeaponType]);

    // Weapon Stats
    const getFireRate = () => 0.2; // Default fire rate for everyone now

    // Input States
    const [keys, setKeys] = useState({ w: false, a: false, s: false, d: false });
    const [mouseDown, setMouseDown] = useState(false);
    const [aimPos, setAimPos] = useState(new Vector3(0, 0, 0));

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
            // ESC to toggle pause
            if (e.key === 'Escape' && gameState === 'playing' || e.key === 'Escape' && isPaused) {
                togglePause();
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (['w', 'a', 's', 'd'].includes(key)) {
                setKeys((prev) => ({ ...prev, [key]: false }));
            }
        };

        const handleMouseDown = () => setMouseDown(true);
        const handleMouseUp = () => setMouseDown(false);

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [gameState, isPaused, togglePause]);

    // Movement & Aiming Loop
    useFrame((state, delta) => {
        if (!bodyRef.current || !headRef.current || gameOver || gameState !== 'playing') return;

        // --- Tank/Car Movement Logic ---
        // W/S = Move Forward/Backward relative to rotation
        // A/D = Rotate Left/Right

        // Rotation
        if (keys.a) bodyRef.current.rotation.y += ROTATION_SPEED * delta;
        if (keys.d) bodyRef.current.rotation.y -= ROTATION_SPEED * delta;

        // Forward/Backward Movement
        let speed = 0;
        if (keys.w) speed = MOVEMENT_SPEED;
        if (keys.s) speed = -MOVEMENT_SPEED;

        if (speed !== 0) {
            const forward = new Vector3(0, 0, 1).applyAxisAngle(new Vector3(0, 1, 0), bodyRef.current.rotation.y);
            // In Three.js, often -Z is forward, but check your model. 
            // In our isometric setup, usually +Z is towards camera, -Z away.
            // Let's assume standard math: 0 rotation = facing +Z? 
            // Let's test standard forward vector application.

            // Correction: applyEuler with 0,0,1 might need checking model orientation.
            // If model faces +Z by default:
            const moveVec = forward.multiplyScalar(speed * delta);

            const nextPos = bodyRef.current.position.clone().add(moveVec);

            let canMove = true;

            // 1. Check Enemy Collisions (Registry)
            const enemies = gameRegistry.getEnemies();
            for (const enemy of enemies) {
                if (checkCircleCollision(nextPos, 1.5, enemy.ref.position, 1.5)) {
                    canMove = false;
                    break;
                }
            }

            // 2. Check Block Collisions (Registry)
            if (canMove) {
                const blocks = gameRegistry.getBlocks();
                for (const target of blocks) {
                    if (checkCircleAABBCollision(nextPos, 1.2, target.ref.position, new Vector3(2, 2, 2))) {
                        canMove = false;
                        break;
                    }
                }
            }

            if (canMove) {
                bodyRef.current.position.copy(nextPos);
            }
        }

        // Sync to AI Manager for Enemy Targeting
        aiManager.updatePlayerPosition(bodyRef.current.position.x, bodyRef.current.position.y, bodyRef.current.position.z);

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
            setAimPos(targetPoint.clone());
            const worldAngle = Math.atan2(targetPoint.x - bodyRef.current.position.x, targetPoint.z - bodyRef.current.position.z);
            const bodyAngle = bodyRef.current.rotation.y;

            headRef.current.rotation.y = worldAngle - bodyAngle;

            // Auto-fire Logic
            if (mouseDown && state.clock.elapsedTime - lastFireTime.current > getFireRate()) {
                const totalRotation = headRef.current.rotation.y + bodyRef.current.rotation.y;

                const fire = (angleOffset = 0) => {
                    const spawnPos = new Vector3(0, 0, 1.5);
                    spawnPos.applyAxisAngle(new Vector3(0, 1, 0), totalRotation + angleOffset);
                    spawnPos.add(bodyRef.current!.position);
                    spawnPos.y += 0.8;
                    addLaser(spawnPos, new Euler(0, totalRotation + angleOffset, 0), 'player');
                };

                fire(0); // Center shot

                if (weaponType === 'spread') {
                    fire(0.2);
                    fire(-0.2);
                }

                // Trigger Recoil
                recoilRef.current = 0.5;
                triggerShake(0.5); // Shake screen
                audioManager.playShoot(); // SFX
                lastFireTime.current = state.clock.elapsedTime;
            }
        }

        // --- Camera Follow (Isometric) ---
        const cameraOffset = new Vector3(20, 25, 20);
        const targetCameraPos = bodyRef.current.position.clone().add(cameraOffset);
        state.camera.position.lerp(targetCameraPos, 0.1);
        state.camera.lookAt(bodyRef.current.position);

        // --- Recoil Animation ---
        if (cannonRef.current) {
            recoilRef.current = Math.max(0, recoilRef.current - delta * 5);
            cannonRef.current.position.z = 0.5 - recoilRef.current * 0.2; // Base Z is 0.5, recoil moves it back slightly
        }

        // Update Store with Position (Removed for Performance)
        // setPlayerPosition(bodyRef.current.position.clone());
    });

    return (
        <>
            <Crosshair position={aimPos} />
            <group ref={bodyRef} position={[0, 0.5, 0]}>
                {/* CHASSIS (The Box) */}
                <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
                    <boxGeometry args={[1.8, 0.8, 2.2]} />
                    <meshStandardMaterial map={chassis} />
                    <Edges color="#00ffff" threshold={15} />

                    {/* TAILLIGHTS (Back of Chassis) */}
                    <group position={[0, 0, -1.1]}>
                        {/* Left Taillight */}
                        <mesh position={[-0.6, 0, 0]}>
                            <boxGeometry args={[0.3, 0.2, 0.1]} />
                            <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={4} toneMapped={false} />
                        </mesh>
                        {/* Removed PointLight for performance */}

                        {/* Right Taillight */}
                        <mesh position={[0.6, 0, 0]}>
                            <boxGeometry args={[0.3, 0.2, 0.1]} />
                            <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={4} toneMapped={false} />
                        </mesh>
                        {/* Removed PointLight for performance */}
                    </group>
                </mesh>

                {/* HEADLIGHTS (Front of Chassis) - Visual Only */}
                <group position={[0, 0.2, 1.1]}>
                    {/* Left Headlight */}
                    <mesh position={[-0.6, 0, 0]}>
                        <boxGeometry args={[0.3, 0.2, 0.1]} />
                        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={5} toneMapped={false} />
                    </mesh>

                    {/* Right Headlight */}
                    <mesh position={[0.6, 0, 0]}>
                        <boxGeometry args={[0.3, 0.2, 0.1]} />
                        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={5} toneMapped={false} />
                    </mesh>
                </group>

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
        </>
    );
};
