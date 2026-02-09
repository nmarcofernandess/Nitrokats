import type { CameraState3P } from '../types';

export const CAMERA_DEFAULTS: CameraState3P = {
  yaw: 0,
  pitch: 0.22,
  distance: 4.5,
  height: 1.6,
  smoothing: 0.14,
  sensitivity: 0.0022,
  pitchMin: -0.18,
  pitchMax: 0.78,
  shoulderOffset: 0.9,
  collisionPadding: 0.35,
};

export const ARENA_BOUNDS = {
  minX: -28,
  maxX: 28,
  minZ: -28,
  maxZ: 28,
};

export const CEL_SHADED_PALETTE = {
  playerPrimary: '#31a2ff',
  playerAccent: '#9c4dff',
  enemyRusher: '#ff4966',
  enemySpitter: '#ff7f3a',
  enemyBrute: '#ffd34d',
  enemySnare: '#73ff94',
  enemyBoss: '#ff2dd1',
  arenaBase: '#0c0f28',
  arenaEdge: '#4fe6ff',
};

export const PERFORMANCE_BUDGET = {
  maxDrawCalls: 350,
  maxVisibleTris: 200_000,
  maxParticles: 900,
};
