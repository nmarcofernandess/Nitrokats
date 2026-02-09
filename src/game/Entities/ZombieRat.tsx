import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import { Group } from 'three';
import { ArriveBehavior, Vehicle } from 'yuka';
import { useGameStore } from '../store';
import { aiManager } from '../Utils/AIManager';
import { gameRegistry } from '../Utils/ObjectRegistry';
import { audioManager } from '../Utils/AudioManager';
import { ENEMY_ARCHETYPE_CONFIG } from '../config/enemies';
import { GameBalance } from '../Utils/GameBalance';
import type { EnemyData } from '../types';

const BASE_SPEED = 5.8;
const EXPLOSION_RANGE = 1.8;

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

  const archetypeConfig = ENEMY_ARCHETYPE_CONFIG[data.archetype] ?? ENEMY_ARCHETYPE_CONFIG.rusher;
  const spawnPosition = useMemo(() => data.position.clone(), [data.position]);

  useEffect(() => {
    const vehicle = new Vehicle();
    vehicle.position.set(spawnPosition.x, spawnPosition.y, spawnPosition.z);
    vehicle.maxSpeed = BASE_SPEED * archetypeConfig.speed;
    vehicle.mass = 0.8;

    const arriveBehavior = new ArriveBehavior(aiManager.getPlayerEntity().position, 0.55, 0.5);
    vehicle.steering.add(arriveBehavior);

    aiManager.registerEnemy(vehicle);
    vehicleRef.current = vehicle;

    return () => {
      aiManager.unregisterEnemy(vehicle);
    };
  }, [archetypeConfig.speed, spawnPosition.x, spawnPosition.y, spawnPosition.z]);

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

    const vehicle = vehicleRef.current;
    vehicle.maxSpeed = BASE_SPEED * archetypeConfig.speed;

    const yukaPosition = vehicle.position;
    bodyRef.current.position.set(yukaPosition.x, yukaPosition.y, yukaPosition.z);

    const velocity = vehicle.velocity;
    if (velocity.squaredLength() > 0.08) {
      bodyRef.current.rotation.y = Math.atan2(velocity.x, velocity.z);
    }

    const playerPos = gameRegistry.getPlayerPosition();
    if (playerPos) {
      headRef.current?.lookAt(playerPos.x, headRef.current.position.y, playerPos.z);

      const dist = bodyRef.current.position.distanceTo(playerPos);
      if (dist < EXPLOSION_RANGE) {
        const damage = GameBalance.getDamageForWave(wave) * archetypeConfig.damage;
        takeDamage(damage);
        addParticle(bodyRef.current.position.clone(), '#ff5f8f', 28);
        audioManager.playExplosion();
        removeEnemy(data.id);
        return;
      }
    }

    const legTime = state.clock.elapsedTime * 20;
    const tailSwing = Math.sin(state.clock.elapsedTime * 16) * 0.55;

    frontLeftLegRef.current?.rotation.set(Math.sin(legTime), 0, 0);
    frontRightLegRef.current?.rotation.set(Math.sin(legTime + Math.PI), 0, 0);
    rearLeftLegRef.current?.rotation.set(Math.sin(legTime + Math.PI), 0, 0);
    rearRightLegRef.current?.rotation.set(Math.sin(legTime), 0, 0);

    if (tailRef.current) {
      tailRef.current.rotation.set(-0.2, tailSwing, 0);
    }

    bodyRef.current.position.y = 0.32 + Math.abs(Math.sin(legTime)) * 0.05;

    const others = gameRegistry.getEnemies();
    for (const other of others) {
      if (other.id === data.id) {
        continue;
      }

      const dx = yukaPosition.x - other.ref.position.x;
      const dz = yukaPosition.z - other.ref.position.z;
      const distSq = dx * dx + dz * dz;

      if (distSq >= 1.7) {
        continue;
      }

      const length = Math.sqrt(distSq);
      if (length > 0.001) {
        const force = 5.6 * delta;
        vehicle.position.x += (dx / length) * force;
        vehicle.position.z += (dz / length) * force;
      }
    }
  });

  return (
    <group ref={bodyRef} position={data.position} rotation={[0, data.rotation, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.3, -0.1]}>
        <boxGeometry args={[0.72, 0.52, 1.45]} />
        <meshToonMaterial color="#ff4966" />
        <Edges color="#56142b" threshold={15} />
      </mesh>

      <group ref={frontLeftLegRef} position={[-0.35, 0.2, 0.42]}>
        <mesh position={[0, -0.2, 0]}>
          <boxGeometry args={[0.14, 0.4, 0.14]} />
          <meshToonMaterial color="#4b1021" />
        </mesh>
      </group>

      <group ref={frontRightLegRef} position={[0.35, 0.2, 0.42]}>
        <mesh position={[0, -0.2, 0]}>
          <boxGeometry args={[0.14, 0.4, 0.14]} />
          <meshToonMaterial color="#4b1021" />
        </mesh>
      </group>

      <group ref={rearLeftLegRef} position={[-0.35, 0.2, -0.62]}>
        <mesh position={[0, -0.2, 0]}>
          <boxGeometry args={[0.14, 0.4, 0.14]} />
          <meshToonMaterial color="#4b1021" />
        </mesh>
      </group>

      <group ref={rearRightLegRef} position={[0.35, 0.2, -0.62]}>
        <mesh position={[0, -0.2, 0]}>
          <boxGeometry args={[0.14, 0.4, 0.14]} />
          <meshToonMaterial color="#4b1021" />
        </mesh>
      </group>

      <group ref={tailRef} position={[0, 0.4, -0.82]}>
        <mesh position={[0, 0, -0.6]}>
          <boxGeometry args={[0.1, 0.1, 1.2]} />
          <meshToonMaterial color="#ff7a9b" />
        </mesh>
      </group>

      <group ref={headRef} position={[0, 0.62, 0.65]}>
        <mesh castShadow position={[0, 0, 0.2]}>
          <boxGeometry args={[0.48, 0.5, 0.82]} />
          <meshToonMaterial color="#ff7598" />
          <Edges color="#4a1325" threshold={15} />
        </mesh>

        <mesh position={[-0.16, 0.11, 0.58]}>
          <boxGeometry args={[0.1, 0.1, 0.05]} />
          <meshStandardMaterial color="#fff" emissive="#ff2d61" emissiveIntensity={2} />
        </mesh>

        <mesh position={[0.16, 0.11, 0.58]}>
          <boxGeometry args={[0.1, 0.1, 0.05]} />
          <meshStandardMaterial color="#fff" emissive="#ff2d61" emissiveIntensity={2} />
        </mesh>
      </group>
    </group>
  );
};
