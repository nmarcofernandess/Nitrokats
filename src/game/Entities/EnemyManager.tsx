import { useCallback, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 as ThreeVector3 } from 'three';
import { useGameStore } from '../store';
import { EnemyTank } from './EnemyTank';
import { ZombieRat } from './ZombieRat';
import { ZombieCat } from './ZombieCat';
import { GameBalance } from '../Utils/GameBalance';
import type { EnemyKind } from '../types';

export const EnemyManager = () => {
  const enemies = useGameStore((state) => state.enemies);
  const addEnemy = useGameStore((state) => state.addEnemy);
  const wave = useGameStore((state) => state.wave);
  const nextWave = useGameStore((state) => state.nextWave);
  const gameState = useGameStore((state) => state.gameState);
  const gameMode = useGameStore((state) => state.gameMode);
  const showWaveAnnouncement = useGameStore((state) => state.showWaveAnnouncement);
  const setShowWaveAnnouncement = useGameStore((state) => state.setShowWaveAnnouncement);

  const enemiesSpawnedCount = useRef(0);
  const currentWaveIndex = useRef(0);
  const lastSpawnTime = useRef(0);

  useEffect(() => {
    if (!showWaveAnnouncement) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setShowWaveAnnouncement(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showWaveAnnouncement, setShowWaveAnnouncement]);

  useEffect(() => {
    const totalNeeded = GameBalance.getKillsNeededForWave(wave);

    if (
      gameState === 'playing' &&
      enemies.length === 0 &&
      currentWaveIndex.current === wave &&
      enemiesSpawnedCount.current >= totalNeeded &&
      !showWaveAnnouncement
    ) {
      nextWave();
      setShowWaveAnnouncement(true);
    }
  }, [enemies.length, gameState, nextWave, setShowWaveAnnouncement, showWaveAnnouncement, wave]);

  const spawnEnemy = useCallback(() => {
    const corners = [
      new ThreeVector3(-28, 0, -28),
      new ThreeVector3(28, 0, -28),
      new ThreeVector3(-28, 0, 28),
      new ThreeVector3(28, 0, 28),
    ];

    const spawnPos = corners[Math.floor(Math.random() * corners.length)].clone();
    spawnPos.x += (Math.random() - 0.5) * 4;
    spawnPos.z += (Math.random() - 0.5) * 4;

    let kind: EnemyKind = 'tank';
    if (gameMode === 'zombie') {
      kind = Math.random() < 0.6 ? 'zombieRat' : 'zombieCat';
    }

    addEnemy(spawnPos, kind);
    enemiesSpawnedCount.current += 1;
  }, [addEnemy, gameMode]);

  useFrame((state) => {
    if (gameState !== 'playing' || showWaveAnnouncement) {
      return;
    }

    if (currentWaveIndex.current !== wave) {
      currentWaveIndex.current = wave;
      enemiesSpawnedCount.current = 0;
      lastSpawnTime.current = 0;
    }

    const totalToSpawn = GameBalance.getKillsNeededForWave(wave);
    const maxActive = wave === 1 ? 5 : wave === 2 ? 10 : 15;

    if (enemies.length >= maxActive || enemiesSpawnedCount.current >= totalToSpawn) {
      return;
    }

    if (state.clock.elapsedTime - lastSpawnTime.current > 1.0) {
      spawnEnemy();
      lastSpawnTime.current = state.clock.elapsedTime;
    }
  });

  return (
    <>
      {enemies.map((enemy) => {
        if (enemy.kind === 'tank') {
          return <EnemyTank key={enemy.id} data={enemy} />;
        }

        if (enemy.kind === 'zombieCat') {
          return <ZombieCat key={enemy.id} data={enemy} />;
        }

        return <ZombieRat key={enemy.id} data={enemy} />;
      })}
    </>
  );
};
