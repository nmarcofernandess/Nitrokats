import type { GameEvent, InputFrame, PlayerId, Vec2, World } from './model';
import { stepMovement } from '../movement/movement';

const FIXED_STEP_SECONDS = 1 / 60;

/** Advances the authoritative simulation by one fixed step while it is playing. */
export function stepWorld(world: World, input: InputFrame): readonly GameEvent[] {
  if (world.phase !== 'playing') return world.events;
  world.tick += 1;
  world.elapsed = world.tick * FIXED_STEP_SECONDS;
  world.events = [];
  stepMovement(world, input);
  return world.events;
}

/** Appends a simulation event with a run-local monotonic ID for this tick. */
export function emitGameEvent(
  world: World,
  event: Omit<GameEvent, 'id' | 'tick'> & { playerId?: PlayerId; position?: Vec2 },
): GameEvent {
  const created: GameEvent = { ...event, id: world.nextEntityId++, tick: world.tick };
  world.events = [...world.events, created];
  return created;
}
