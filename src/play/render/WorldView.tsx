import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera as OrthographicCameraView } from '@react-three/drei';
import {
  Color,
  InstancedMesh,
  Object3D,
  OrthographicCamera,
  Plane,
  Raycaster,
  Vector2,
  Vector3,
  type Group,
} from 'three';
import type { GameRuntime } from '../runtime/GameRuntime';
import type { PlayerId, Vec2 } from '../core/model';
import type { MenuCommand } from '../input/bindings';
import { SharedCameraController } from './SharedCamera';

const CAT_COLORS: Record<PlayerId, string> = { p1: '#51d8ed', p2: '#ffb64c' };
const MAX_ENEMIES = 64;
const MAX_PROJECTILES = 256;
const ENEMY_COLORS = {
  brute: new Color('#bd5f5b'), gunner: new Color('#a573cf'), runner: new Color('#e0a74f'),
};
const PLAYER_SHOT_COLOR = new Color('#54edff');
const ENEMY_SHOT_COLOR = new Color('#ff716b');

export type MouseAimResolver = (pointer: { x: number; y: number }, viewport: { width: number; height: number }) => Vec2;

export class MouseAimBridge {
  private resolver: MouseAimResolver | null = null;

  setResolver(resolver: MouseAimResolver | null): void { this.resolver = resolver; }
  resolve(pointer: { x: number; y: number }, viewport: { width: number; height: number }): Vec2 {
    return this.resolver?.(pointer, viewport) ?? { x: 0, z: 0 };
  }
}

export interface HudBridge {
  update(world: GameRuntime['world']): void;
  setPaused(paused: boolean): void;
}

