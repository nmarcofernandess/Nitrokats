import type { GameEvent, InputFrame, PlayerId, PlayerInput, RunConfig, Vec2, World } from '../core/model';
import { createClock, type SimulationClock } from '../core/clock';
import { pauseWorld, resumeWorld } from '../core/lifecycle';
import { stepWorld } from '../core/step';
import { createWorld } from '../core/world';
import { applyDamage } from '../combat/damage';
import type { DeviceBinding } from '../input/bindings';
import type { MenuCommand } from '../input/bindings';

export type InputProvider = (() => InputFrame) & { clear: () => void };

export interface RuntimeInputHub {
  poll(): void;
  consumeFrame(): InputFrame;
  consumeMenuCommands(): Partial<Record<PlayerId, MenuCommand>>;
  clear(): void;
  dispose?(): void;
  setPauseHandler(handler: (reason: 'device-disconnected' | 'focus-lost') => void): void;
  confirmResume(): boolean;
  getBinding?(slot: PlayerId): DeviceBinding | null;
  setVirtualInput?(slot: PlayerId, command: Partial<PlayerInput>): void;
}

type RuntimeInput = InputProvider | RuntimeInputHub;

export interface GameRuntimeOptions {
  trainingBot?: boolean;
}

const emptyInput: InputProvider = Object.assign(() => ({}), { clear: () => undefined });

function cloneRunConfig(config: RunConfig): RunConfig {
  return { ...config, players: config.players.map(player => ({ ...player })) };
}

export class GameRuntime {
  world: World;
  private readonly inputProvider: RuntimeInput;
  private readonly clock: SimulationClock;
  private runConfig: RunConfig;
  private disposed = false;
  private readonly trainingBot: boolean;
  private currentEventBatches: readonly (readonly GameEvent[])[] = Object.freeze([]);

  constructor(config: RunConfig, inputProvider: RuntimeInput = emptyInput, options: GameRuntimeOptions = {}) {
    this.world = createWorld(config);
    this.runConfig = cloneRunConfig(config);
    this.inputProvider = inputProvider;
    this.trainingBot = options.trainingBot === true && config.mode === 'training' && config.players.some((player) => player.id === 'p2');
    if (typeof inputProvider !== 'function') inputProvider.setPauseHandler(() => this.pause());
    this.clock = createClock(() => {
      if (this.disposed || this.world.phase !== 'playing') return;
      const tickEvents = stepWorld(this.world, this.readInputFrame());
      this.currentEventBatches = Object.freeze([
        ...this.currentEventBatches,
        Object.freeze([...tickEvents]),
      ]);
    });
  }

  get eventBatches(): readonly (readonly GameEvent[])[] {
    return this.currentEventBatches;
  }

  start(config: RunConfig): void {
    if (this.disposed) return;
    this.world = createWorld(config);
    this.runConfig = cloneRunConfig(config);
    this.clock.reset();
    this.inputProvider.clear();
    this.currentEventBatches = Object.freeze([]);
  }

  advance(seconds: number): void {
    if (this.disposed) return;
    if (typeof this.inputProvider !== 'function') this.inputProvider.poll();
    if (this.world.phase !== 'playing') {
      this.clock.reset();
      return;
    }
    this.currentEventBatches = Object.freeze([]);
    this.clock.advance(seconds);
    if (this.world.phase !== 'playing') this.clock.reset();
  }

  pause(): void {
    if (this.disposed) return;
    pauseWorld(this.world);
    this.clock.reset();
    this.inputProvider.clear();
  }

  resume(): void {
    if (this.disposed || this.world.phase !== 'paused') return;
    if (typeof this.inputProvider !== 'function' && !this.inputProvider.confirmResume()) return;
    resumeWorld(this.world);
    this.clock.reset();
  }

  restart(): void {
    this.start(this.runConfig);
  }

