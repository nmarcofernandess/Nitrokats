import type { GameEvent, InputFrame, RunConfig, World } from '../core/model';
import { createClock, type SimulationClock } from '../core/clock';
import { pauseWorld, resumeWorld } from '../core/lifecycle';
import { stepWorld } from '../core/step';
import { createWorld } from '../core/world';

export type InputProvider = (() => InputFrame) & { clear: () => void };

const emptyInput: InputProvider = Object.assign(() => ({}), { clear: () => undefined });

export class GameRuntime {
  world: World;
  private readonly inputProvider: InputProvider;
  private readonly clock: SimulationClock;
  private runConfig: RunConfig;
  private disposed = false;
  private currentEventBatches: readonly (readonly GameEvent[])[] = Object.freeze([]);

  constructor(config: RunConfig, inputProvider: InputProvider = emptyInput) {
    this.world = createWorld(config);
    this.runConfig = this.world.config;
    this.inputProvider = inputProvider;
    this.clock = createClock(() => {
      if (this.disposed || this.world.phase !== 'playing') return;
      const tickEvents = stepWorld(this.world, this.inputProvider());
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
    this.runConfig = this.world.config;
    this.clock.reset();
    this.inputProvider.clear();
    this.currentEventBatches = Object.freeze([]);
  }

  advance(seconds: number): void {
    if (this.disposed || this.world.phase !== 'playing') return;
    this.currentEventBatches = Object.freeze([]);
    this.clock.advance(seconds);
  }

  pause(): void {
    if (this.disposed) return;
    pauseWorld(this.world);
    this.clock.reset();
    this.inputProvider.clear();
  }

  resume(): void {
    if (this.disposed) return;
    resumeWorld(this.world);
    this.clock.reset();
  }

  restart(): void {
    this.start(this.runConfig);
  }

  dispose(): void {
    if (this.disposed) return;
    this.pause();
    this.currentEventBatches = Object.freeze([]);
    this.disposed = true;
  }
}
