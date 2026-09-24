import type { InputFrame, PlayerState, World } from '../core/model';
import { emitGameEvent } from '../core/events';

const STEP_SECONDS = 1 / 60;
const MANUAL_REVIVE_SECONDS = 2;
const AUTO_REVIVE_SECONDS = 12;
const REVIVE_RANGE = 2.5;
const REVIVE_HP = 40;
const AUTO_REVIVE_HP = 30;
const REVIVE_INVULNERABILITY_SECONDS = 1.5;
const TIMER_EPSILON = 1e-9;

function tickTimer(seconds: number): number {
  const remaining = seconds - STEP_SECONDS;
  return remaining <= TIMER_EPSILON ? 0 : remaining;
}

function inRange(reviver: PlayerState, target: PlayerState): boolean {
  return Math.hypot(reviver.position.x - target.position.x, reviver.position.z - target.position.z)
    <= REVIVE_RANGE;
}

function revive(world: World, player: PlayerState, hp: number): void {
  player.status = 'active';
  player.hp = hp;
  player.downSeconds = 0;
  player.reviveProgress = 0;
  player.invulnerableSeconds = REVIVE_INVULNERABILITY_SECONDS;
  emitGameEvent(world, {
    type: 'player-revived', entityId: player.id, playerId: player.id, position: { ...player.position },
  });
}

/** Advances down, manual-revive, and temporary invulnerability timers by one simulation tick. */
export function stepRevive(world: World, input: InputFrame): void {
  if (world.phase !== 'playing') return;

  for (const player of world.players) {
    if (player.status === 'active' && player.invulnerableSeconds > 0) {
      player.invulnerableSeconds = tickTimer(player.invulnerableSeconds);
    }
  }

  for (const target of world.players) {
    if (target.status !== 'down') continue;
    target.downSeconds += STEP_SECONDS;

    let reviving = false;
    for (const ally of world.players) {
      if (ally.id === target.id || ally.status !== 'active') continue;
      if (input[ally.id]?.revive !== true || !inRange(ally, target)) continue;
      reviving = true;
      break;
    }

    if (reviving) {
      target.reviveProgress += STEP_SECONDS;
      if (target.reviveProgress + TIMER_EPSILON >= MANUAL_REVIVE_SECONDS) {
        revive(world, target, REVIVE_HP);
        continue;
      }
    } else {
      target.reviveProgress = 0;
    }

    if (target.downSeconds + TIMER_EPSILON >= AUTO_REVIVE_SECONDS
      && world.players.some(ally => ally.id !== target.id && ally.status === 'active')) {
      revive(world, target, AUTO_REVIVE_HP);
    }
  }
}

/** Ends the run only after damage and all eligible revives for this tick have resolved. */
export function resolveRunOutcome(world: World): void {
  if (world.phase !== 'playing') return;
  if (world.players.some(player => player.status === 'active')) return;

  world.phase = 'lost';
  world.result = 'lost';
  emitGameEvent(world, { type: 'run-ended' });
}
