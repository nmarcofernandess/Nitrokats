import { Euler, Vector3 } from 'three';

export type GamePhase = 'menu' | 'playing' | 'paused' | 'gameover';
export type GameMode = 'classic' | 'zombie';
export type MatchPhase = 'prewave' | 'combat' | 'perk_select' | 'completed' | 'failed';
export type EnemyKind = 'zombieRat' | 'zombieCat' | 'mechaCat';
export type EnemyArchetype = 'rusher' | 'spitter' | 'brute' | 'snare_rat' | 'miniboss_mechacat';
export type WeaponType = 'default' | 'spread';
export type WeaponId = 'pulse_rifle' | 'scatter_cannon' | 'arc_marksman';
export type ObjectiveType =
  | 'eliminate'
  | 'defend_zone'
  | 'eliminate_elite'
  | 'escort'
  | 'survive_mixed'
  | 'miniboss';
export type RunPerkId =
  | 'rapid_loader'
  | 'overcharge'
  | 'fortified'
  | 'vampiric_rounds'
  | 'stabilizer'
  | 'shockwave';
export type GameEventType =
  | 'hit'
  | 'kill'
  | 'damage_taken'
  | 'objective_complete'
  | 'wave_start'
  | 'perk_granted'
  | 'miniboss_phase'
  | 'weapon_swap';

export interface CameraState3P {
  yaw: number;
  pitch: number;
  distance: number;
  height: number;
  smoothing: number;
  sensitivity: number;
  pitchMin: number;
  pitchMax: number;
  shoulderOffset: number;
  collisionPadding: number;
}

export interface InputState {
  moveForward: number;
  moveRight: number;
  lookDeltaX: number;
  lookDeltaY: number;
  isFiring: boolean;
  isAiming: boolean;
  sprint: boolean;
  dash: boolean;
  weaponSwap: WeaponId | null;
}

export interface ObjectiveState {
  id: string;
  wave: number;
  type: ObjectiveType;
  title: string;
  description: string;
  targetValue: number;
  progressValue: number;
  timerRemaining?: number;
  completed: boolean;
}

export interface GameEvent {
  id: string;
  type: GameEventType;
  timestamp: number;
  payload?: Record<string, string | number | boolean>;
}

export interface LaserData {
  id: string;
  position: Vector3;
  rotation: Euler;
  direction: Vector3;
  speed: number;
  damage: number;
  life: number;
  sourceWeapon: WeaponId | 'enemy';
  source: 'player' | 'enemy';
}

export interface TargetData {
  id: string;
  position: Vector3;
}

export interface ParticleData {
  id: string;
  position: Vector3;
  color: string;
  velocity: Vector3;
  life: number;
}

export interface EnemyData {
  id: string;
  position: Vector3;
  rotation: number;
  health: number;
  maxHealth: number;
  kind: EnemyKind;
  archetype: EnemyArchetype;
  phase: number;
  isElite: boolean;
}

export interface PowerUpData {
  id: string;
  position: Vector3;
  type: 'spread';
}
