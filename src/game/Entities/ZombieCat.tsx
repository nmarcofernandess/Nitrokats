import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { Edges } from '@react-three/drei';
import { ArriveBehavior, Vehicle } from 'yuka';
import { useGameStore } from '../store';
import { aiManager } from '../Utils/AIManager';
import { generateCatFaceTexture } from '../Utils/TextureGenerator';
import { gameRegistry } from '../Utils/ObjectRegistry';
import { audioManager } from '../Utils/AudioManager';
import { GameBalance } from '../Utils/GameBalance';
import type { EnemyData } from '../types';

const ZOMBIE_SPEED = 5.0;
const EXPLOSION_RANGE = 2.0;

interface ZombieCatProps {
  data: EnemyData;
}

export const ZombieCat = ({ data }: ZombieCatProps) => {
  const bodyRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const tailRef = useRef<Group>(null);
  const frontLeftLegRef = useRef<Group>(null);
  const frontRightLegRef = useRef<Group>(null);
  const rearLeftLegRef = useRef<Group>(null);
  const rearRightLegRef = useRef<Group>(null);

  const vehicleRef = useRef<Vehicle>(null);

  const takeDamage = useGameStore((state) => state.takeDamage);
  const removeEnemy = useGameStore((state) => state.removeEnemy);
  const addParticle = useGameStore((state) => state.addParticle);
  const isPaused = useGameStore((state) => state.isPaused);
  const gameState = useGameStore((state) => state.gameState);
  const wave = useGameStore((state) => state.wave);

  const catFace = useMemo(() => generateCatFaceTexture('#2b4a2b', '#ff0000'), []);

  useEffect(() => {
    const vehicle = new Vehicle();
    vehicle.position.set(data.position.x, data.position.y, data.position.z);
    vehicle.maxSpeed = ZOMBIE_SPEED;
    vehicle.mass = 1;

    const arriveBehavior = new ArriveBehavior(aiManager.getPlayerEntity().position, 0.5, 0.5);
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
    if (!bodyRef.current || !vehicleRef.current || isPaused || gameState !== 'playing') {
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

      if (distSq >= 2) {
        continue;
      }

      const length = Math.sqrt(distSq);
      const force = 5 * delta;
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
    if (playerPos) {
      headRef.current?.lookAt(playerPos.x, headRef.current.position.y, playerPos.z);

      const dist = bodyRef.current.position.distanceTo(playerPos);
      if (dist < EXPLOSION_RANGE) {
        const damage = GameBalance.getDamageForWave(wave);
        takeDamage(damage);
        addParticle(bodyRef.current.position.clone(), '#00ff00', 30);
        audioManager.playExplosion();
        removeEnemy(data.id);
        return;
      }
    }

    const legTime = state.clock.elapsedTime * 15;
    const tailSwing = Math.sin(state.clock.elapsedTime * 10) * 0.2;

    frontLeftLegRef.current?.rotation.set(Math.sin(legTime), 0, 0);
    frontRightLegRef.current?.rotation.set(Math.sin(legTime + Math.PI), 0, 0);
    rearLeftLegRef.current?.rotation.set(Math.sin(legTime + Math.PI), 0, 0);
    rearRightLegRef.current?.rotation.set(Math.sin(legTime), 0, 0);

    if (tailRef.current) {
      tailRef.current.rotation.set(0, tailSwing, -0.5);
    }

    bodyRef.current.position.y = 0.5 + Math.abs(Math.sin(legTime)) * 0.1;
  });

  return (
    <group ref={bodyRef} position={data.position} rotation={[0, data.rotation, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.4, -0.2]}>
        <boxGeometry args={[1.0, 0.8, 1.8]} />
        <meshStandardMaterial color="#2b4a2b" />
        <Edges color="#1a2e1a" threshold={15} />
      </mesh>

      <group ref={frontLeftLegRef} position={[-0.4, 0.4, 0.5]}>
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[0.25, 0.8, 0.25]} />
          <meshStandardMaterial color="#1a2e1a" />
        </mesh>
      </group>

      <group ref={frontRightLegRef} position={[0.4, 0.4, 0.5]}>
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[0.25, 0.8, 0.25]} />
          <meshStandardMaterial color="#1a2e1a" />
        </mesh>
      </group>

      <group ref={rearLeftLegRef} position={[-0.4, 0.4, -0.9]}>
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[0.25, 0.8, 0.25]} />
          <meshStandardMaterial color="#1a2e1a" />
        </mesh>
      </group>

      <group ref={rearRightLegRef} position={[0.4, 0.4, -0.9]}>
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[0.25, 0.8, 0.25]} />
          <meshStandardMaterial color="#1a2e1a" />
        </mesh>
      </group>

      <group ref={tailRef} position={[0, 0.6, -1.1]}>
        <mesh position={[0, 0.3, -0.3]}>
          <boxGeometry args={[0.15, 0.15, 0.8]} />
          <meshStandardMaterial color="#2b4a2b" />
        </mesh>
      </group>

      <group ref={headRef} position={[0, 0.8, 0.8]}>
        <mesh castShadow position={[0, 0.3, 0]}>
          <boxGeometry args={[0.9, 0.7, 0.7]} />
          <meshStandardMaterial map={catFace} />
          <Edges color="#ff0000" threshold={15} />
        </mesh>

        <mesh position={[-0.35, 0.8, 0]} rotation={[0, 0, 0.2]}>
          <coneGeometry args={[0.15, 0.4, 4]} />
          <meshStandardMaterial color="#1a2e1a" />
        </mesh>

        <mesh position={[0.35, 0.8, 0]} rotation={[0, 0, -0.2]}>
          <coneGeometry args={[0.15, 0.4, 4]} />
          <meshStandardMaterial color="#1a2e1a" />
        </mesh>
      </group>
    </group>
  );
};
