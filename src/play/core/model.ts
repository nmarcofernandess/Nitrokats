export type PlayerId = 'p1' | 'p2';
export type CatId = 'anakin' | 'yang' | 'maya' | 'ivy';
export type WeaponId = 'pulse_rifle' | 'scatter_cannon' | 'arc_marksman';
export type Difficulty = 'relaxed' | 'normal';
export type EnemyKind = 'runner' | 'gunner' | 'brute' | 'mechacat';
export type PerkId = 'rapid_loader' | 'overcharge' | 'fortified' | 'vampiric_rounds' | 'stabilizer' | 'shockwave';
export type RunPhase = 'playing' | 'paused' | 'intermission' | 'won' | 'lost';
export type RunMode = 'training' | 'campaign';

export interface Vec2 {
  x: number;
  z: number;
}

export interface Aabb {
  min: Vec2;
  max: Vec2;
}

export interface PlayerInput {
  move: Vec2;
  aim: Vec2;
  fire: boolean;
  dash: boolean;
  revive: boolean;
  nextWeapon: boolean;
}

export type InputFrame = Partial<Record<PlayerId, PlayerInput>>;

export interface PlayerConfig {
  id: PlayerId;
  catId: CatId;
  weaponId: WeaponId;
}

export interface RunConfig {
  seed: number;
  mode: RunMode;
  difficulty: Difficulty;
  players: PlayerConfig[];
}

export interface PlayerState extends PlayerConfig {
  position: Vec2;
  velocity: Vec2;
  aim: Vec2;
  hp: number;
  maxHp: number;
  status: 'active' | 'down';
  shotCooldown: number;
  dashCooldown: number;
  dashRemaining: number;
  dashWasPressed: boolean;
  invulnerableSeconds: number;
  downSeconds: number;
  reviveProgress: number;
  perks: PerkId[];
}

export interface EnemyState {
  id: string;
  kind: EnemyKind;
  position: Vec2;
  hp: number;
  maxHp: number;
  status: 'alive' | 'dead';
}

export interface ProjectileState {
  id: string;
  ownerId: string;
  team: 'players' | 'enemies';
  position: Vec2;
  previousPosition: Vec2;
  velocity: Vec2;
  damage: number;
  lifeSeconds: number;
}

export interface GameEvent {
  id: number;
  tick: number;
  type: string;
  entityId?: string;
  playerId?: PlayerId;
  position?: Vec2;
}

export interface EncounterState {
  emittedEnemyIds: string[];
  quota: number;
  emitted: number;
  defeated: number;
  requiredBossId: string | null;
  progressSeconds: number;
}

export interface ObjectiveState {
  id: string;
  kind: 'eliminate' | 'defend' | 'boss';
  progress: number;
  target: number;
  complete: boolean;
}

export interface World {
  config: RunConfig;
  rngState: number;
  nextEntityId: number;
  tick: number;
  elapsed: number;
  phase: RunPhase;
  resumePhase: RunPhase | null;
  players: PlayerState[];
  colliders: Aabb[];
  bounds: Aabb;
  enemies: EnemyState[];
  projectiles: ProjectileState[];
  stageIndex: number;
  objective: ObjectiveState | null;
  encounter: EncounterState | null;
  perkOptions: PerkId[];
  events: readonly GameEvent[];
  result: 'won' | 'lost' | null;
}
