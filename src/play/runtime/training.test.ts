import { describe, expect, it } from 'vitest';
import type { RunConfig } from '../core/model';
import { spawnEnemy } from '../core/world';
import { applyDamage } from '../combat/damage';
import { InputHub } from '../input/InputHub';
import type { InputHubOptions } from '../input/InputHub';
import { GameRuntime } from './GameRuntime';

const config: RunConfig = {
  seed: 18,
  mode: 'training',
  difficulty: 'normal',
  players: [
    { id: 'p1', catId: 'anakin', weaponId: 'pulse_rifle' },
    { id: 'p2', catId: 'maya', weaponId: 'pulse_rifle' },
  ],
};

describe('training runtime', () => {
  it('assists shared-keyboard aim toward the nearest visible target while firing', () => {
    const target = new EventTarget();
    const input = new InputHub({ eventTarget: target } satisfies InputHubOptions);
    input.assign('p1', { type: 'keyboard-shared', profile: 'p1' });
    const runtime = new GameRuntime({ ...config, players: config.players.slice(0, 1) }, input);
    spawnEnemy(runtime.world, { kind: 'runner', position: { x: 6, z: 0 }, hp: 100 });
    const event = new Event('keydown');
    Object.defineProperties(event, { code: { value: 'KeyF' }, repeat: { value: false } });
    target.dispatchEvent(event);

    runtime.advance(1 / 60);

    expect(runtime.world.projectiles.some((projectile) => projectile.ownerId === 'p1' && projectile.team === 'players')).toBe(true);
    expect(runtime.world.players[0].aim.x).toBeGreaterThan(0.9);
    runtime.dispose();
  });

  it('lets an optional partner bot fire at a target without attacking players', () => {
    const runtime = new GameRuntime(config, undefined, { trainingBot: true });
    spawnEnemy(runtime.world, { kind: 'runner', position: { x: 0, z: 6 }, hp: 100 });

    runtime.advance(1 / 60);

    expect(runtime.world.projectiles.some((projectile) => projectile.ownerId === 'p2' && projectile.team === 'players')).toBe(true);
    expect(runtime.world.projectiles.some((projectile) => projectile.team === 'enemies')).toBe(false);
    expect(runtime.world.players[0].hp).toBe(100);
    runtime.dispose();
  });

  it('only simulates a fall in training and resolves it through the combat damage rules', () => {
    const training = new GameRuntime(config);
    expect(applyDamage(training.world, 'p1', 20, { team: 'enemies', ownerId: 'training-target' }).applied).toBe(0);
    expect(training.simulateTrainingDown('p1')).toBe(true);
    expect(training.world.players[0]).toMatchObject({ hp: 0, status: 'down' });
    training.dispose();

    const campaign = new GameRuntime({ ...config, mode: 'campaign' });
    expect(campaign.simulateTrainingDown('p1')).toBe(false);
    expect(campaign.world.players[0]).toMatchObject({ hp: 100, status: 'active' });
    campaign.dispose();
  });
});
