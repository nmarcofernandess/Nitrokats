import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import { Euler, Group, Vector3 } from 'three';
import { ArriveBehavior, Vehicle } from 'yuka';
import { useGameStore } from '../store';
import { aiManager } from '../Utils/AIManager';
import { gameRegistry } from '../Utils/ObjectRegistry';
import { audioManager } from '../Utils/AudioManager';
import { ENEMY_ARCHETYPE_CONFIG } from '../config/enemies';
import { GameBalance } from '../Utils/GameBalance';
import type { EnemyData } from '../types';

const BASE_SPEED = 4.6;
const SPITTER_COOLDOWN = 1.1;
const BRUTE_COOLDOWN = 0.9;

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
  const lastAttackTimeRef = useRef(0);

  const takeDamage = useGameStore((state) => state.takeDamage);
  const addLaser = useGameStore((state) => state.addLaser);
  const addParticle = useGameStore((state) => state.addParticle);
  const pushGameEvent = useGameStore((state) => state.pushGameEvent);
  const isPaused = useGameStore((state) => state.isPaused);
  const gameState = useGameStore((state) => state.gameState);
  const wave = useGameStore((state) => state.wave);

  const archetypeConfig = ENEMY_ARCHETYPE_CONFIG[data.archetype] ?? ENEMY_ARCHETYPE_CONFIG.spitter;
  const spawnPosition = useMemo(() => data.position.clone(), [data.position]);

  useEffect(() => {
    const vehicle = new Vehicle();
    vehicle.position.set(spawnPosition.x, spawnPosition.y, spawnPosition.z);
    vehicle.maxSpeed = BASE_SPEED * archetypeConfig.speed;
    vehicle.mass = data.archetype === 'brute' ? 1.9 : 1;

    const arriveRadius = data.archetype === 'spitter' ? 8.2 : data.archetype === 'brute' ? 2.1 : 1.2;
    const arriveBehavior = new ArriveBehavior(aiManager.getPlayerEntity().position, arriveRadius, 0.55);
    vehicle.steering.add(arriveBehavior);

    aiManager.registerEnemy(vehicle);
    vehicleRef.current = vehicle;

    return () => {
      aiManager.unregisterEnemy(vehicle);
    };
  }, [archetypeConfig.speed, data.archetype, spawnPosition.x, spawnPosition.y, spawnPosition.z]);

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
      const now = state.clock.elapsedTime;

      if (data.archetype === 'spitter') {
        if (dist <= archetypeConfig.engagementRange && now - lastAttackTimeRef.current >= SPITTER_COOLDOWN) {
          const direction = new Vector3()
            .subVectors(playerPos, bodyRef.current.position)
            .setY(0)
            .normalize();

          direction.x += (Math.random() - 0.5) * 0.06;
          direction.z += (Math.random() - 0.5) * 0.06;
          direction.normalize();

          const yaw = Math.atan2(direction.x, direction.z);
          const spawnPos = bodyRef.current.position.clone().addScaledVector(direction, 1.2);
          spawnPos.y = 0.9;

          addLaser({
            position: spawnPos,
            rotation: new Euler(0, yaw, 0),
            direction,
            source: 'enemy',
            sourceWeapon: 'enemy',
            damage: GameBalance.getDamageForWave(wave) * archetypeConfig.damage,
            speed: 22,
            life: 3.4,
          });

          addParticle(spawnPos, '#73ff94', 5);
          lastAttackTimeRef.current = now;
        }
      } else if (data.archetype === 'brute') {
        if (dist < 2.4 && now - lastAttackTimeRef.current >= BRUTE_COOLDOWN) {
          const damage = GameBalance.getDamageForWave(wave) * archetypeConfig.damage;
          takeDamage(damage);
          addParticle(bodyRef.current.position.clone(), '#ffd34d', 22);
          pushGameEvent({
            type: 'damage_taken',
            payload: {
              x: bodyRef.current.position.x,
              z: bodyRef.current.position.z,
              source: 'brute',
            },
          });
          audioManager.playHit();
          lastAttackTimeRef.current = now;
        }
      } else if (dist < 2.1) {
        const damage = GameBalance.getDamageForWave(wave) * archetypeConfig.damage;
        takeDamage(damage);
        addParticle(bodyRef.current.position.clone(), '#7dff9f', 16);
        pushGameEvent({
          type: 'damage_taken',
          payload: {
            x: bodyRef.current.position.x,
            z: bodyRef.current.position.z,
            source: 'zombie_cat',
          },
        });
        audioManager.playHit();
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

    bodyRef.current.position.y = 0.48 + Math.abs(Math.sin(legTime)) * 0.08;

    const others = gameRegistry.getEnemies();
    for (const other of others) {
      if (other.id === data.id) {
        continue;
      }

      const dx = yukaPosition.x - other.ref.position.x;
      const dz = yukaPosition.z - other.ref.position.z;
      const distSq = dx * dx + dz * dz;
      if (distSq >= 2.1) {
        continue;
      }

      const length = Math.sqrt(distSq);
      if (length > 0.001) {
        const force = 4.8 * delta;
        vehicle.position.x += (dx / length) * force;
        vehicle.position.z += (dz / length) * force;
      }
    }
  });

  const isBrute = data.archetype === 'brute';

  return (
    <group
      ref={bodyRef}
      position={data.position}
      rotation={[0, data.rotation, 0]}
      scale={isBrute ? [1.35, 1.35, 1.35] : [1, 1, 1]}
    >
      <mesh castShadow receiveShadow position={[0, 0.42, -0.18]}>
        <boxGeometry args={[1.0, 0.8, 1.8]} />
        <meshToonMaterial color={isBrute ? '#ffd34d' : '#2b7f4f'} />
        <Edges color={isBrute ? '#6f5312' : '#11472a'} threshold={15} />
      </mesh>

      <group ref={frontLeftLegRef} position={[-0.4, 0.4, 0.5]}>
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[0.25, 0.8, 0.25]} />
          <meshToonMaterial color="#124227" />
        </mesh>
      </group>

      <group ref={frontRightLegRef} position={[0.4, 0.4, 0.5]}>
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[0.25, 0.8, 0.25]} />
          <meshToonMaterial color="#124227" />
        </mesh>
      </group>

      <group ref={rearLeftLegRef} position={[-0.4, 0.4, -0.9]}>
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[0.25, 0.8, 0.25]} />
          <meshToonMaterial color="#124227" />
        </mesh>
      </group>

      <group ref={rearRightLegRef} position={[0.4, 0.4, -0.9]}>
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[0.25, 0.8, 0.25]} />
          <meshToonMaterial color="#124227" />
        </mesh>
      </group>

      <group ref={tailRef} position={[0, 0.6, -1.1]}>
        <mesh position={[0, 0.3, -0.3]}>
          <boxGeometry args={[0.15, 0.15, 0.8]} />
          <meshToonMaterial color="#7ff2a4" />
        </mesh>
      </group>

      <group ref={headRef} position={[0, 0.8, 0.8]}>
        <mesh castShadow position={[0, 0.3, 0]}>
          <boxGeometry args={[0.9, 0.7, 0.7]} />
          <meshToonMaterial color={isBrute ? '#ffe182' : '#75d891'} />
          <Edges color="#0f3b24" threshold={15} />
        </mesh>

        <mesh position={[-0.35, 0.8, 0]} rotation={[0, 0, 0.2]}>
          <coneGeometry args={[0.15, 0.4, 4]} />
          <meshToonMaterial color="#1f5d37" />
        </mesh>

        <mesh position={[0.35, 0.8, 0]} rotation={[0, 0, -0.2]}>
          <coneGeometry args={[0.15, 0.4, 4]} />
          <meshToonMaterial color="#1f5d37" />
        </mesh>
      </group>
    </group>
  );
};
