import type { EnemyArchetype, EnemyKind } from '../types';

export interface EnemyArchetypeConfig {
  archetype: EnemyArchetype;
  kind: EnemyKind;
  speed: number;
  damage: number;
  engagementRange: number;
  spawnWeight: number;
  healthMultiplier: number;
  isElite?: boolean;
}

export const ENEMY_ARCHETYPE_CONFIG: Record<EnemyArchetype, EnemyArchetypeConfig> = {
  rusher: {
    archetype: 'rusher',
    kind: 'zombieRat',
    speed: 1.25,
    damage: 1.05,
    engagementRange: 4,
    spawnWeight: 0.36,
    healthMultiplier: 0.9,
  },
  spitter: {
    archetype: 'spitter',
    kind: 'zombieCat',
    speed: 0.92,
    damage: 1.0,
    engagementRange: 16.5,
    spawnWeight: 0.3,
    healthMultiplier: 1.0,
  },
  brute: {
    archetype: 'brute',
    kind: 'zombieCat',
    speed: 0.68,
    damage: 1.45,
    engagementRange: 5.5,
    spawnWeight: 0.18,
    healthMultiplier: 2.7,
    isElite: true,
  },
  snare_rat: {
    archetype: 'snare_rat',
    kind: 'zombieRat',
    speed: 1.0,
    damage: 0.95,
    engagementRange: 9.5,
    spawnWeight: 0.16,
    healthMultiplier: 1.25,
  },
  miniboss_mechacat: {
    archetype: 'miniboss_mechacat',
    kind: 'mechaCat',
    speed: 0.7,
    damage: 1.8,
    engagementRange: 20,
    spawnWeight: 0,
    healthMultiplier: 8,
    isElite: true,
  },
};

export interface WaveSpawnRule {
  wave: number;
  maxActive: number;
  totalToSpawn: number;
  archetypes: EnemyArchetype[];
  spawnInterval: number;
}

export const WAVE_SPAWN_RULES: WaveSpawnRule[] = [
  { wave: 1, maxActive: 6, totalToSpawn: 12, archetypes: ['rusher', 'spitter'], spawnInterval: 1.05 },
  {
    wave: 2,
    maxActive: 8,
    totalToSpawn: 16,
    archetypes: ['rusher', 'spitter', 'snare_rat'],
    spawnInterval: 0.98,
  },
  {
    wave: 3,
    maxActive: 10,
    totalToSpawn: 16,
    archetypes: ['spitter', 'brute', 'snare_rat'],
    spawnInterval: 0.92,
  },
  {
    wave: 4,
    maxActive: 12,
    totalToSpawn: 20,
    archetypes: ['rusher', 'spitter', 'brute', 'snare_rat'],
    spawnInterval: 0.88,
  },
  {
    wave: 5,
    maxActive: 14,
    totalToSpawn: 24,
    archetypes: ['rusher', 'spitter', 'brute', 'snare_rat'],
    spawnInterval: 0.85,
  },
  {
    wave: 6,
    maxActive: 1,
    totalToSpawn: 1,
    archetypes: ['miniboss_mechacat'],
    spawnInterval: 0,
  },
];
