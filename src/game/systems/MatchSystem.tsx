import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useGameStore } from '../store';
import { ENEMY_ARCHETYPE_CONFIG, WAVE_SPAWN_RULES } from '../config/enemies';
import { getObjectiveForWave } from '../config/objectives';
import { GameBalance } from '../Utils/GameBalance';
import type { EnemyArchetype, ObjectiveState } from '../types';

const ANNOUNCEMENT_SECONDS = 2.2;

const spawnCorners: [number, number][] = [
  [-26, -26],
  [26, -26],
  [-26, 26],
  [26, 26],
  [0, -26],
  [26, 0],
  [0, 26],
  [-26, 0],
  [-14, -26],
  [14, -26],
  [-14, 26],
  [14, 26],
  [-26, -14],
  [-26, 14],
  [26, -14],
  [26, 14],
];

const createObjectiveState = (wave: number): ObjectiveState | null => {
  const config = getObjectiveForWave(wave);
  if (!config) {
    return null;
  }

  return {
    id: config.id,
    wave: config.wave,
    type: config.type,
    title: config.title,
    description: config.description,
    targetValue: config.targetValue,
    progressValue: 0,
    timerRemaining: config.timerSeconds,
    completed: false,
  };
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const randomSpawnPosition = () => {
  const [x, z] = spawnCorners[Math.floor(Math.random() * spawnCorners.length)];
  return new Vector3(x + (Math.random() - 0.5) * 3.4, 0, z + (Math.random() - 0.5) * 3.4);
};

const pickArchetype = (archetypes: EnemyArchetype[]) => {
  if (archetypes.length === 1) {
    return archetypes[0];
  }

  const weighted = archetypes.map((archetype) => ({
    archetype,
    weight: Math.max(0.01, ENEMY_ARCHETYPE_CONFIG[archetype].spawnWeight),
  }));

  const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const entry of weighted) {
    roll -= entry.weight;
    if (roll <= 0) {
      return entry.archetype;
    }
  }

  return weighted[weighted.length - 1].archetype;
};

