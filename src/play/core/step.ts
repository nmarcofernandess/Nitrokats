import type { GameEvent, InputFrame, World } from './model';
import { stepMovement } from '../movement/movement';
import { stepWeapons } from '../combat/weapons';
import { stepProjectiles } from '../combat/projectiles';

const FIXED_STEP_SECONDS = 1 / 60;

/** Advances the authoritative simulation by one fixed step while it is playing. */
export function stepWorld(world: World, input: InputFrame): readonly GameEvent[] {
  if (world.phase !== 'playing') return world.events;
  world.tick += 1;
  world.elapsed = world.tick * FIXED_STEP_SECONDS;
  world.events = [];
  stepMovement(world, input);
  stepWeapons(world, input);
  stepProjectiles(world);
  return world.events;
}

/** Appends a simulation event with a run-local monotonic ID for this tick. */
export { emitGameEvent } from './events';
