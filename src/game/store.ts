import { create } from 'zustand';
import { Euler, Vector3 } from 'three';
import { v4 as uuidv4 } from 'uuid';
import { GameBalance } from './Utils/GameBalance';
import type {
  EnemyData,
  EnemyKind,
  GameMode,
  GamePhase,
  LaserData,
  ParticleData,
  PowerUpData,
  TargetData,
  WeaponType,
} from './types';

interface GameState {
  lasers: LaserData[];
  targets: TargetData[];
  enemies: EnemyData[];
  powerUps: PowerUpData[];
  particles: ParticleData[];

  addLaser: (position: Vector3, rotation: Euler, source: 'player' | 'enemy') => void;
  removeLaser: (id: string) => void;

  addTarget: (position: Vector3) => void;
  removeTarget: (id: string) => void;

  addParticle: (position: Vector3, color: string, count?: number) => void;
  updateParticles: (delta: number) => void;

  shake: number;
  triggerShake: (intensity: number) => void;

  score: number;
  kills: number;
  wave: number;
  health: number;

  addScore: (points: number) => void;
  incrementKills: () => void;
  nextWave: () => void;
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;

  gameState: GamePhase;
  gameMode: GameMode;
  isPaused: boolean;

  startGame: (mode: GameMode) => void;
  restartGame: () => void;
  togglePause: () => void;
  goToMenu: () => void;

  addEnemy: (position: Vector3, kind: EnemyKind) => void;
  removeEnemy: (id: string) => void;
  damageEnemy: (id: string, damage: number) => boolean;

  showWaveAnnouncement: boolean;
  setShowWaveAnnouncement: (show: boolean) => void;

  weaponType: WeaponType;
  weaponAmmo: number;
  decrementAmmo: () => void;

  spawnPowerUp: (position: Vector3) => void;
  collectPowerUp: (id: string) => void;
}

const resetPlayableState = {
  score: 0,
  kills: 0,
  wave: 1,
  health: 100,
  lasers: [] as LaserData[],
  particles: [] as ParticleData[],
  enemies: [] as EnemyData[],
  powerUps: [] as PowerUpData[],
  weaponType: 'default' as WeaponType,
  weaponAmmo: 0,
};

