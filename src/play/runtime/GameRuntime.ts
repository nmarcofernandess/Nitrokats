import type { GameEvent, InputFrame, PlayerId, RunConfig, World } from '../core/model';
import { createClock, type SimulationClock } from '../core/clock';
import { pauseWorld, resumeWorld } from '../core/lifecycle';
import { stepWorld } from '../core/step';
import { createWorld } from '../core/world';
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
}

type RuntimeInput = InputProvider | RuntimeInputHub;

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
  private currentEventBatches: readonly (readonly GameEvent[])[] = Object.freeze([]);

  constructor(config: RunConfig, inputProvider: RuntimeInput = emptyInput) {
    this.world = createWorld(config);
    this.runConfig = cloneRunConfig(config);
    this.inputProvider = inputProvider;
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
    return typeof this.inputProvider === 'function'
      ? this.inputProvider()
      : this.inputProvider.consumeFrame();
  }
}
