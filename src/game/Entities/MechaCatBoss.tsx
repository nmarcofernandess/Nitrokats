import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import { Euler, Group, Vector3 } from 'three';
import { ArriveBehavior, Vehicle } from 'yuka';
import { useGameStore } from '../store';
import { aiManager } from '../Utils/AIManager';
import { gameRegistry } from '../Utils/ObjectRegistry';
import { GameBalance } from '../Utils/GameBalance';
import type { EnemyData } from '../types';

const BASE_SPEED = 1.9;

interface MechaCatBossProps {
  data: EnemyData;
}

export const MechaCatBoss = ({ data }: MechaCatBossProps) => {
  const bodyRef = useRef<Group>(null);
  const turretRef = useRef<Group>(null);
  const vehicleRef = useRef<Vehicle>(null);
  const lastShootTimeRef = useRef(0);
  const lastPhaseRef = useRef(data.phase);

  const addLaser = useGameStore((state) => state.addLaser);
  const pushGameEvent = useGameStore((state) => state.pushGameEvent);
  const gameState = useGameStore((state) => state.gameState);
  const isPaused = useGameStore((state) => state.isPaused);
  const wave = useGameStore((state) => state.wave);

  const spawnPosition = useMemo(() => data.position.clone(), [data.position]);

  useEffect(() => {
    const vehicle = new Vehicle();
    vehicle.position.set(spawnPosition.x, spawnPosition.y, spawnPosition.z);
    vehicle.maxSpeed = BASE_SPEED;
    vehicle.mass = 2.5;

    const arriveBehavior = new ArriveBehavior(aiManager.getPlayerEntity().position, 6, 1.5);
    vehicle.steering.add(arriveBehavior);

    aiManager.registerEnemy(vehicle);
    vehicleRef.current = vehicle;

    return () => {
      aiManager.unregisterEnemy(vehicle);
    };
  }, [spawnPosition.x, spawnPosition.y, spawnPosition.z]);

  useEffect(() => {
    if (bodyRef.current) {
      gameRegistry.registerEnemy(data.id, bodyRef.current);
    }

    return () => gameRegistry.unregisterEnemy(data.id);
  }, [data.id]);

  useFrame((state) => {
    if (!bodyRef.current || !turretRef.current || !vehicleRef.current || gameState !== 'playing' || isPaused) {
      return;
    }

    const vehicle = vehicleRef.current;
    vehicle.maxSpeed = BASE_SPEED + (data.phase - 1) * 0.2;

    const yukaPosition = vehicle.position;
    bodyRef.current.position.set(yukaPosition.x, yukaPosition.y, yukaPosition.z);

    const velocity = vehicle.velocity;
    if (velocity.squaredLength() > 0.08) {
      bodyRef.current.rotation.y = Math.atan2(velocity.x, velocity.z);
    }

    if (lastPhaseRef.current !== data.phase) {
      lastPhaseRef.current = data.phase;
      pushGameEvent({
        type: 'miniboss_phase',
        payload: { phase: data.phase },
      });
    }

    const playerPos = gameRegistry.getPlayerPosition();
    if (!playerPos) {
      return;
    }

    turretRef.current.lookAt(playerPos.x, turretRef.current.position.y, playerPos.z);

    const phaseCooldown = data.phase === 1 ? 1.45 : data.phase === 2 ? 1.05 : 0.7;
    if (state.clock.elapsedTime - lastShootTimeRef.current < phaseCooldown) {
      return;
    }

    const baseDir = new Vector3().subVectors(playerPos, bodyRef.current.position).setY(0).normalize();
    if (baseDir.lengthSq() === 0) {
      return;
    }

    const spreadPattern = data.phase === 1 ? [0] : data.phase === 2 ? [-0.12, 0, 0.12] : [-0.18, -0.08, 0, 0.08, 0.18];

    for (const offset of spreadPattern) {
      const direction = baseDir.clone().applyAxisAngle(new Vector3(0, 1, 0), offset).normalize();
      const yaw = Math.atan2(direction.x, direction.z);
      const spawnPos = bodyRef.current.position.clone().addScaledVector(direction, 1.7);
      spawnPos.y = 1.4;

      addLaser({
        position: spawnPos,
        rotation: new Euler(0, yaw, 0),
        direction,
        source: 'enemy',
        sourceWeapon: 'enemy',
        damage: GameBalance.getDamageForWave(wave) * (1.2 + data.phase * 0.35),
        speed: 24 + data.phase * 2,
        life: 4.5,
      });
    }

    lastShootTimeRef.current = state.clock.elapsedTime;
  });

  const hpRatio = data.maxHealth > 0 ? data.health / data.maxHealth : 0;
  const phaseColor = data.phase === 1 ? '#ff5fd2' : data.phase === 2 ? '#ff3b8f' : '#ff124f';

  return (
    <group ref={bodyRef} position={data.position} rotation={[0, data.rotation, 0]} scale={[2.1, 2.1, 2.1]}>
      <mesh castShadow receiveShadow position={[0, 0.2, 0]}>
        <boxGeometry args={[2.2, 1.1, 2.6]} />
        <meshToonMaterial color="#341344" />
        <Edges color="#12071b" threshold={12} />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 1.05, 0.05]}>
        <boxGeometry args={[1.45, 0.9, 1.65]} />
        <meshToonMaterial color={phaseColor} />
        <Edges color="#190b26" threshold={12} />
      </mesh>

      <group ref={turretRef} position={[0, 1.02, 0.55]}>
        <mesh position={[0, 0.12, 0.85]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.2, 1.6, 14]} />
          <meshToonMaterial color="#ffe9ff" />
        </mesh>

        <mesh position={[-0.34, 0.12, 0.82]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 1.15, 12]} />
          <meshToonMaterial color="#ffd5f3" />
        </mesh>

        <mesh position={[0.34, 0.12, 0.82]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 1.15, 12]} />
          <meshToonMaterial color="#ffd5f3" />
        </mesh>
      </group>

      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.8, 0]}>
        <torusGeometry args={[1.35, 0.05, 12, 48]} />
        <meshBasicMaterial color={phaseColor} transparent opacity={0.65} toneMapped={false} />
      </mesh>

      <mesh position={[0, 1.8, 0]}>
        <planeGeometry args={[2.4, 0.13]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.92} />
      </mesh>
      <mesh position={[-1.2 + hpRatio * 1.2, 1.8, 0.001]}>
        <planeGeometry args={[2.4 * hpRatio, 0.13]} />
        <meshBasicMaterial color={phaseColor} toneMapped={false} />
      </mesh>
    </group>
  );
};