export const useGameStore = create<GameState>((set) => ({
  lasers: [],
  targets: [],
  enemies: [],
  powerUps: [],
  particles: [],
  shake: 0,
  score: 0,
  kills: 0,
  wave: 1,
  health: 100,
  gameState: 'menu',
  gameMode: 'classic',
  isPaused: false,
  showWaveAnnouncement: false,
  weaponType: 'default',
  weaponAmmo: 0,

  addLaser: (position, rotation, source) =>
    set((state) => ({
      lasers: [
        ...state.lasers,
        {
          id: uuidv4(),
          position: position.clone(),
          rotation: rotation.clone(),
          source,
        },
      ],
    })),

  removeLaser: (id) =>
    set((state) => ({
      lasers: state.lasers.filter((laser) => laser.id !== id),
    })),

  addTarget: (position) =>
    set((state) => ({
      targets: [...state.targets, { id: uuidv4(), position: position.clone() }],
    })),

  removeTarget: (id) =>
    set((state) => ({
      targets: state.targets.filter((target) => target.id !== id),
    })),

  addParticle: (position, color, count = 5) =>
    set((state) => {
      const newParticles: ParticleData[] = [];
      for (let i = 0; i < count; i += 1) {
        newParticles.push({
          id: uuidv4(),
          position: position.clone(),
          color,
          velocity: new Vector3(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
          ),
          life: 1.0,
        });
      }

      return { particles: [...state.particles, ...newParticles] };
    }),

  updateParticles: (delta) =>
    set((state) => {
      if (state.particles.length === 0) {
        return state;
      }

      const activeParticles: ParticleData[] = [];
      for (const particle of state.particles) {
        particle.position.addScaledVector(particle.velocity, delta);
        particle.life -= delta * 2;
        if (particle.life > 0) {
          activeParticles.push(particle);
        }
      }

      return { particles: activeParticles };
    }),

  triggerShake: (intensity) => set({ shake: intensity }),

  addScore: (points) => set((state) => ({ score: state.score + points })),
  incrementKills: () => set((state) => ({ kills: state.kills + 1 })),
  nextWave: () => set((state) => ({ wave: state.wave + 1 })),

  takeDamage: (amount) =>
    set((state) => {
      if (state.gameState !== 'playing') {
        return state;
      }

      const newHealth = Math.max(0, state.health - amount);
      if (newHealth === 0) {
        return {
          health: 0,
          gameState: 'gameover' as GamePhase,
          isPaused: false,
        };
      }

      return { health: newHealth };
    }),

  heal: (amount) =>
    set((state) => {
      if (state.gameState !== 'playing') {
        return state;
      }

      return { health: Math.min(100, state.health + amount) };
    }),

  startGame: (mode) =>
    set({
      ...resetPlayableState,
      gameState: 'playing',
      gameMode: mode,
      isPaused: false,
      showWaveAnnouncement: true,
    }),

  restartGame: () =>
    set((state) => ({
      ...resetPlayableState,
      gameState: 'playing',
      gameMode: state.gameMode,
      isPaused: false,
      showWaveAnnouncement: true,
    })),

  togglePause: () =>
    set((state) => {
      if (state.gameState !== 'playing' && state.gameState !== 'paused') {
        return state;
      }

      if (state.gameState === 'playing') {
        return { isPaused: true, gameState: 'paused' as GamePhase };
      }

      return { isPaused: false, gameState: 'playing' as GamePhase };
    }),

  goToMenu: () =>
    set({
      ...resetPlayableState,
      gameState: 'menu',
      isPaused: false,
      showWaveAnnouncement: false,
      gameMode: 'classic',
    }),

  addEnemy: (position, kind) =>
    set((state) => ({
      enemies: [
        ...state.enemies,
        {
          id: uuidv4(),
          position: position.clone(),
          rotation: 0,
          health: GameBalance.getEnemyHealthForWave(state.wave),
          kind,
        },
      ],
    })),

  removeEnemy: (id) =>
    set((state) => ({
      enemies: state.enemies.filter((enemy) => enemy.id !== id),
    })),

  damageEnemy: (id, damage) => {
    let wasKilled = false;

    set((state) => {
      const nextEnemies: EnemyData[] = [];

      for (const enemy of state.enemies) {
        if (enemy.id !== id) {
          nextEnemies.push(enemy);
          continue;
        }

        const nextHealth = enemy.health - damage;
        if (nextHealth <= 0) {
          wasKilled = true;
          continue;
        }

        nextEnemies.push({ ...enemy, health: nextHealth });
      }

      return { enemies: nextEnemies };
    });

    return wasKilled;
  },

  setShowWaveAnnouncement: (show) => set({ showWaveAnnouncement: show }),

  decrementAmmo: () =>
    set((state) => {
      const nextAmmo = state.weaponAmmo - 1;
      if (nextAmmo <= 0) {
        return { weaponAmmo: 0, weaponType: 'default' as WeaponType };
      }

      return { weaponAmmo: nextAmmo };
    }),

  spawnPowerUp: (position) =>
    set((state) => {
      if (state.kills === 0 || state.kills % 5 !== 0) {
        return state;
      }

      return {
        powerUps: [
          ...state.powerUps,
          {
            id: uuidv4(),
            position: position.clone(),
            type: 'spread',
          },
        ],
      };
    }),

  collectPowerUp: (id) =>
    set((state) => ({
      powerUps: state.powerUps.filter((powerUp) => powerUp.id !== id),
      weaponType: 'spread',
      weaponAmmo: 20,
    })),
}));
