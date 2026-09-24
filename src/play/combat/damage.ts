import type { PlayerId, World } from '../core/model';
import { emitGameEvent } from '../core/events';

export interface DamageSource {
  team: 'players' | 'enemies';
  ownerId: string;
}

export interface DamageResult {
  applied: number;
  killed: boolean;
}

const NO_DAMAGE: DamageResult = { applied: 0, killed: false };

/** Applies direct HP damage only across opposing teams. There is no armor in the v1 contract. */
export function applyDamage(
  world: World,
  targetId: string,
  amount: number,
  source: DamageSource,
): DamageResult {
  if (!Number.isFinite(amount) || amount <= 0) return { ...NO_DAMAGE };

  if (source.team === 'players') {
    const target = world.enemies.find(enemy => enemy.id === targetId);
    if (!target || target.status !== 'alive' || !Number.isFinite(target.hp) || target.hp <= 0) {
      return { ...NO_DAMAGE };
    }
    const previousHp = target.hp;
    const applied = Math.min(previousHp, amount);
    target.hp = Math.max(0, previousHp - applied);
    const killed = previousHp > 0 && target.hp === 0;
    if (killed) target.status = 'dead';
    emitGameEvent(world, {
      type: 'hit', entityId: targetId, playerId: asPlayerId(source.ownerId), position: { ...target.position },
    });
    if (killed) {
      emitGameEvent(world, {
        type: 'enemy-killed', entityId: targetId, playerId: asPlayerId(source.ownerId),
        position: { ...target.position },
      });
    }
    return { applied, killed };
  }

  const target = world.players.find(player => player.id === targetId);
  if (!target || target.status !== 'active' || target.invulnerableSeconds > 0
    || !Number.isFinite(target.hp) || target.hp <= 0) {
    return { ...NO_DAMAGE };
  }
  const previousHp = target.hp;
  const applied = Math.min(previousHp, amount);
  target.hp = Math.max(0, previousHp - applied);
  const killed = previousHp > 0 && target.hp === 0;
  // Player HP reaching zero enters the separate down/revive lifecycle owned by T06.
  if (killed) target.status = 'down';
  emitGameEvent(world, {
    type: killed ? 'player-down' : 'hit', entityId: targetId,
    playerId: target.id, position: { ...target.position },
  });
  return { applied, killed };
}

function asPlayerId(ownerId: string): PlayerId | undefined {
  return ownerId === 'p1' || ownerId === 'p2' ? ownerId : undefined;
}
