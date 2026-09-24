import type { GameEvent, PlayerId, Vec2, World } from './model';

/** Appends a deterministic simulation event with a run-local monotonic sequence ID. */
export function emitGameEvent(
  world: World,
  event: Omit<GameEvent, 'id' | 'tick'> & { playerId?: PlayerId; position?: Vec2 },
): GameEvent {
  const created: GameEvent = { ...event, id: world.nextEntityId++, tick: world.tick };
  world.events = [...world.events, created];
  return created;
}
