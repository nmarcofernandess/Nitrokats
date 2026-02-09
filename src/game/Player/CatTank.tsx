import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import { Euler, Group, Mesh, Plane, Raycaster, Vector3 } from 'three';
import { useGameStore } from '../store';
import { generateCatFaceTexture, generateChassisTexture, generateTracksTexture } from '../Utils/TextureGenerator';
import { Crosshair } from '../UI/Crosshair';
import { checkCircleAABBCollision, checkCircleCollision } from '../Utils/CollisionUtils';
import { audioManager } from '../Utils/AudioManager';
import { gameRegistry } from '../Utils/ObjectRegistry';
import { aiManager } from '../Utils/AIManager';

const MOVEMENT_SPEED = 8;
const ROTATION_SPEED = 2.5;
const BOUNDARY = 28;

export const CatTank = () => {
  const bodyRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const cannonRef = useRef<Mesh>(null);
  const leftLegRef = useRef<Mesh>(null);
  const rightLegRef = useRef<Mesh>(null);

  const keysRef = useRef({ w: false, a: false, s: false, d: false });
  const mouseDownRef = useRef(false);
  const recoilRef = useRef(0);
  const lastFireTimeRef = useRef(0);

  const aimPositionRef = useRef(new Vector3(0, 0, 0));
  const raycasterRef = useRef(new Raycaster());
  const groundPlaneRef = useRef(new Plane(new Vector3(0, 1, 0), 0));
  const targetPointRef = useRef(new Vector3());
  const moveVecRef = useRef(new Vector3());
  const nextPosRef = useRef(new Vector3());
  const forwardRef = useRef(new Vector3());
  const rightRef = useRef(new Vector3());
  const upAxisRef = useRef(new Vector3(0, 1, 0));
  const blockSizeRef = useRef(new Vector3(2, 2, 2));
  const spawnPosRef = useRef(new Vector3());
  const targetCameraPosRef = useRef(new Vector3());
  const cameraOffset = useMemo(() => new Vector3(20, 25, 20), []);

  const { camera } = useThree();

  const addLaser = useGameStore((state) => state.addLaser);
  const heal = useGameStore((state) => state.heal);
  const gameMode = useGameStore((state) => state.gameMode);
  const weaponType = useGameStore((state) => state.weaponType);
  const decrementAmmo = useGameStore((state) => state.decrementAmmo);

  const catFace = useMemo(() => generateCatFaceTexture('#1a1a2e', '#00ffff'), []);
  const tracks = useMemo(() => generateTracksTexture(), []);
  const chassis = useMemo(() => generateChassisTexture('#2a2a4a'), []);

  useEffect(() => {
    if (bodyRef.current) {
      gameRegistry.registerPlayer(bodyRef.current);
    }

    return () => {
      gameRegistry.unregisterPlayer();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
        keysRef.current[key] = true;
      }

      if (event.key === 'Escape') {
        const game = useGameStore.getState();
        if (game.gameState === 'playing' || game.isPaused) {
          game.togglePause();
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
        keysRef.current[key] = false;
      }
    };

    const handleMouseDown = () => {
      mouseDownRef.current = true;
    };

    const handleMouseUp = () => {
      mouseDownRef.current = false;
    };

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
  }, []);

  useFrame((state, delta) => {
    if (!bodyRef.current || !headRef.current) {
      return;
    }

    const game = useGameStore.getState();
    if (game.gameState !== 'playing') {
      return;
    }

    if (game.health < 100) {
      heal(2 * delta);
    }

    const keys = keysRef.current;
    const moveVec = moveVecRef.current.set(0, 0, 0);

    const raycaster = raycasterRef.current;
    const targetPoint = targetPointRef.current;
    raycaster.setFromCamera(state.pointer, camera);
    const hasTargetPoint = raycaster.ray.intersectPlane(groundPlaneRef.current, targetPoint) !== null;

    if (gameMode === 'zombie') {
      if (hasTargetPoint) {
        const angle = Math.atan2(
          targetPoint.x - bodyRef.current.position.x,
          targetPoint.z - bodyRef.current.position.z,
        );
        bodyRef.current.rotation.y = angle;
      }

      let forwardSpeed = 0;
      let sideSpeed = 0;
      if (keys.w) forwardSpeed = MOVEMENT_SPEED;
      if (keys.s) forwardSpeed = -MOVEMENT_SPEED;
      if (keys.a) sideSpeed = MOVEMENT_SPEED;
      if (keys.d) sideSpeed = -MOVEMENT_SPEED;

      const rotation = bodyRef.current.rotation.y;
      const forward = forwardRef.current.set(0, 0, 1).applyAxisAngle(upAxisRef.current, rotation);
      const right = rightRef.current.set(1, 0, 0).applyAxisAngle(upAxisRef.current, rotation);

      moveVec.addScaledVector(forward, forwardSpeed * delta);
      moveVec.addScaledVector(right, sideSpeed * delta);
    } else {
      if (keys.a) bodyRef.current.rotation.y += ROTATION_SPEED * delta;
      if (keys.d) bodyRef.current.rotation.y -= ROTATION_SPEED * delta;

      let speed = 0;
      if (keys.w) speed = MOVEMENT_SPEED;
      if (keys.s) speed = -MOVEMENT_SPEED;

      if (speed !== 0) {
        const forward = forwardRef.current
          .set(0, 0, 1)
          .applyAxisAngle(upAxisRef.current, bodyRef.current.rotation.y);
        moveVec.copy(forward.multiplyScalar(speed * delta));
      }
    }

    if (moveVec.lengthSq() > 0) {
      const nextPos = nextPosRef.current.copy(bodyRef.current.position).add(moveVec);

      let canMove = true;
      const enemies = gameRegistry.getEnemies();
      for (const enemy of enemies) {
        if (checkCircleCollision(nextPos, 1.5, enemy.ref.position, 1.5)) {
          canMove = false;
          break;
        }
      }

      if (canMove) {
        const blocks = gameRegistry.getBlocks();
        for (const block of blocks) {
          if (checkCircleAABBCollision(nextPos, 1.2, block.ref.position, blockSizeRef.current)) {
            canMove = false;
            break;
          }
        }
      }

      if (canMove) {
        nextPos.x = Math.max(-BOUNDARY, Math.min(BOUNDARY, nextPos.x));
        nextPos.z = Math.max(-BOUNDARY, Math.min(BOUNDARY, nextPos.z));
        bodyRef.current.position.copy(nextPos);
      }
    }

    aiManager.updatePlayerPosition(
      bodyRef.current.position.x,
      bodyRef.current.position.y,
      bodyRef.current.position.z,
    );

    if (hasTargetPoint) {
      aimPositionRef.current.copy(targetPoint);

      if (gameMode === 'classic') {
        const worldAngle = Math.atan2(
          targetPoint.x - bodyRef.current.position.x,
          targetPoint.z - bodyRef.current.position.z,
        );
        headRef.current.rotation.y = worldAngle - bodyRef.current.rotation.y;
      } else {
        headRef.current.rotation.y = 0;
      }

      if (mouseDownRef.current && state.clock.elapsedTime - lastFireTimeRef.current > 0.2) {
        const totalRotation = headRef.current.rotation.y + bodyRef.current.rotation.y;

        const fire = (angleOffset = 0) => {
          const spawnPos = spawnPosRef.current.set(0, 0, 1.5);
          spawnPos.applyAxisAngle(upAxisRef.current, totalRotation + angleOffset);
          spawnPos.add(bodyRef.current!.position);
          spawnPos.y += 0.8;
          addLaser(spawnPos, new Euler(0, totalRotation + angleOffset, 0), 'player');
        };

        fire(0);

        if (weaponType === 'spread') {
          fire(0.2);
          fire(-0.2);
          decrementAmmo();
        }

        recoilRef.current = 0.5;
        audioManager.playShoot();
        lastFireTimeRef.current = state.clock.elapsedTime;
      }
    }

    const targetCameraPos = targetCameraPosRef.current
      .copy(bodyRef.current.position)
      .add(cameraOffset);
    state.camera.position.lerp(targetCameraPos, 0.1);
    state.camera.lookAt(bodyRef.current.position);

    if (cannonRef.current) {
      recoilRef.current = Math.max(0, recoilRef.current - delta * 5);
      cannonRef.current.position.z = 0.5 - recoilRef.current * 0.2;
    }

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
      <Crosshair targetRef={aimPositionRef} />

      <group ref={bodyRef} position={[0, gameMode === 'zombie' ? 1.0 : 0.5, 0]}>
        {gameMode === 'classic' && (
          <group>
            <group position={[0, 0.3, 0]}>
              <mesh castShadow receiveShadow position={[0, 0.2, 0]}>
                <boxGeometry args={[1.0, 0.6, 2.4]} />
                <meshStandardMaterial map={chassis} color="#aabbcc" />
                <Edges color="#00ffff" threshold={15} />
              </mesh>

              <mesh position={[0, 0.1, 1.3]} rotation={[0.4, 0, 0]}>
                <boxGeometry args={[0.9, 0.4, 0.5]} />
                <meshStandardMaterial map={chassis} />
                <Edges color="#00ffff" />
              </mesh>

              <mesh position={[0, 0.3, -1.0]}>
                <boxGeometry args={[1.2, 0.5, 0.8]} />
                <meshStandardMaterial color="#111" />
                <meshStandardMaterial emissive="#ff0000" emissiveIntensity={0.2} />
              </mesh>

              <group position={[-0.9, -0.1, 0]}>
                <mesh castShadow>
                  <boxGeometry args={[0.6, 0.6, 2.6]} />
                  <meshStandardMaterial map={chassis} color="#555" />
                  <Edges color="#333" />
                </mesh>
                <mesh position={[0, -0.35, 0]}>
                  <boxGeometry args={[0.5, 0.2, 2.5]} />
                  <meshStandardMaterial map={tracks} />
                </mesh>
                <mesh position={[-0.31, 0, 0]}>
                  <planeGeometry args={[0.6, 2.0]} />
                  <meshStandardMaterial
                    color="#00ffff"
                    emissive="#00ffff"
                    emissiveIntensity={2}
                    side={2}
                  />
                </mesh>
              </group>

              <group position={[0.9, -0.1, 0]}>
                <mesh castShadow>
                  <boxGeometry args={[0.6, 0.6, 2.6]} />
                  <meshStandardMaterial map={chassis} color="#555" />
                  <Edges color="#333" />
                </mesh>
                <mesh position={[0, -0.35, 0]}>
                  <boxGeometry args={[0.5, 0.2, 2.5]} />
                  <meshStandardMaterial map={tracks} />
                </mesh>
                <mesh position={[0.31, 0, 0]}>
                  <planeGeometry args={[0.6, 2.0]} />
                  <meshStandardMaterial
                    color="#00ffff"
                    emissive="#00ffff"
                    emissiveIntensity={2}
                    side={2}
                  />
                </mesh>
              </group>

              <mesh position={[-0.6, 0.2, 1.35]}>
                <boxGeometry args={[0.2, 0.1, 0.1]} />
                <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={5} />
              </mesh>
              <mesh position={[0.6, 0.2, 1.35]}>
                <boxGeometry args={[0.2, 0.1, 0.1]} />
                <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={5} />
              </mesh>

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

        {gameMode === 'zombie' && (
          <group>
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

            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.8, 0.9, 0.5]} />
              <meshStandardMaterial color="#222" />
              <mesh position={[0, 0.1, 0.26]}>
                <boxGeometry args={[0.6, 0.6, 0.1]} />
                <meshStandardMaterial color="#444" />
              </mesh>
            </mesh>

            <group position={[0, 0.3, 0.4]}>
              <mesh position={[0.4, 0, 0]} rotation={[1.2, -0.2, 0]}>
                <boxGeometry args={[0.15, 0.5, 0.15]} />
                <meshStandardMaterial color="#333" />
              </mesh>
              <mesh position={[-0.4, 0, 0]} rotation={[1.2, 0.2, 0]}>
                <boxGeometry args={[0.15, 0.5, 0.15]} />
                <meshStandardMaterial color="#333" />
              </mesh>

              <group position={[0, 0, 0.5]} rotation={[0, 0, 0]}>
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[0.3, 0.3, 1.0]} />
                  <meshStandardMaterial color="#222" />
                </mesh>
                <mesh position={[0.08, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.05, 0.05, 0.5]} />
                  <meshStandardMaterial color="#555" />
                </mesh>
                <mesh position={[-0.08, 0, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.05, 0.05, 0.5]} />
                  <meshStandardMaterial color="#555" />
                </mesh>
                <mesh position={[0.2, 0, -0.2]}>
                  <boxGeometry args={[0.2, 0.4, 0.4]} />
                  <meshStandardMaterial color="#004400" />
                </mesh>
              </group>
            </group>
          </group>
        )}

        <group ref={headRef} position={[0, gameMode === 'zombie' ? 0.7 : 0.8, 0]}>
          {gameMode === 'classic' ? (
            <group>
              <mesh position={[0, -0.3, 0]}>
                <cylinderGeometry args={[0.7, 0.8, 0.4]} />
                <meshStandardMaterial color="#1a1a2e" />
                <Edges color="#00ffff" threshold={20} />
              </mesh>

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
            <group>
              <mesh castShadow position={[0, 0, 0]}>
                <boxGeometry args={[0.6, 0.5, 0.5]} />
                <meshStandardMaterial attach="material-0" color="#1a1a2e" />
                <meshStandardMaterial attach="material-1" color="#1a1a2e" />
                <meshStandardMaterial attach="material-2" color="#1a1a2e" />
                <meshStandardMaterial attach="material-3" color="#1a1a2e" />
                <meshStandardMaterial attach="material-4" map={catFace} />
                <meshStandardMaterial attach="material-5" color="#1a1a2e" />
              </mesh>
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
