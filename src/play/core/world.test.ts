import type { PlayerConfig, RunConfig } from './model';
import { describe, expect, it } from 'vitest';
import { input, makeWorld, player, ticks } from '../../../tests/fixtures/world';
import { nextRandom } from './rng';
import { createWorld, spawnEnemy } from './world';

describe('mundo isolado', () => {
  it('não compartilha vida nem arrays entre jogadores/runs', () => {
    const a = makeWorld();
    const b = makeWorld();
    player(a, 'p1').hp = 3;
    expect(player(a, 'p2').hp).toBe(100);
    expect(player(b, 'p1').hp).toBe(100);
    expect(a.players).not.toBe(b.players);
    expect(a.players[0]).not.toBe(b.players[0]);
    expect(a.players[0].position).not.toBe(b.players[0].position);
    expect(a.config.players).not.toBe(b.config.players);
    expect(a.players[0].perks).not.toBe(b.players[0].perks);
    expect(a.enemies).not.toBe(b.enemies);
    expect(a.projectiles).not.toBe(b.projectiles);
  });

  it('repete a mesma sequência de RNG com a mesma seed', () => {
    const a = makeWorld({ seed: 123 });
    const b = makeWorld({ seed: 123 });
    expect(Array.from({ length: 20 }, () => nextRandom(a)))
      .toEqual(Array.from({ length: 20 }, () => nextRandom(b)));
  });

  it.each([
    { name: 'zero', players: [] as PlayerConfig[] },
    { name: 'três', players: [
      { id: 'p1', catId: 'anakin', weaponId: 'pulse_rifle' },
      { id: 'p2', catId: 'ivy', weaponId: 'pulse_rifle' },
      { id: 'p1', catId: 'maya', weaponId: 'arc_marksman' },
    ] as PlayerConfig[] },
  ])('rejeita configuração com $name jogadores', ({ players }) => {
    expect(() => createWorld({ seed: 1, mode: 'training', difficulty: 'normal', players }))
      .toThrow(/1 ou 2 jogadores/);
  });

  it('rejeita PlayerId inválido recebido na fronteira runtime', () => {
    const config: unknown = {
      seed: 1,
      mode: 'training',
      difficulty: 'normal',
      players: [{ id: 'p3', catId: 'anakin', weaponId: 'pulse_rifle' }],
    };
    expect(() => createWorld(config as RunConfig)).toThrow(/ID de jogador inválido/);
  });

  it('rejeita jogadores duplicados, catálogo desconhecido e seed inválida', () => {
    const duplicate = [
      { id: 'p1' as const, catId: 'anakin' as const, weaponId: 'pulse_rifle' as const },
      { id: 'p1' as const, catId: 'ivy' as const, weaponId: 'pulse_rifle' as const },
    ];
    expect(() => createWorld({ seed: 1, mode: 'training', difficulty: 'normal', players: duplicate }))
      .toThrow(/ID de jogador duplicado/);
    expect(() => makeWorld({ seed: Number.NaN })).toThrow(/seed deve ser finita/);
    expect(() => makeWorld({ seed: Infinity })).toThrow(/seed deve ser finita/);
    expect(() => createWorld({ seed: 1, mode: 'training', difficulty: 'normal', players: [
      { id: 'p1', catId: 'unknown', weaponId: 'pulse_rifle' },
    ] as never })).toThrow(/catálogo/);
    expect(() => createWorld({ seed: 1, mode: 'training', difficulty: 'normal', players: [
      { id: 'p1', catId: 'anakin', weaponId: 'unknown' },
    ] as never })).toThrow(/catálogo/);
  });

  it('cria inimigos com IDs monotônicos e avança exatamente um tick em playing', () => {
    const w = makeWorld();
    const first = spawnEnemy(w, { kind: 'runner', position: { x: 1, z: 2 }, hp: 10 });
    const second = spawnEnemy(w, { kind: 'brute', position: { x: 3, z: 4 }, hp: 50 });
    expect(first).toBe('e:1');
    expect(second).toBe('e:2');
    expect(w.enemies.map(enemy => enemy.id)).toEqual([first, second]);
    w.enemies[0].position.x = 99;
    expect(w.enemies[1].position.x).toBe(3);
    ticks(w, 60, { p1: input() });
    expect(w.tick).toBe(60);
    expect(w.elapsed).toBeCloseTo(1);
    w.phase = 'paused';
    ticks(w, 10);
    expect(w.tick).toBe(60);
    expect(w.elapsed).toBeCloseTo(1);
  });
});
