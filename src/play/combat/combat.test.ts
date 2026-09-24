import { describe, expect, it } from 'vitest';
import { applyDamage } from './damage';
import { stepProjectiles } from './projectiles';
import { stepWeapons } from './weapons';
import { spawnEnemy } from '../core/world';
import { makeWorld, input, player, ticks } from '../../../tests/fixtures/world';

const owner = { team: 'players' as const, ownerId: 'p1' };

describe('combate autoritativo', () => {
  it('não causa friendly fire nem credita uma morte duas vezes', () => {
    const w = makeWorld();
    expect(applyDamage(w, 'p2', 40, owner).applied).toBe(0);
    expect(player(w, 'p2').hp).toBe(100);
    const id = spawnEnemy(w, { kind: 'runner', position: { x: 0, z: 4 }, hp: 10 });
    expect(applyDamage(w, id, 50, owner)).toEqual({ applied: 10, killed: true });
    expect(applyDamage(w, id, 50, owner)).toEqual({ applied: 0, killed: false });
    expect(w.events.filter(event => event.type === 'enemy-killed')).toHaveLength(1);
  });

  it('aplica regras de time, vida finita, queda e alvo morto', () => {
    const w = makeWorld();
    const enemy = spawnEnemy(w, { kind: 'runner', position: { x: 0, z: 3 }, hp: 10 });
    expect(applyDamage(w, enemy, 5, { team: 'enemies', ownerId: 'e:other' }))
      .toEqual({ applied: 0, killed: false });
    player(w, 'p2').status = 'down';
    expect(applyDamage(w, 'p2', 20, { team: 'enemies', ownerId: enemy }))
      .toEqual({ applied: 0, killed: false });
    expect(applyDamage(w, 'missing', 20, owner)).toEqual({ applied: 0, killed: false });
    expect(applyDamage(w, enemy, Number.NaN, owner)).toEqual({ applied: 0, killed: false });
    w.enemies.find(candidate => candidate.id === enemy)!.hp = Number.NaN;
    expect(applyDamage(w, enemy, 10, owner)).toEqual({ applied: 0, killed: false });
    expect(Number.isNaN(w.enemies.find(candidate => candidate.id === enemy)!.hp)).toBe(true);

    const downed = makeWorld();
    expect(applyDamage(downed, 'p1', 500, { team: 'enemies', ownerId: 'e:runner' }))
      .toEqual({ applied: 100, killed: true });
    expect(player(downed, 'p1').status).toBe('down');
    expect(applyDamage(downed, 'p1', 500, { team: 'enemies', ownerId: 'e:runner' }))
      .toEqual({ applied: 0, killed: false });
  });

  it('usa intervalos, dispersões e contagem de projéteis distintos por arma', () => {
    for (const [weaponId, count, firstInterval, damage] of [
      ['pulse_rifle', 1, 0.12, 16],
      ['scatter_cannon', 6, 0.45, 12],
      ['arc_marksman', 1, 0.78, 48],
    ] as const) {
      const w = makeWorld({ players: [{ id: 'p1', catId: 'anakin', weaponId }] });
      stepWeapons(w, { p1: input({ fire: true }) });
      expect(w.projectiles).toHaveLength(count);
      expect(w.projectiles.every(projectile => projectile.damage === damage)).toBe(true);
      expect(player(w, 'p1').shotCooldown).toBe(firstInterval);
    }
  });

  it('isola cooldown por jogador e troca a arma sem zerar o cooldown', () => {
    const w = makeWorld();
    stepWeapons(w, { p1: input({ fire: true }), p2: input({ fire: true }) });
    expect(player(w, 'p1').shotCooldown).toBeCloseTo(0.12);
    expect(player(w, 'p2').shotCooldown).toBeCloseTo(0.12);
    for (let i = 0; i < 5; i += 1) stepWeapons(w, { p1: input({ nextWeapon: true }) });
    expect(player(w, 'p1').weaponId).toBe('scatter_cannon');
    expect(player(w, 'p1').shotCooldown).toBeCloseTo(0.12 - 5 / 60);
    expect(player(w, 'p2').weaponId).toBe('pulse_rifle');
    expect(w.projectiles).toHaveLength(2);
  });

  it('spawna no cano lógico, mira normalizada e acerta no primeiro tick sem atravessar alvo', () => {
    const w = makeWorld({ players: [{ id: 'p1', catId: 'anakin', weaponId: 'arc_marksman' }] });
    player(w, 'p1').position = { x: 0, z: 0 };
    player(w, 'p1').aim = { x: 0, z: 2 };
    const enemy = spawnEnemy(w, { kind: 'runner', position: { x: 0, z: 2.3 }, hp: 48 });
    stepWeapons(w, { p1: input({ fire: true, aim: { x: 0, z: 2 } }) });
    expect(w.projectiles[0].position).toEqual({ x: 0, z: 0.9 });
    expect(Math.hypot(w.projectiles[0].velocity.x, w.projectiles[0].velocity.z)).toBeCloseTo(44, 6);
    expect(Math.abs(Math.atan2(w.projectiles[0].velocity.x, w.projectiles[0].velocity.z))).toBeLessThanOrEqual(0.01);
    stepProjectiles(w);
    expect(w.projectiles).toHaveLength(0);
    expect(w.enemies.find(candidate => candidate.id === enemy)?.hp).toBe(0);
  });

  it('usa swept collision em tiro rápido, resolve círculo e parede ganha empate de alvo', () => {
    const w = makeWorld();
    const enemy = spawnEnemy(w, { kind: 'runner', position: { x: 0, z: 4 }, hp: 100 });
    w.projectiles.push({ id: 'b:test', ownerId: 'p1', team: 'players', position: { x: 0, z: 0 },
      previousPosition: { x: 0, z: 0 }, velocity: { x: 0, z: 240 }, damage: 10, lifeSeconds: 1 });
    stepProjectiles(w);
    expect(w.enemies.find(candidate => candidate.id === enemy)?.hp).toBe(90);
    expect(w.projectiles).toHaveLength(0);

    const tie = makeWorld();
    const tiedEnemy = spawnEnemy(tie, { kind: 'runner', position: { x: 0, z: 2 }, hp: 100 });
    tie.colliders.push({ min: { x: -1, z: 1 }, max: { x: 1, z: 1 } });
    tie.projectiles.push({ id: 'b:tie', ownerId: 'p1', team: 'players', position: { x: 0, z: 0 },
      previousPosition: { x: 0, z: 0 }, velocity: { x: 0, z: 120 }, damage: 10, lifeSeconds: 1 });
    stepProjectiles(tie);
    expect(tie.enemies.find(candidate => candidate.id === tiedEnemy)?.hp).toBe(100);
  });

  it('usa AABB de cenário como bloqueio antes do alvo', () => {
    const w = makeWorld();
    const enemy = spawnEnemy(w, { kind: 'runner', position: { x: 0, z: 4 }, hp: 100 });
    w.colliders.push({ min: { x: -1, z: 1.5 }, max: { x: 1, z: 1.6 } });
    w.projectiles.push({ id: 'b:wall', ownerId: 'p1', team: 'players', position: { x: 0, z: 0 },
      previousPosition: { x: 0, z: 0 }, velocity: { x: 0, z: 300 }, damage: 10, lifeSeconds: 1 });
    stepProjectiles(w);
    expect(w.enemies.find(candidate => candidate.id === enemy)?.hp).toBe(100);
  });

  it('ordena alvos simultâneos por ID estável, mesmo com array em ordem inversa', () => {
    const w = makeWorld();
    const first = spawnEnemy(w, { kind: 'runner', position: { x: 0, z: 3 }, hp: 100 });
    const second = spawnEnemy(w, { kind: 'runner', position: { x: 0, z: 3 }, hp: 100 });
    w.enemies.reverse();
    w.projectiles.push({ id: 'b:stable', ownerId: 'p1', team: 'players', position: { x: 0, z: 0 },
      previousPosition: { x: 0, z: 0 }, velocity: { x: 0, z: 240 }, damage: 10, lifeSeconds: 1 });
    stepProjectiles(w);
    expect(w.enemies.find(candidate => candidate.id === first)?.hp).toBe(90);
    expect(w.enemies.find(candidate => candidate.id === second)?.hp).toBe(100);
  });

  it('integra disparo e colisão no mesmo tick autoritativo', () => {
    const w = makeWorld({ players: [{ id: 'p1', catId: 'anakin', weaponId: 'arc_marksman' }] });
    player(w, 'p1').position = { x: 0, z: 0 };
    const enemy = spawnEnemy(w, { kind: 'runner', position: { x: 0, z: 1.9 }, hp: 48 });
    ticks(w, 1, { p1: input({ fire: true, aim: { x: 0, z: 1 } }) });
    expect(w.tick).toBe(1);
    expect(w.projectiles).toHaveLength(0);
    expect(w.enemies.find(candidate => candidate.id === enemy)?.status).toBe('dead');
    expect(w.events.some(event => event.type === 'enemy-killed' && event.entityId === enemy)).toBe(true);
  });

  it('expira TTL, congela em pausa e limita pool com contador de saturação', () => {
    const w = makeWorld();
    w.projectiles.push({ id: 'b:ttl', ownerId: 'p1', team: 'players', position: { x: 0, z: 0 },
      previousPosition: { x: 0, z: 0 }, velocity: { x: 1, z: 0 }, damage: 1, lifeSeconds: 1 / 60 });
    stepProjectiles(w);
    expect(w.projectiles).toHaveLength(0);

    w.phase = 'paused';
    player(w, 'p1').shotCooldown = 0.5;
    const pausedTick = w.tick;
    const paused = { id: 'b:paused', ownerId: 'p1', team: 'players' as const, position: { x: 0, z: 0 },
      previousPosition: { x: 0, z: 0 }, velocity: { x: 100, z: 0 }, damage: 1, lifeSeconds: 1 };
    w.projectiles.push(paused);
    ticks(w, 1, { p1: input({ fire: true }) });
    stepProjectiles(w);
    expect(w.tick).toBe(pausedTick);
    expect(player(w, 'p1').shotCooldown).toBe(0.5);
    expect(w.projectiles[0]).toEqual(paused);
    expect(w.projectiles).toHaveLength(1);

    const full = makeWorld();
    player(full, 'p1').shotCooldown = 0;
    stepWeapons(full, { p1: input({ fire: true }) });
    // Fill with accepted bounded state, then verify explicit rejection.
    while (full.projectiles.length < 256) full.projectiles.push({ ...full.projectiles[0], id: `b:fill:${full.projectiles.length}` });
    expect(stepWeapons(full, { p1: input({ fire: false, nextWeapon: false }) })).toBeUndefined();
    expect(full.projectiles.length).toBe(256);
    full.events = [];
    player(full, 'p1').shotCooldown = 0;
    stepWeapons(full, { p1: input({ fire: true }) });
    expect(full.projectiles.length).toBe(256);
    expect(full.projectileSaturationCount).toBeGreaterThan(0);
    expect(full.events.filter(event => event.type === 'shot')).toHaveLength(0);
    expect(player(full, 'p1').shotCooldown).toBe(0);
  });
});
