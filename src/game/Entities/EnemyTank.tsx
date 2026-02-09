import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Euler, Group, Vector3 } from 'three';
import { Edges } from '@react-three/drei';
import { ArriveBehavior, Vehicle } from 'yuka';
import { useGameStore } from '../store';
import { aiManager } from '../Utils/AIManager';
import { generateCatFaceTexture, generateChassisTexture, generateTracksTexture } from '../Utils/TextureGenerator';
import { gameRegistry } from '../Utils/ObjectRegistry';
import type { EnemyData } from '../types';

const ENEMY_SPEED = 3;
const SHOOT_DISTANCE = 15;
const SHOOT_COOLDOWN = 2.0;

interface EnemyTankProps {
  data: EnemyData;
}

export const EnemyTank = ({ data }: EnemyTankProps) => {
  const bodyRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const vehicleRef = useRef<Vehicle>(null);
  const lastShootTimeRef = useRef(0);

  const addLaser = useGameStore((state) => state.addLaser);
  const isPaused = useGameStore((state) => state.isPaused);
  const gameState = useGameStore((state) => state.gameState);

  const catFace = useMemo(() => generateCatFaceTexture('#2e1a1a', '#ffff00'), []);
  const tracks = useMemo(() => generateTracksTexture(), []);
  const chassis = useMemo(() => generateChassisTexture('#4a2a2a'), []);

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
  }, [data.position.x, data.position.y, data.position.z]);

  useEffect(() => {
    if (bodyRef.current) {
      gameRegistry.registerEnemy(data.id, bodyRef.current);
    }

    return () => gameRegistry.unregisterEnemy(data.id);
  }, [data.id]);

  useFrame((state, delta) => {
    if (
      !bodyRef.current ||
      !headRef.current ||
      !vehicleRef.current ||
      isPaused ||
      gameState !== 'playing'
    ) {
      return;
    }

    const yukaPosition = vehicleRef.current.position;
    bodyRef.current.position.set(yukaPosition.x, yukaPosition.y, yukaPosition.z);

    const others = gameRegistry.getEnemies();
    for (const other of others) {
      if (other.id === data.id) {
        continue;
      }

      const dx = yukaPosition.x - other.ref.position.x;
      const dz = yukaPosition.z - other.ref.position.z;
      const distSq = dx * dx + dz * dz;

      if (distSq >= 4) {
        continue;
      }

      const length = Math.sqrt(distSq);
      const force = 4 * delta;
      if (length > 0.001) {
        vehicleRef.current.position.x += (dx / length) * force;
        vehicleRef.current.position.z += (dz / length) * force;
      }
    }

    const velocity = vehicleRef.current.velocity;
    if (velocity.squaredLength() > 0.1) {
      bodyRef.current.rotation.y = Math.atan2(velocity.x, velocity.z);
    }

    const playerPos = gameRegistry.getPlayerPosition();
    if (!playerPos) {
      return;
    }

    headRef.current.lookAt(playerPos.x, headRef.current.position.y, playerPos.z);
    const dist = bodyRef.current.position.distanceTo(playerPos);

    if (dist < SHOOT_DISTANCE && state.clock.elapsedTime - lastShootTimeRef.current > SHOOT_COOLDOWN) {
      const euler = new Euler().copy(headRef.current.rotation);
      euler.y += (Math.random() - 0.5) * 0.2;

      const forward = new Vector3(0, 0, 1).applyEuler(headRef.current.rotation);
      const spawnPos = headRef.current.position.clone().add(forward).add(bodyRef.current.position);
      addLaser(spawnPos, euler, 'enemy');

      lastShootTimeRef.current = state.clock.elapsedTime;
    }
  });

  return (
    <group ref={bodyRef} position={data.position} rotation={[0, data.rotation, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
        <boxGeometry args={[1.8, 0.8, 2.2]} />
        <meshStandardMaterial map={chassis} />
        <Edges color="#ff0000" threshold={15} />
      </mesh>

      <mesh position={[-1, 0, 0]}>
        <boxGeometry args={[0.4, 0.6, 2.4]} />
        <meshStandardMaterial map={tracks} />
      </mesh>

      <mesh position={[1, 0, 0]}>
        <boxGeometry args={[0.4, 0.6, 2.4]} />
        <meshStandardMaterial map={tracks} />
      </mesh>

      <group ref={headRef} position={[0, 0.8, 0]}>
        <mesh castShadow position={[0, 0.3, 0]}>
          <boxGeometry args={[1, 0.8, 0.9]} />
          <meshStandardMaterial map={catFace} />
          <Edges color="#ff0000" threshold={15} />
        </mesh>

        <mesh position={[-0.35, 0.8, 0]} rotation={[0, 0, 0.2]}>
          <coneGeometry args={[0.15, 0.4, 4]} />
          <meshStandardMaterial color="#2e1a1a" />
        </mesh>

        <mesh position={[0.35, 0.8, 0]} rotation={[0, 0, -0.2]}>
          <coneGeometry args={[0.15, 0.4, 4]} />
          <meshStandardMaterial color="#2e1a1a" />
        </mesh>
      </group>
    </group>
  );
};
