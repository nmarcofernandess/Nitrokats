import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { Edges } from '@react-three/drei';
import { ArriveBehavior, Vehicle } from 'yuka';
import { useGameStore } from '../store';
import { aiManager } from '../Utils/AIManager';
import { gameRegistry } from '../Utils/ObjectRegistry';
import { audioManager } from '../Utils/AudioManager';
import { GameBalance } from '../Utils/GameBalance';
import type { EnemyData } from '../types';

const RAT_SPEED = 6.0;
const EXPLOSION_RANGE = 2.0;

interface ZombieRatProps {
  data: EnemyData;
}

export const ZombieRat = ({ data }: ZombieRatProps) => {
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

  useEffect(() => {
    const vehicle = new Vehicle();
    vehicle.position.set(data.position.x, data.position.y, data.position.z);
    vehicle.maxSpeed = RAT_SPEED;
    vehicle.mass = 0.8;

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

      if (distSq >= 1.5) {
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
        addParticle(bodyRef.current.position.clone(), '#ff00ff', 30);
        audioManager.playExplosion();
        removeEnemy(data.id);
        return;
      }
    }

    const legTime = state.clock.elapsedTime * 20;
    const tailSwing = Math.sin(state.clock.elapsedTime * 15) * 0.5;

    frontLeftLegRef.current?.rotation.set(Math.sin(legTime), 0, 0);
    frontRightLegRef.current?.rotation.set(Math.sin(legTime + Math.PI), 0, 0);
    rearLeftLegRef.current?.rotation.set(Math.sin(legTime + Math.PI), 0, 0);
    rearRightLegRef.current?.rotation.set(Math.sin(legTime), 0, 0);

    if (tailRef.current) {
      tailRef.current.rotation.set(-0.2, tailSwing, 0);
    }

    bodyRef.current.position.y = 0.3 + Math.abs(Math.sin(legTime)) * 0.05;
  });

  return (
    <group ref={bodyRef} position={data.position} rotation={[0, data.rotation, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.3, -0.1]}>
        <boxGeometry args={[0.7, 0.5, 1.4]} />
        <meshStandardMaterial color="#4a4a4a" />
        <Edges color="#222" threshold={15} />
      </mesh>

      <group ref={frontLeftLegRef} position={[-0.35, 0.2, 0.4]}>
        <mesh position={[0, -0.2, 0]}>
          <boxGeometry args={[0.15, 0.4, 0.15]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </group>

      <group ref={frontRightLegRef} position={[0.35, 0.2, 0.4]}>
        <mesh position={[0, -0.2, 0]}>
          <boxGeometry args={[0.15, 0.4, 0.15]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </group>

      <group ref={rearLeftLegRef} position={[-0.35, 0.2, -0.6]}>
        <mesh position={[0, -0.2, 0]}>
          <boxGeometry args={[0.15, 0.4, 0.15]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </group>

      <group ref={rearRightLegRef} position={[0.35, 0.2, -0.6]}>
        <mesh position={[0, -0.2, 0]}>
          <boxGeometry args={[0.15, 0.4, 0.15]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </group>

      <group ref={tailRef} position={[0, 0.4, -0.8]}>
        <mesh position={[0, 0, -0.6]}>
          <boxGeometry args={[0.1, 0.1, 1.2]} />
          <meshStandardMaterial color="#ffaaaa" />
        </mesh>
      </group>

      <group ref={headRef} position={[0, 0.6, 0.6]}>
        <mesh castShadow position={[0, 0, 0.2]}>
          <boxGeometry args={[0.5, 0.5, 0.8]} />
          <meshStandardMaterial color="#4a4a4a" />
          <Edges color="#ff0000" threshold={15} />
        </mesh>

        <mesh position={[-0.15, 0.1, 0.6]}>
          <boxGeometry args={[0.1, 0.1, 0.05]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
        </mesh>

        <mesh position={[0.15, 0.1, 0.6]}>
          <boxGeometry args={[0.1, 0.1, 0.05]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
        </mesh>

        <mesh position={[-0.2, 0.3, -0.1]} rotation={[Math.PI / 2, 0, 0.2]}>
          <cylinderGeometry args={[0.15, 0.15, 0.05]} />
          <meshStandardMaterial color="#ffaaaa" />
        </mesh>

        <mesh position={[0.2, 0.3, -0.1]} rotation={[Math.PI / 2, 0, -0.2]}>
          <cylinderGeometry args={[0.15, 0.15, 0.05]} />
          <meshStandardMaterial color="#ffaaaa" />
        </mesh>
      </group>
    </group>
  );
};
