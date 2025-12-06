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
    // const triggerShake = useGameStore((state) => state.triggerShake);

    // Removed setPlayerPosition to avoid store spam
    const health = useGameStore((state) => state.health);
    const heal = useGameStore((state) => state.heal);
    const gameOver = useGameStore((state) => state.gameOver);
    const gameState = useGameStore((state) => state.gameState);
    const togglePause = useGameStore((state) => state.togglePause);
    const isPaused = useGameStore((state) => state.isPaused);
    const gameMode = useGameStore((state) => state.gameMode);

    // Animation Ref for Bipedal Legs
    const leftLegRef = useRef<Mesh>(null);
    const rightLegRef = useRef<Mesh>(null);

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
    const decrementAmmo = useGameStore((state) => state.decrementAmmo);
    const recoilRef = useRef(0);
    const lastFireTime = useRef(0);

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

        // --- MOVEMENT LOGIC (Split by Mode) ---

        let moveVec = new Vector3();

        if (gameMode === 'zombie') {
            // --- ZOMBIE MODE: TWIN STICK SHOOTER / FPS ---
            // 1. ROTATE BODY TO MOUSE
            // We need the mouse aim point first. 
            // Raycast logic is currently below, let's hoist it up or reuse it.
            // We'll duplicate the raycast quickly here for responsiveness (or restructure).
            const raycaster = new Raycaster();
            raycaster.setFromCamera(state.pointer, camera);
            const groundPlane = new Plane(new Vector3(0, 1, 0), 0);
            const targetPoint = new Vector3();
            raycaster.ray.intersectPlane(groundPlane, targetPoint);

            if (targetPoint) {
                // Instant Face Mouse
                const angle = Math.atan2(targetPoint.x - bodyRef.current.position.x, targetPoint.z - bodyRef.current.position.z);
                bodyRef.current.rotation.y = angle;
            }

            // 2. MOVE (WASD Relative to Looking Direction, i.e., Strafe)
            let forwardSpeed = 0;
            let sideSpeed = 0;
            if (keys.w) forwardSpeed = MOVEMENT_SPEED;
            if (keys.s) forwardSpeed = -MOVEMENT_SPEED;
            if (keys.a) sideSpeed = MOVEMENT_SPEED; // Left is positive X in local? Let's check.
            if (keys.d) sideSpeed = -MOVEMENT_SPEED;

            // Calculate Move Vector
            const rotation = bodyRef.current.rotation.y;
            const forward = new Vector3(0, 0, 1).applyAxisAngle(new Vector3(0, 1, 0), rotation);
            const right = new Vector3(1, 0, 0).applyAxisAngle(new Vector3(0, 1, 0), rotation);

            moveVec.add(forward.multiplyScalar(forwardSpeed * delta));
            moveVec.add(right.multiplyScalar(sideSpeed * delta));

        } else {
            // --- CLASSIC MODE: TANK CONTROLS ---
            // Rotation
            if (keys.a) bodyRef.current.rotation.y += ROTATION_SPEED * delta;
            if (keys.d) bodyRef.current.rotation.y -= ROTATION_SPEED * delta;

            // Forward/Backward Movement
            let speed = 0;
            if (keys.w) speed = MOVEMENT_SPEED;
            if (keys.s) speed = -MOVEMENT_SPEED;

            if (speed !== 0) {
                const forward = new Vector3(0, 0, 1).applyAxisAngle(new Vector3(0, 1, 0), bodyRef.current.rotation.y);
                moveVec = forward.multiplyScalar(speed * delta);
            }
        }

        // --- APPLY MOVEMENT ---
        if (moveVec.lengthSq() > 0) {
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
                // Apply Arena Boundaries (Arena Size 60, so -30 to 30. Tank radius approx 1.5. Clamp to -28 to 28)
                const BOUNDARY = 28;
                nextPos.x = Math.max(-BOUNDARY, Math.min(BOUNDARY, nextPos.x));
                nextPos.z = Math.max(-BOUNDARY, Math.min(BOUNDARY, nextPos.z));

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
        // heal(5 * delta); // REMOVED DEBUG HEAL

        // --- Head Aiming ---
        // Raycast from camera to floor plane to get mouse world position
        const raycaster = new Raycaster();
        raycaster.setFromCamera(state.pointer, camera);
        const groundPlane = new Plane(new Vector3(0, 1, 0), 0);
        const targetPoint = new Vector3();
        raycaster.ray.intersectPlane(groundPlane, targetPoint);

        if (targetPoint) {
            setAimPos(targetPoint.clone());
            // If Zombie, the whole body already faces mouse. Head should just be 0 relative.
            // If Classic, Body can be independent, Head must aim at mouse.

            if (gameMode === 'classic') {
                const worldAngle = Math.atan2(targetPoint.x - bodyRef.current.position.x, targetPoint.z - bodyRef.current.position.z);
                const bodyAngle = bodyRef.current.rotation.y;
                headRef.current.rotation.y = worldAngle - bodyAngle;
            } else {
                // Zombie: Head fixed forward (Body aims)
                headRef.current.rotation.y = 0;
            }

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
                    decrementAmmo(); // Decrement only if spread active? Or always?
                    // User said: "Every 20 shots, the weapon ends."
                    // If spread counts as 1 "shot action", then decrement once.
                }

                // Trigger Recoil
                recoilRef.current = 0.5;
                // triggerShake(0.5); // REMOVED Screen Shake for performance
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

        // --- Bipedal Animation (Zombie Mode Only) ---
        if (gameMode === 'zombie' && leftLegRef.current && rightLegRef.current) {
            const isMoving = keys.w || keys.s || keys.a || keys.d;
            if (isMoving) {
                const time = state.clock.elapsedTime * 15;
                leftLegRef.current.rotation.x = Math.sin(time) * 0.5;
                rightLegRef.current.rotation.x = Math.sin(time + Math.PI) * 0.5;
            } else {
                leftLegRef.current.rotation.x = 0;
                rightLegRef.current.rotation.x = 0;
            }
        }
    });

    return (
        <>
            <Crosshair position={aimPos} />

            <group ref={bodyRef} position={[0, gameMode === 'zombie' ? 1.0 : 0.5, 0]}>

                {/* --- CLASSIC TANK MODE (ARTILLERY CAT) --- */}
                {gameMode === 'classic' && (
                    <group>
                        {/* --- CHASSIS GROUP --- */}
                        <group position={[0, 0.3, 0]}>
                            {/* CENTRAL HULL (Sloped Armor) */}
                            <mesh castShadow receiveShadow position={[0, 0.2, 0]}>
                                <boxGeometry args={[1.0, 0.6, 2.4]} />
                                <meshStandardMaterial map={chassis} color="#aabbcc" />
                                <Edges color="#00ffff" threshold={15} />
                            </mesh>
                            {/* Front Armor Plate */}
                            <mesh position={[0, 0.1, 1.3]} rotation={[0.4, 0, 0]}>
                                <boxGeometry args={[0.9, 0.4, 0.5]} />
                                <meshStandardMaterial map={chassis} />
                                <Edges color="#00ffff" />
                            </mesh>
                            {/* Rear Engine Block */}
                            <mesh position={[0, 0.3, -1.0]}>
                                <boxGeometry args={[1.2, 0.5, 0.8]} />
                                <meshStandardMaterial color="#111" />
                                {/* Vents */}
                                <meshStandardMaterial emissive="#ff0000" emissiveIntensity={0.2} />
                            </mesh>

                            {/* --- LEFT TRACK HOUSING --- */}
                            <group position={[-0.9, -0.1, 0]}>
                                {/* Track Cover */}
                                <mesh castShadow>
                                    <boxGeometry args={[0.6, 0.6, 2.6]} />
                                    <meshStandardMaterial map={chassis} color="#555" />
                                    <Edges color="#333" />
                                </mesh>
                                {/* The Track Tread (Visual) */}
                                <mesh position={[0, -0.35, 0]}>
                                    <boxGeometry args={[0.5, 0.2, 2.5]} />
                                    <meshStandardMaterial map={tracks} />
                                </mesh>
                                {/* Neon Strip */}
                                <mesh position={[-0.31, 0, 0]}>
                                    <planeGeometry args={[0.6, 2.0]} />
                                    <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} side={2} />
                                </mesh>
                            </group>

                            {/* --- RIGHT TRACK HOUSING --- */}
                            <group position={[0.9, -0.1, 0]}>
                                {/* Track Cover */}
                                <mesh castShadow>
                                    <boxGeometry args={[0.6, 0.6, 2.6]} />
                                    <meshStandardMaterial map={chassis} color="#555" />
                                    <Edges color="#333" />
                                </mesh>
                                {/* The Track Tread (Visual) */}
                                <mesh position={[0, -0.35, 0]}>
                                    <boxGeometry args={[0.5, 0.2, 2.5]} />
                                    <meshStandardMaterial map={tracks} />
                                </mesh>
                                {/* Neon Strip */}
                                <mesh position={[0.31, 0, 0]}>
                                    <planeGeometry args={[0.6, 2.0]} />
                                    <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} side={2} />
                                </mesh>
                            </group>

                            {/* --- LIGHTS --- */}
                            {/* Headlights */}
                            <mesh position={[-0.6, 0.2, 1.35]}>
                                <boxGeometry args={[0.2, 0.1, 0.1]} />
                                <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={5} />
                            </mesh>
                            <mesh position={[0.6, 0.2, 1.35]}>
                                <boxGeometry args={[0.2, 0.1, 0.1]} />
                                <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={5} />
                            </mesh>

                            {/* Taillights */}
                            <mesh position={[-0.6, 0.2, -1.35]}>
                                <boxGeometry args={[0.2, 0.1, 0.1]} />
                                <meshStandardMaterial color="#f00" emissive="#f00" emissiveIntensity={3} />
                            </mesh>
                            <mesh position={[0.6, 0.2, -1.35]}>
                                <boxGeometry args={[0.2, 0.1, 0.1]} />
                                <meshStandardMaterial color="#f00" emissive="#f00" emissiveIntensity={3} />
                            </mesh>
                        </group>
                    </group>
                )}

                {/* --- ZOMBIE SOLDIER MODE --- */}
                {gameMode === 'zombie' && (
                    <group>
                        {/* LEGS */}
                        <group position={[0, -0.8, 0]}>
                            <mesh ref={leftLegRef} position={[-0.3, 0, 0]}>
                                <boxGeometry args={[0.3, 0.8, 0.3]} />
                                <meshStandardMaterial color="#333" />
                            </mesh>
                            <mesh ref={rightLegRef} position={[0.3, 0, 0]}>
                                <boxGeometry args={[0.3, 0.8, 0.3]} />
                                <meshStandardMaterial color="#333" />
                            </mesh>
                        </group>

                        {/* TORSO */}
                        <mesh position={[0, 0, 0]}>
                            <boxGeometry args={[0.8, 0.9, 0.5]} />
                            <meshStandardMaterial color="#222" />
                            {/* Armor Plate */}
                            <mesh position={[0, 0.1, 0.26]}>
                                <boxGeometry args={[0.6, 0.6, 0.1]} />
                                <meshStandardMaterial color="#444" />
                            </mesh>
                        </mesh>

                        {/* ARMS holding GUN (Two hands) */}
                        <group position={[0, 0.3, 0.4]}>
                            {/* Right Arm (Reaching forward) */}
                            <mesh position={[0.4, 0, 0]} rotation={[1.2, -0.2, 0]}>
                                <boxGeometry args={[0.15, 0.5, 0.15]} />
                                <meshStandardMaterial color="#333" />
                            </mesh>
                            {/* Left Arm (Reaching forward) */}
                            <mesh position={[-0.4, 0, 0]} rotation={[1.2, 0.2, 0]}>
                                <boxGeometry args={[0.15, 0.5, 0.15]} />
                                <meshStandardMaterial color="#333" />
                            </mesh>

                            {/* BIG GUN (Held by hands) */}
                            <group position={[0, 0, 0.5]} rotation={[0, 0, 0]}>
                                {/* Main Body */}
                                <mesh position={[0, 0, 0]}>
                                    <boxGeometry args={[0.3, 0.3, 1.0]} />
                                    <meshStandardMaterial color="#222" />
                                </mesh>
                                {/* Barrels */}
                                <mesh position={[0.08, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
                                    <cylinderGeometry args={[0.05, 0.05, 0.5]} />
                                    <meshStandardMaterial color="#555" />
                                </mesh>
                                <mesh position={[-0.08, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
                                    <cylinderGeometry args={[0.05, 0.05, 0.5]} />
                                    <meshStandardMaterial color="#555" />
                                </mesh>
                                {/* Ammo Box */}
                                <mesh position={[0.2, 0, -0.2]}>
                                    <boxGeometry args={[0.2, 0.4, 0.4]} />
                                    <meshStandardMaterial color="#004400" />
                                </mesh>
                            </group>
                        </group>
                    </group>
                )}

                {/* TANK HEAD / SOLDIER HEAD */}
                {/* Visuals adjusted based on mode */}
                <group ref={headRef} position={[0, gameMode === 'zombie' ? 0.7 : 0.8, 0]}>

                    {gameMode === 'classic' ? (
                        // CLASSIC TANK TURRET (ARTILLERY UPGRADE)
                        <group>
                            {/* Head Base / Turret Ring - Lowered to connect with new low body */}
                            <mesh position={[0, -0.3, 0]}>
                                <cylinderGeometry args={[0.7, 0.8, 0.4]} />
                                <meshStandardMaterial color="#1a1a2e" />
                                <Edges color="#00ffff" threshold={20} />
                            </mesh>

                            {/* Main Turret Housing */}
                            <mesh castShadow position={[0, 0.2, -0.1]}>
                                <boxGeometry args={[1.1, 0.7, 1.2]} />
                                <meshStandardMaterial attach="material-0" color="#222" />
                                <meshStandardMaterial attach="material-1" color="#222" />
                                <meshStandardMaterial attach="material-2" color="#222" />
                                <meshStandardMaterial attach="material-3" color="#222" />
                                <meshStandardMaterial attach="material-4" map={catFace} />
                                <meshStandardMaterial attach="material-5" color="#222" />
                                <Edges color="#ff00ff" threshold={15} />
                            </mesh>

                            {/* Artillery Sights / Ears */}
                            <mesh position={[-0.6, 0.1, 0.2]} rotation={[0, 0, 0]}>
                                <boxGeometry args={[0.2, 0.4, 0.6]} />
                                <meshStandardMaterial color="#333" />
                                <mesh position={[0, 0, 0.31]}>
                                    <planeGeometry args={[0.15, 0.3]} />
                                    <meshStandardMaterial color="#00ff00" emissive="#00ff00" />
                                </mesh>
                            </mesh>
                            <mesh position={[0.6, 0.1, 0.2]} rotation={[0, 0, 0]}>
                                <boxGeometry args={[0.2, 0.4, 0.6]} />
                                <meshStandardMaterial color="#333" />
                            </mesh>

                            {/* Radar Dish on top */}
                            <group position={[0.4, 0.7, -0.4]} rotation={[0.2, 0.4, 0]}>
                                <mesh>
                                    <cylinderGeometry args={[0.3, 0.05, 0.1]} />
                                    <meshStandardMaterial color="#444" />
                                </mesh>
                                <mesh position={[0, 0.05, 0]} rotation={[0, 0, 0]}>
                                    <cylinderGeometry args={[0.02, 0.02, 0.4]} />
                                    <meshStandardMaterial color="#888" />
                                </mesh>
                            </group>
                        </group>
                    ) : (
                        // ZOMBIE MODE HEAD ONLY (Gun is on body now)
                        <group>
                            {/* Smaller Head for Soldier */}
                            <mesh castShadow position={[0, 0, 0]}>
                                <boxGeometry args={[0.6, 0.5, 0.5]} />
                                <meshStandardMaterial attach="material-0" color="#1a1a2e" />
                                <meshStandardMaterial attach="material-1" color="#1a1a2e" />
                                <meshStandardMaterial attach="material-2" color="#1a1a2e" />
                                <meshStandardMaterial attach="material-3" color="#1a1a2e" />
                                <meshStandardMaterial attach="material-4" map={catFace} />
                                <meshStandardMaterial attach="material-5" color="#1a1a2e" />
                            </mesh>
                            {/* Ears */}
                            <mesh position={[-0.2, 0.3, 0]} rotation={[0, 0, 0.2]}>
                                <coneGeometry args={[0.1, 0.2, 4]} />
                                <meshStandardMaterial color="#1a1a2e" />
                            </mesh>
                            <mesh position={[0.2, 0.3, 0]} rotation={[0, 0, -0.2]}>
                                <coneGeometry args={[0.1, 0.2, 4]} />
                                <meshStandardMaterial color="#1a1a2e" />
                            </mesh>
                        </group>
                    )}

                    {/* Cannon Anchor (Invisible) */}
                    {/* In Zombie Mode, Gun is on body. But body rotates to mouse. So firing straight from body works? 
                        The rotation logic ensures Body Y = Mouse Angle.
                        So pure (0,0,1) + Body Pos should be correct.
                        However, useFrame logic adds laser based on head rotation + body rotation.
                        If Head Rotation is 0 (as set above), then it uses Body Rotation.
                        So it should work perfectly.
                        Position adjustment:
                    */}
                    <mesh
                        ref={cannonRef}
                        position={gameMode === 'zombie' ? [0, -0.4, 1.2] : [0.2, 0.4, 0.5]}
                        rotation={[Math.PI / 2, 0, 0]}
                    >
                        <cylinderGeometry args={[0.02, 0.02, 0.2]} />
                        <meshBasicMaterial visible={false} />
                    </mesh>
                </group>
            </group>
        </>
    );
};
