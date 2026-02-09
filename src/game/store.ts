import { create } from 'zustand';
import { Euler, Vector3 } from 'three';
import { v4 as uuidv4 } from 'uuid';
import { GameBalance } from './Utils/GameBalance';
import { CAMERA_DEFAULTS } from './config/render';
import { RUN_PERK_CONFIG, RUN_PERK_POOL } from './config/perks';
import type {
  CameraState3P,
  EnemyArchetype,
  EnemyData,
  EnemyKind,
  GameEvent,
  GameMode,
  GamePhase,
  InputState,
  LaserData,
  MatchPhase,
  ObjectiveState,
  ParticleData,
  PowerUpData,
  RunPerkId,
  TargetData,
  WeaponId,
  WeaponType,
} from './types';

interface AddEnemyParams {
  position: Vector3;
  archetype: EnemyArchetype;
  kind?: EnemyKind;
  maxHealth?: number;
  isElite?: boolean;
}

interface AddLaserParams {
  position: Vector3;
  rotation: Euler;
  direction: Vector3;
  source: 'player' | 'enemy';
  sourceWeapon: WeaponId | 'enemy';
  damage: number;
  speed: number;
  life?: number;
}

interface GameState {
  lasers: LaserData[];
  targets: TargetData[];
  enemies: EnemyData[];
  powerUps: PowerUpData[];
  particles: ParticleData[];

  addLaser: (params: AddLaserParams) => void;
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
  waveKills: number;
  health: number;
  maxHealth: number;

  addScore: (points: number) => void;
  incrementKills: () => void;
  incrementWaveKills: () => void;
  resetWaveKills: () => void;
  nextWave: () => void;
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;

  gameState: GamePhase;
  gameMode: GameMode;
  isPaused: boolean;
  matchPhase: MatchPhase;

  camera: CameraState3P;
  input: InputState;

  currentObjective: ObjectiveState | null;
  runPerks: RunPerkId[];
  perkOptions: RunPerkId[];

  selectedWeapon: WeaponId;
  aimPoint: Vector3 | null;
  aimTargetEnemyId: string | null;

  eventQueue: GameEvent[];

  startGame: (mode: GameMode) => void;
  startMatch: (seed?: number) => void;
  restartGame: () => void;
  togglePause: () => void;
  goToMenu: () => void;

  setMatchPhase: (phase: MatchPhase) => void;
  setCurrentObjective: (objective: ObjectiveState | null) => void;

  addEnemy: (params: AddEnemyParams) => void;
  removeEnemy: (id: string) => void;
  damageEnemy: (id: string, damage: number) => boolean;

  showWaveAnnouncement: boolean;
  setShowWaveAnnouncement: (show: boolean) => void;

  weaponType: WeaponType;
  setWeaponType: (weaponType: WeaponType) => void;
  weaponAmmo: number;
  decrementAmmo: () => void;
  setSelectedWeapon: (weaponId: WeaponId) => void;

  setLookInput: (deltaX: number, deltaY: number) => void;
  clearLookInput: () => void;
  setMoveInput: (forward: number, right: number) => void;
  setFireInput: (isFiring: boolean) => void;
  setAimPoint: (point: Vector3 | null, targetEnemyId: string | null) => void;
  setCameraState: (partial: Partial<CameraState3P>) => void;
  setWeaponSwap: (weaponId: WeaponId | null) => void;

  spawnPowerUp: (position: Vector3) => void;
  collectPowerUp: (id: string) => void;

  completeObjective: (id: string) => void;
  grantRunPerk: (perkId: RunPerkId) => void;
  rollPerkOptions: () => void;

  pushGameEvent: (event: Omit<GameEvent, 'id' | 'timestamp'>) => void;
  consumeGameEvents: () => GameEvent[];
}

const DEFAULT_INPUT: InputState = {
  moveForward: 0,
  moveRight: 0,
  lookDeltaX: 0,
  lookDeltaY: 0,
  isFiring: false,
  isAiming: true,
  sprint: false,
  dash: false,
  weaponSwap: null,
};