export const MatchSystem = () => {
  const addEnemy = useGameStore((state) => state.addEnemy);
  const completeObjective = useGameStore((state) => state.completeObjective);
  const nextWave = useGameStore((state) => state.nextWave);
  const resetWaveKills = useGameStore((state) => state.resetWaveKills);
  const rollPerkOptions = useGameStore((state) => state.rollPerkOptions);
  const setCurrentObjective = useGameStore((state) => state.setCurrentObjective);
  const setMatchPhase = useGameStore((state) => state.setMatchPhase);
  const setShowWaveAnnouncement = useGameStore((state) => state.setShowWaveAnnouncement);
  const pushGameEvent = useGameStore((state) => state.pushGameEvent);

  const waveRef = useRef(0);
  const spawnedCountRef = useRef(0);
  const lastSpawnTimeRef = useRef(0);
  const announceStartRef = useRef(0);

  useFrame((state, delta) => {
    const game = useGameStore.getState();

    if (game.gameState !== 'playing' || game.isPaused) {
      return;
    }

    if (game.matchPhase === 'failed' || game.matchPhase === 'completed') {
      return;
    }

    if (game.showWaveAnnouncement && state.clock.elapsedTime - announceStartRef.current >= ANNOUNCEMENT_SECONDS) {
      setShowWaveAnnouncement(false);
    }

    if (waveRef.current !== game.wave || game.matchPhase === 'prewave') {
      waveRef.current = game.wave;
      spawnedCountRef.current = 0;
      lastSpawnTimeRef.current = 0;

      const nextObjective = createObjectiveState(game.wave);
      setCurrentObjective(nextObjective);
      setMatchPhase('combat');

      setShowWaveAnnouncement(true);
      announceStartRef.current = state.clock.elapsedTime;

      pushGameEvent({
        type: 'wave_start',
        payload: {
          wave: game.wave,
        },
      });
      return;
    }

    if (game.matchPhase === 'perk_select') {
      return;
    }

    const waveRule = WAVE_SPAWN_RULES.find((rule) => rule.wave === game.wave);
    const objective = game.currentObjective;

    if (!waveRule || !objective) {
      return;
    }

    const needsTimer = objective.timerRemaining !== undefined;
    let nextTimer = objective.timerRemaining;

    if (needsTimer && typeof nextTimer === 'number' && nextTimer > 0) {
      nextTimer = Math.max(0, nextTimer - delta);
    }

    let progress = objective.progressValue;

    if (objective.type === 'eliminate' || objective.type === 'survive_mixed') {
      progress = Math.min(objective.targetValue, game.waveKills);
    }

    if (objective.type === 'eliminate_elite') {
      const eliteAlive = game.enemies.some((enemy) => enemy.isElite && enemy.archetype === 'brute');
      progress = eliteAlive ? 0 : 1;
    }

    if (objective.type === 'miniboss') {
      const bossAlive = game.enemies.some((enemy) => enemy.archetype === 'miniboss_mechacat');
      progress = bossAlive ? 0 : spawnedCountRef.current >= 1 ? 1 : 0;
    }

    if (objective.type === 'defend_zone' || objective.type === 'escort') {
      const totalTimer = getObjectiveForWave(game.wave)?.timerSeconds ?? 1;
      const elapsedProgress = 1 - (nextTimer ?? 0) / totalTimer;
      progress = Math.round(clamp01(elapsedProgress) * objective.targetValue * 100) / 100;
    }

    const timerCompleted = typeof nextTimer === 'number' ? nextTimer <= 0 : false;
    const objectiveCompletedByProgress = progress >= objective.targetValue;
    const shouldCompleteObjective =
      !objective.completed && (objectiveCompletedByProgress || timerCompleted);

    if (shouldCompleteObjective) {
      // Stop further spawns for this wave once the objective gate is cleared.
      spawnedCountRef.current = waveRule.totalToSpawn;
      completeObjective(objective.id);
      pushGameEvent({
        type: 'objective_complete',
        payload: {
          objective: objective.id,
          wave: game.wave,
        },
      });
    } else if (progress !== objective.progressValue || nextTimer !== objective.timerRemaining) {
      setCurrentObjective({
        ...objective,
        progressValue: progress,
        timerRemaining: nextTimer,
      });
    }

    const objectiveDone = shouldCompleteObjective || objective.completed;

    if (
      objectiveDone &&
      spawnedCountRef.current >= waveRule.totalToSpawn &&
      game.enemies.length === 0
    ) {
      if (game.wave >= 6) {
        setMatchPhase('completed');
        pushGameEvent({
          type: 'objective_complete',
          payload: {
            objective: 'run_complete',
            wave: game.wave,
          },
        });
        return;
      }

      nextWave();
      resetWaveKills();
      rollPerkOptions();
      return;
    }

    if (objectiveDone) {
      return;
    }

    if (spawnedCountRef.current >= waveRule.totalToSpawn || game.enemies.length >= waveRule.maxActive) {
      return;
    }

    if (state.clock.elapsedTime - lastSpawnTimeRef.current < waveRule.spawnInterval) {
      return;
    }

    const nextArchetype =
      spawnedCountRef.current === 0 ? waveRule.archetypes[0] : pickArchetype(waveRule.archetypes);
    const archetypeConfig = ENEMY_ARCHETYPE_CONFIG[nextArchetype];
    const baseHealth = GameBalance.getEnemyHealthForWave(game.wave) * archetypeConfig.healthMultiplier;

    addEnemy({
      position: randomSpawnPosition(),
      archetype: nextArchetype,
      kind: archetypeConfig.kind,
      maxHealth: baseHealth,
      isElite: archetypeConfig.isElite,
    });

    spawnedCountRef.current += 1;
    lastSpawnTimeRef.current = state.clock.elapsedTime;
  });

  return null;
};
