import { createWorld } from '../../src/play/core/world';
import { stepWorld } from '../../src/play/core/step';
import type { InputFrame, PlayerId, PlayerInput, RunConfig, World } from '../../src/play/core/model';

export function makeWorld(patch: Partial<RunConfig> = {}): World {
  return createWorld({
    seed: 42,
    mode: 'training',
    difficulty: 'normal',
    players: [
      { id: 'p1', catId: 'anakin', weaponId: 'pulse_rifle' },
      { id: 'p2', catId: 'ivy', weaponId: 'pulse_rifle' },
    ],
    ...patch,
  });
}

export function player(world: World, id: PlayerId) {
  const found = world.players.find(candidate => candidate.id === id);
  if (!found) throw new Error(`Jogador ausente: ${id}`);
  return found;
}

export function input(patch: Partial<PlayerInput> = {}): PlayerInput {
  return {
    move: { x: 0, z: 0 },
    aim: { x: 0, z: 1 },
    fire: false,
    dash: false,
    revive: false,
    nextWeapon: false,
    ...patch,
  };
}

export function ticks(world: World, count: number, frame: InputFrame = {}): void {
  for (let index = 0; index < count; index += 1) stepWorld(world, frame);
}