  setVirtualInput(slot: PlayerId, command: Partial<PlayerInput>): void {
    if (this.disposed || typeof this.inputProvider === 'function' || !this.inputProvider.setVirtualInput) return;
    this.inputProvider.setVirtualInput(slot, command);
  }

  /** A visible training-only tutorial action, routed through the combat damage rules. */
  simulateTrainingDown(playerId: PlayerId = 'p1'): boolean {
    if (this.disposed || this.world.config.mode !== 'training' || this.world.phase !== 'playing') return false;
    const player = this.world.players.find((candidate) => candidate.id === playerId);
    if (!player || player.status !== 'active') return false;
    applyDamage(this.world, playerId, player.hp, { team: 'enemies', ownerId: 'training-tutorial' });
    return player.hp === 0;
  }

  dispose(): void {
    if (this.disposed) return;
    this.pause();
    if (typeof this.inputProvider !== 'function') this.inputProvider.dispose?.();
    this.currentEventBatches = Object.freeze([]);
    this.disposed = true;
  }

  /** Read by menus only; this command channel never enters stepWorld. */
  get menuCommands(): Partial<Record<PlayerId, MenuCommand>> {
    return typeof this.inputProvider === 'function' ? {} : this.inputProvider.consumeMenuCommands();
  }

  private readInputFrame(): InputFrame {
    const frame: InputFrame = typeof this.inputProvider === 'function'
      ? this.inputProvider()
      : this.inputProvider.consumeFrame();
    const result: InputFrame = { ...frame };
    if (typeof this.inputProvider !== 'function') {
      for (const player of this.world.players) {
        const binding = this.inputProvider.getBinding?.(player.id);
        const command = result[player.id];
        if (binding?.type !== 'keyboard-shared' || !command || Math.hypot(command.aim.x, command.aim.z) > 1e-6) continue;
        const aim = nearestVisibleAim(this.world, player.position) ?? player.aim;
        result[player.id] = { ...command, aim: { ...aim } };
      }
    }
    if (this.trainingBot) {
      const partner = this.world.players.find((player) => player.id === 'p2');
      if (partner?.status === 'active') {
        const aim = nearestVisibleAim(this.world, partner.position) ?? partner.aim;
        result.p2 = {
          move: { x: 0, z: 0 }, aim: { ...aim }, fire: true,
          dash: false, revive: false, nextWeapon: false,
        };
      }
    }
    return result;
  }
}

function nearestVisibleAim(world: World, origin: Vec2): Vec2 | null {
  const candidates = world.enemies
    .filter((enemy) => enemy.status === 'alive' && enemy.hp > 0)
    .map((enemy) => ({ enemy, distanceSquared: (enemy.position.x - origin.x) ** 2 + (enemy.position.z - origin.z) ** 2 }))
    .sort((left, right) => left.distanceSquared - right.distanceSquared || left.enemy.id.localeCompare(right.enemy.id));
  for (const { enemy } of candidates) {
    if (world.colliders.some((collider) => segmentIntersectsBox(origin, enemy.position, collider))) continue;
    const x = enemy.position.x - origin.x;
    const z = enemy.position.z - origin.z;
    const length = Math.hypot(x, z);
    if (length > 0) return { x: x / length, z: z / length };
  }
  return null;
}

function segmentIntersectsBox(start: Vec2, end: Vec2, box: World['colliders'][number]): boolean {
  let near = 0;
  let far = 1;
  for (const [origin, delta, min, max] of [
    [start.x, end.x - start.x, box.min.x, box.max.x],
    [start.z, end.z - start.z, box.min.z, box.max.z],
  ]) {
    if (Math.abs(delta) < 1e-12) {
      if (origin < min || origin > max) return false;
      continue;
    }
    let axisNear = (min - origin) / delta;
    let axisFar = (max - origin) / delta;
    if (axisNear > axisFar) [axisNear, axisFar] = [axisFar, axisNear];
    near = Math.max(near, axisNear);
    far = Math.min(far, axisFar);
    if (near > far) return false;
  }
  return far >= 0 && near < 1;
}
