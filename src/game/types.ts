import { Euler, Vector3 } from 'three';

export type GamePhase = 'menu' | 'playing' | 'paused' | 'gameover';
export type GameMode = 'classic' | 'zombie';
export type EnemyKind = 'tank' | 'zombieRat' | 'zombieCat';
export type WeaponType = 'default' | 'spread';

export interface LaserData {
  id: string;
  position: Vector3;
  rotation: Euler;
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
  kind: EnemyKind;
}

export interface PowerUpData {
  id: string;
  position: Vector3;
  type: 'spread';
}
