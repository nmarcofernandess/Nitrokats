import type { PlayerId, PlayerInput, World } from '../core/model';
import type { GameRuntime } from '../runtime/GameRuntime';

export interface TestSnapshot {
  readonly tick: number;
  readonly phase: World['phase'];
  readonly players: readonly {
    readonly id: PlayerId;
    readonly position: Readonly<{ x: number; z: number }>;
    readonly hp: number;
    readonly status: World['players'][number]['status'];
    readonly catId: World['players'][number]['catId'];
    readonly weaponId: World['players'][number]['weaponId'];
  }[];
  readonly enemies: readonly {
    readonly id: string;
    readonly position: Readonly<{ x: number; z: number }>;
    readonly hp: number;
    readonly status: World['enemies'][number]['status'];
  }[];
  readonly projectiles: readonly {
    readonly id: string;
    readonly team: World['projectiles'][number]['team'];
    readonly position: Readonly<{ x: number; z: number }>;
  }[];
  readonly stageIndex: number;
  readonly encounter: Readonly<Pick<NonNullable<World['encounter']>, 'emitted' | 'defeated' | 'quota'>> | null;
  readonly colliders: readonly {
    readonly min: Readonly<{ x: number; z: number }>;
    readonly max: Readonly<{ x: number; z: number }>;
  }[];
  readonly metrics: Readonly<Record<string, number>>;
}

export interface TestBridge {
  setInput(slot: PlayerId, command: Partial<PlayerInput>): void;
  snapshot(): TestSnapshot;
}

export function createTestBridge(runtime: GameRuntime): TestBridge {
  return Object.freeze({
    setInput(slot: PlayerId, command: Partial<PlayerInput>) {
      runtime.setVirtualInput(slot, command);
    },
    snapshot: () => snapshotWorld(runtime.world),
  });
}

export function snapshotWorld(world: World): TestSnapshot {
  return {
    tick: world.tick,
    phase: world.phase,
    players: world.players.map(({ id, position, hp, status, catId, weaponId }) => ({
      id, position: { ...position }, hp, status, catId, weaponId,
    })),
    enemies: world.enemies.map(({ id, position, hp, status }) => ({ id, position: { ...position }, hp, status })),
    projectiles: world.projectiles.map(({ id, team, position }) => ({ id, team, position: { ...position } })),
    stageIndex: world.stageIndex,
    encounter: world.encounter ? {
      emitted: world.encounter.emitted,
      defeated: world.encounter.defeated,
      quota: world.encounter.quota,
    } : null,
    colliders: world.colliders.map(({ min, max }) => ({ min: { ...min }, max: { ...max } })),
    metrics: {},
  };
}