function PlayerTank({ playerId, register }: {
  playerId: PlayerId;
  register: (id: PlayerId, group: Group | null) => void;
}) {
  const color = CAT_COLORS[playerId];
  return (
    <group ref={group => register(playerId, group)}>
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[1.35, 0.52, 1.8]} />
        <meshStandardMaterial color={color} roughness={0.72} />
      </mesh>
      <mesh position={[-0.73, 0.26, 0.56]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.14, 12]} />
        <meshStandardMaterial color="#242b36" roughness={0.9} />
      </mesh>
      <mesh position={[0.73, 0.26, 0.56]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.14, 12]} />
        <meshStandardMaterial color="#242b36" roughness={0.9} />
      </mesh>
      <mesh position={[-0.73, 0.26, -0.56]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.14, 12]} />
        <meshStandardMaterial color="#242b36" roughness={0.9} />
      </mesh>
      <mesh position={[0.73, 0.26, -0.56]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.14, 12]} />
        <meshStandardMaterial color="#242b36" roughness={0.9} />
      </mesh>
      <group position={[0, 0.78, 0]}>
        <mesh position={[0, 0.48, 0]} castShadow>
          <sphereGeometry args={[0.43, 16, 12]} />
          <meshStandardMaterial color="#e8edf1" roughness={0.82} />
        </mesh>
        <mesh position={[-0.27, 0.86, 0.05]} rotation={[0, 0, -0.25]} castShadow>
          <coneGeometry args={[0.17, 0.48, 4]} />
          <meshStandardMaterial color="#e8edf1" roughness={0.82} />
        </mesh>
        <mesh position={[0.27, 0.86, 0.05]} rotation={[0, 0, 0.25]} castShadow>
          <coneGeometry args={[0.17, 0.48, 4]} />
          <meshStandardMaterial color="#e8edf1" roughness={0.82} />
        </mesh>
        <mesh position={[-0.15, 0.5, 0.38]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshBasicMaterial color="#17212b" />
        </mesh>
        <mesh position={[0.15, 0.5, 0.38]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshBasicMaterial color="#17212b" />
        </mesh>
        <mesh position={[0, 0.36, 0.42]}>
          <sphereGeometry args={[0.075, 8, 8]} />
          <meshBasicMaterial color="#df7b85" />
        </mesh>
      </group>
      <mesh position={[0, 0.72, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.36, 0.22, 12]} />
        <meshStandardMaterial color="#4c5c6d" metalness={0.22} roughness={0.64} />
      </mesh>
      <mesh position={[0, 0.72, 0.55]} castShadow>
        <boxGeometry args={[0.12, 0.12, 0.85]} />
        <meshStandardMaterial color="#344657" metalness={0.35} roughness={0.54} />
      </mesh>
      <mesh position={[0, 1.52, 0]}>
        <sphereGeometry args={[0.17, 10, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <circleGeometry args={[1.18, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.16} depthWrite={false} />
      </mesh>
    </group>
  );
}

function setInstance(mesh: InstancedMesh, index: number, position: Vec2, y: number, size: number, dummy: Object3D): void {
  dummy.position.set(position.x, y, position.z);
  dummy.scale.setScalar(size);
  dummy.rotation.set(0, 0, 0);
  dummy.updateMatrix();
  mesh.setMatrixAt(index, dummy.matrix);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function lerpAngle(current: number, target: number, amount: number): number {
  const fullTurn = Math.PI * 2;
  const delta = ((target - current + Math.PI) % fullTurn + fullTurn) % fullTurn - Math.PI;
  return current + delta * amount;
}

/** A projection of the TypeScript world. All positions are written imperatively per render frame. */
export function WorldView({ runtime, mouseAimBridge, hudBridge, onMenuCommands }: {
  runtime: GameRuntime;
  mouseAimBridge: MouseAimBridge;
  hudBridge: HudBridge;
  onMenuCommands?: (commands: Partial<Record<PlayerId, MenuCommand>>) => void;
}) {
  const { camera, gl, size } = useThree();
  const cameraController = useRef(new SharedCameraController());
  const playerRefs = useRef<Record<PlayerId, Group | null>>({ p1: null, p2: null });
  const enemiesRef = useRef<InstancedMesh>(null);
  const projectilesRef = useRef<InstancedMesh>(null);
  const instanceDummy = useMemo(() => new Object3D(), []);
  const raycaster = useMemo(() => new Raycaster(), []);
  const floorPlane = useMemo(() => new Plane(new Vector3(0, 1, 0), 0), []);
  const mouseNdc = useMemo(() => new Vector2(), []);
  const floorHit = useMemo(() => new Vector3(), []);

  useEffect(() => {
    mouseAimBridge.setResolver((pointer, viewport) => {
      if (!Number.isFinite(pointer.x) || !Number.isFinite(pointer.y)) return { x: 0, z: 0 };
      const rect = gl.domElement.getBoundingClientRect();
      const width = rect.width || viewport.width;
      const height = rect.height || viewport.height;
      mouseNdc.set(
        ((pointer.x - (rect.width ? rect.left : 0)) / width) * 2 - 1,
        -(((pointer.y - (rect.height ? rect.top : 0)) / height) * 2 - 1),
      );
      raycaster.setFromCamera(mouseNdc, camera);
      if (!raycaster.ray.intersectPlane(floorPlane, floorHit)) return { x: 0, z: 0 };
      const player = runtime.world.players.find(candidate => candidate.id === 'p1');
      if (!player) return { x: 0, z: 0 };
      const targetX = clamp(floorHit.x, runtime.world.bounds.min.x, runtime.world.bounds.max.x);
      const targetZ = clamp(floorHit.z, runtime.world.bounds.min.z, runtime.world.bounds.max.z);
      return { x: targetX - player.position.x, z: targetZ - player.position.z };
    });
    return () => mouseAimBridge.setResolver(null);
  }, [camera, floorHit, floorPlane, gl, mouseAimBridge, mouseNdc, raycaster, runtime]);

  useFrame((_, delta) => {
    const world = runtime.world;
    const points = world.players.map(player => player.position);
    const aspect = size.height > 0 ? size.width / size.height : 16 / 9;
    cameraController.current.update(camera as OrthographicCamera, points, aspect, delta);

    runtime.advance(delta);
    for (const player of runtime.world.players) {
      const group = playerRefs.current[player.id];
      if (!group) continue;
      group.visible = true;
      group.position.set(player.position.x, player.status === 'down' ? 0.08 : 0, player.position.z);
      const aimLength = Math.hypot(player.aim.x, player.aim.z);
      if (aimLength > 1e-6) group.rotation.y = lerpAngle(group.rotation.y, Math.atan2(player.aim.x, player.aim.z), Math.min(1, delta * 14));
      group.scale.setScalar(player.status === 'down' ? 0.78 : 1);
    }

    const enemyMesh = enemiesRef.current;
    if (enemyMesh) {
      const enemies = world.enemies.filter(enemy => enemy.status === 'alive' && enemy.hp > 0).slice(0, MAX_ENEMIES);
      enemyMesh.count = enemies.length;
      enemies.forEach((enemy, index) => {
        setInstance(enemyMesh, index, enemy.position, 0.74, 0.72, instanceDummy);
        enemyMesh.setColorAt(index, ENEMY_COLORS[enemy.kind === 'brute' ? 'brute' : enemy.kind === 'gunner' ? 'gunner' : 'runner']);
      });
      enemyMesh.instanceMatrix.needsUpdate = true;
      if (enemyMesh.instanceColor) enemyMesh.instanceColor.needsUpdate = true;
    }
    const projectileMesh = projectilesRef.current;
    if (projectileMesh) {
      const projectiles = world.projectiles.slice(0, MAX_PROJECTILES);
      projectileMesh.count = projectiles.length;
      projectiles.forEach((projectile, index) => {
        setInstance(projectileMesh, index, projectile.position, 0.82, projectile.team === 'players' ? 0.22 : 0.3, instanceDummy);
        projectileMesh.setColorAt(index, projectile.team === 'players' ? PLAYER_SHOT_COLOR : ENEMY_SHOT_COLOR);
      });
      projectileMesh.instanceMatrix.needsUpdate = true;
      if (projectileMesh.instanceColor) projectileMesh.instanceColor.needsUpdate = true;
    }

    hudBridge.update(world);
    const wasPaused = runtime.world.phase === 'paused';
    const commands = runtime.menuCommands;
    const pausePressed = Object.values(commands).some(command => command?.pausePressed);
    if (runtime.world.phase === 'playing' && pausePressed) runtime.pause();
    // The edge that opens pause must not also be interpreted as a menu action.
    onMenuCommands?.(wasPaused ? commands : {});
    hudBridge.setPaused(runtime.world.phase === 'paused');
  });

  return (
    <>
      <OrthographicCameraView makeDefault position={[14, 28, 14]} zoom={1} near={0.1} far={120} />
      <ambientLight intensity={1.8} color="#e6f0fa" />
      <directionalLight position={[-9, 18, 10]} intensity={2.2} color="#fff0d6" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]} receiveShadow>
        <planeGeometry args={[worldWidth(runtime), worldDepth(runtime)]} />
        <meshStandardMaterial color="#45525d" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.16, 0]}>
        <planeGeometry args={[18, 14]} />
        <meshStandardMaterial color="#58636a" roughness={0.98} />
      </mesh>
      <mesh position={[0, -0.03, 0]}>
        <boxGeometry args={[18.2, 0.08, 0.18]} /><meshStandardMaterial color="#8f8c74" />
      </mesh>
      <mesh position={[0, -0.03, 0]}>
        <boxGeometry args={[0.18, 0.08, 14.2]} /><meshStandardMaterial color="#8f8c74" />
      </mesh>
      <gridHelper args={[18, 18, '#81909a', '#5f6b73']} position={[0, -0.075, 0]} />
      {runtime.world.players.map(player => (
        <PlayerTank key={player.id} playerId={player.id} register={(id, group) => { playerRefs.current[id] = group; }} />
      ))}
      <instancedMesh ref={enemiesRef} args={[undefined, undefined, MAX_ENEMIES]} castShadow>
        <dodecahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial color="#ffffff" roughness={0.64} metalness={0.12} />
      </instancedMesh>
      <instancedMesh ref={projectilesRef} args={[undefined, undefined, MAX_PROJECTILES]}>
        <sphereGeometry args={[0.5, 8, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </instancedMesh>
      {runtime.world.colliders.map((collider, index) => {
        const width = collider.max.x - collider.min.x;
        const depth = collider.max.z - collider.min.z;
        return <mesh key={index} position={[(collider.min.x + collider.max.x) / 2, 0.48, (collider.min.z + collider.max.z) / 2]} castShadow>
          <boxGeometry args={[width, 0.96, depth]} />
          <meshStandardMaterial color="#857c6b" roughness={0.9} />
        </mesh>;
      })}
    </>
  );
}

function worldWidth(runtime: GameRuntime): number { return runtime.world.bounds.max.x - runtime.world.bounds.min.x; }
function worldDepth(runtime: GameRuntime): number { return runtime.world.bounds.max.z - runtime.world.bounds.min.z; }