const randomPick = <T>(items: T[], count: number): T[] => {
  const pool = [...items];
  const picked: T[] = [];
  while (picked.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }

  return picked;
};

const resetPlayableState = {
  score: 0,
  kills: 0,
  wave: 1,
  waveKills: 0,
  health: 100,
  maxHealth: 100,
  lasers: [] as LaserData[],
  particles: [] as ParticleData[],
  enemies: [] as EnemyData[],
  powerUps: [] as PowerUpData[],
  weaponType: 'default' as WeaponType,
  weaponAmmo: 0,
  selectedWeapon: 'pulse_rifle' as WeaponId,
  currentObjective: null as ObjectiveState | null,
  runPerks: [] as RunPerkId[],
  perkOptions: [] as RunPerkId[],
  aimPoint: null as Vector3 | null,
  aimTargetEnemyId: null as string | null,
  eventQueue: [] as GameEvent[],
  input: { ...DEFAULT_INPUT },
  camera: { ...CAMERA_DEFAULTS },
};

export const useGameStore = create<GameState>((set, get) => ({
  lasers: [],
  targets: [],
  enemies: [],
  powerUps: [],
  particles: [],

  shake: 0,

  score: 0,
  kills: 0,
  wave: 1,
  waveKills: 0,
  health: 100,
  maxHealth: 100,

  gameState: 'menu',
  gameMode: 'classic',
  isPaused: false,
  matchPhase: 'prewave',

  camera: { ...CAMERA_DEFAULTS },
  input: { ...DEFAULT_INPUT },

  currentObjective: null,
  runPerks: [],
  perkOptions: [],

  selectedWeapon: 'pulse_rifle',
  aimPoint: null,
  aimTargetEnemyId: null,

  eventQueue: [],

  showWaveAnnouncement: false,
  weaponType: 'default',
  weaponAmmo: 0,

  addLaser: ({ position, rotation, direction, source, sourceWeapon, damage, speed, life = 3.5 }) =>
    set((state) => ({
      lasers: [
        ...state.lasers,
        {
          id: uuidv4(),
          position: position.clone(),
          rotation: rotation.clone(),
          direction: direction.clone().normalize(),
          source,
          sourceWeapon,
          damage,
          speed,
          life,
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
  incrementWaveKills: () => set((state) => ({ waveKills: state.waveKills + 1 })),
  resetWaveKills: () => set({ waveKills: 0 }),
  nextWave: () =>
    set((state) => ({
      wave: state.wave + 1,
      waveKills: 0,
    })),

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
          matchPhase: 'failed' as MatchPhase,
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

      return { health: Math.min(state.maxHealth, state.health + amount) };
    }),

  startGame: (mode) => {
    set({ gameMode: mode });
    get().startMatch();
  },

  startMatch: () =>
    set((state) => ({
      ...resetPlayableState,
      gameState: 'playing',
      gameMode: state.gameMode,
      isPaused: false,
      showWaveAnnouncement: true,
      matchPhase: 'prewave',
    })),

  restartGame: () => get().startMatch(),

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
    set((state) => ({
      ...resetPlayableState,
      gameState: 'menu',
      isPaused: false,
      showWaveAnnouncement: false,
      gameMode: state.gameMode,
      matchPhase: 'prewave',
      targets: state.targets,
    })),

  setMatchPhase: (phase) => set({ matchPhase: phase }),
  setCurrentObjective: (objective) => set({ currentObjective: objective }),

  addEnemy: ({ position, archetype, kind, maxHealth, isElite }) =>
    set((state) => {
      const baseHealth = maxHealth ?? GameBalance.getEnemyHealthForWave(state.wave);

      return {
        enemies: [
          ...state.enemies,
          {
            id: uuidv4(),
            position: position.clone(),
            rotation: 0,
            health: baseHealth,
            maxHealth: baseHealth,
            kind: kind ?? 'zombieRat',
            archetype,
            phase: 1,
            isElite: Boolean(isElite),
          },
        ],
      };
    }),

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

        const nextPhase =
          enemy.archetype === 'miniboss_mechacat'
            ? nextHealth <= enemy.maxHealth * 0.33
              ? 3
              : nextHealth <= enemy.maxHealth * 0.66
                ? 2
                : 1
            : enemy.phase;

        nextEnemies.push({ ...enemy, health: nextHealth, phase: nextPhase });
      }

      return { enemies: nextEnemies };
    });

    return wasKilled;
  },

  setShowWaveAnnouncement: (show) => set({ showWaveAnnouncement: show }),

  setWeaponType: (weaponType) => set({ weaponType }),

  decrementAmmo: () =>
    set((state) => {
      const nextAmmo = state.weaponAmmo - 1;
      if (nextAmmo <= 0) {
        return { weaponAmmo: 0, weaponType: 'default' as WeaponType };
      }

      return { weaponAmmo: nextAmmo };
    }),

  setSelectedWeapon: (weaponId) =>
    set((state) => ({
      selectedWeapon: weaponId,
      input: { ...state.input, weaponSwap: null },
    })),

  setLookInput: (deltaX, deltaY) =>
    set((state) => ({
      input: {
        ...state.input,
        lookDeltaX: state.input.lookDeltaX + deltaX,
        lookDeltaY: state.input.lookDeltaY + deltaY,
      },
    })),

  clearLookInput: () =>
    set((state) => ({
      input: {
        ...state.input,
        lookDeltaX: 0,
        lookDeltaY: 0,
      },
    })),

  setMoveInput: (forward, right) =>
    set((state) => ({
      input: {
        ...state.input,
        moveForward: forward,
        moveRight: right,
      },
    })),

  setFireInput: (isFiring) =>
    set((state) => ({
      input: {
        ...state.input,
        isFiring,
      },
    })),

  setAimPoint: (point, targetEnemyId) =>
    set({
      aimPoint: point ? point.clone() : null,
      aimTargetEnemyId: targetEnemyId,
    }),

  setCameraState: (partial) =>
    set((state) => ({
      camera: {
        ...state.camera,
        ...partial,
      },
    })),

  setWeaponSwap: (weaponId) =>
    set((state) => ({
      input: {
        ...state.input,
        weaponSwap: weaponId,
      },
    })),

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

  completeObjective: (id) =>
    set((state) => {
      if (!state.currentObjective || state.currentObjective.id !== id) {
        return state;
      }

      return {
        currentObjective: {
          ...state.currentObjective,
          progressValue: state.currentObjective.targetValue,
          completed: true,
        },
      };
    }),

  grantRunPerk: (perkId) =>
    set((state) => {
      if (state.runPerks.includes(perkId)) {
        return {
          perkOptions: [],
          matchPhase: 'prewave' as MatchPhase,
        };
      }

      const nextRunPerks = [...state.runPerks, perkId];
      const perkConfig = RUN_PERK_CONFIG[perkId];
      const bonusHealth = perkConfig.modifiers.maxHealthBonus ?? 0;

      return {
        runPerks: nextRunPerks,
        perkOptions: [],
        matchPhase: 'prewave' as MatchPhase,
        maxHealth: state.maxHealth + bonusHealth,
        health: Math.min(state.maxHealth + bonusHealth, state.health + bonusHealth),
      };
    }),

  rollPerkOptions: () =>
    set((state) => {
      const available = RUN_PERK_POOL.filter((perkId) => !state.runPerks.includes(perkId));
      const options = randomPick(available.length > 0 ? available : RUN_PERK_POOL, 3);

      return {
        perkOptions: options,
        matchPhase: 'perk_select' as MatchPhase,
      };
    }),

  pushGameEvent: (event) =>
    set((state) => ({
      eventQueue: [
        ...state.eventQueue,
        {
          ...event,
          id: uuidv4(),
          timestamp: performance.now(),
        },
      ],
    })),

  consumeGameEvents: () => {
    const events = get().eventQueue;
    set({ eventQueue: [] });
    return events;
  },
}));
