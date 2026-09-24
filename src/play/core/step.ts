import type { GameEvent, InputFrame, World } from './model';

const FIXED_STEP_SECONDS = 1 / 60;

/** Advances the authoritative simulation by one fixed step while it is playing. */
export function stepWorld(world: World, input: InputFrame): readonly GameEvent[] {
  void input;
  if (world.phase !== 'playing') return world.events;
  world.tick += 1;
  world.elapsed = world.tick * FIXED_STEP_SECONDS;
  world.events = [];
  return world.events;
}
