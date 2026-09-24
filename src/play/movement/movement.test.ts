import { describe, expect, it } from 'vitest';
import { sweepCircleAabb } from './collision';
import { makeWorld, input, player, ticks } from '../../../tests/fixtures/world';
import type { Aabb, InputFrame } from '../core/model';

const box: Aabb = { min: { x: 2, z: -2 }, max: { x: 2.2, z: 2 } };

describe('movimento autoritativo dos jogadores', () => {
  it('normaliza diagonais e não move o parceiro', () => {
    const a = makeWorld();
    const b = makeWorld();
    player(a, 'p1').position = { x: 0, z: 0 };
    player(b, 'p1').position = { x: 0, z: 0 };
    const p2 = { ...player(a, 'p2').position };
    ticks(a, 60, { p1: input({ move: { x: 1, z: 0 } }) });
    ticks(b, 60, { p1: input({ move: { x: 1, z: 1 } }) });
    const distance = (world: typeof a) => Math.hypot(player(world, 'p1').position.x, player(world, 'p1').position.z);
    expect(distance(a)).toBeCloseTo(distance(b), 3);
    expect(player(a, 'p2').position).toEqual(p2);
  });

  it('não bloqueia um jogador quando os aliados atravessam a mesma área', () => {
    const world = makeWorld();
    player(world, 'p1').position = { x: -3, z: 0 };
    player(world, 'p2').position = { x: 0, z: 0 };
    ticks(world, 60, { p1: input({ move: { x: 1, z: 0 } }) });
    expect(player(world, 'p1').position.x).toBeGreaterThan(2);
    expect(player(world, 'p2').position).toEqual({ x: 0, z: 0 });
  });

  it('repete a evolução lógica com seed e sequência de frames iguais', () => {
    const a = makeWorld({ seed: 8675309 });
    const b = makeWorld({ seed: 8675309 });
    const frames: InputFrame[] = Array.from({ length: 120 }, (_, tick) => ({
      p1: input({ move: { x: tick < 50 ? 1 : 0, z: tick >= 50 ? -1 : 0 }, dash: tick >= 8 && tick < 30 }),
      p2: input({ move: { x: tick < 60 ? -0.5 : 0.25, z: 0.75 }, dash: tick === 40 }),
    }));
    for (const frame of frames) {
      ticks(a, 1, frame);
      ticks(b, 1, frame);
    }
    expect({ players: a.players, tick: a.tick, elapsed: a.elapsed, rngState: a.rngState })
      .toEqual({ players: b.players, tick: b.tick, elapsed: b.elapsed, rngState: b.rngState });
  });

  it('varre um círculo sem atravessar uma caixa fina', () => {
    expect(sweepCircleAabb({ x: 0, z: 0 }, { x: 4, z: 0 }, 0.85, box)).toBeCloseTo(1.15 / 4, 5);
  });

  it('usa a curva real do canto em vez de inflar a caixa em quadrado', () => {
    const cornerBox: Aabb = { min: { x: 0, z: 0 }, max: { x: 1, z: 1 } };
    expect(sweepCircleAabb({ x: -2, z: -2 }, { x: -1.7, z: -1.7 }, 1, cornerBox)).toBeNull();
    expect(sweepCircleAabb({ x: -1, z: 2 }, { x: 2, z: -1 }, 1, cornerBox)).not.toBeNull();
  });

  it('limita velocidade máxima e não produz NaN com input inválido', () => {
    const world = makeWorld();
    ticks(world, 60, { p1: input({ move: { x: Number.NaN, z: Number.POSITIVE_INFINITY } }) });
    expect(Number.isFinite(player(world, 'p1').position.x)).toBe(true);
    expect(Number.isFinite(player(world, 'p1').position.z)).toBe(true);
    expect(player(world, 'p1').position).toEqual({ x: -1, z: 0 });
  });

  it('usa aceleração de 40 m/s² e limita a velocidade a 8 m/s', () => {
    const world = makeWorld();
    ticks(world, 1, { p1: input({ move: { x: 1, z: 0 } }) });
    expect(player(world, 'p1').velocity.x).toBeCloseTo(40 / 60, 8);
    expect(player(world, 'p1').position.x).toBeCloseTo(-1 + 40 / 3600, 8);
    ticks(world, 59, { p1: input({ move: { x: 1, z: 0 } }) });
    expect(player(world, 'p1').velocity.x).toBe(8);
  });

  it('permite que um jogador caído se arraste a 1,5 m/s sem usar dash', () => {
    const world = makeWorld();
    const downed = player(world, 'p1');
    downed.position = { x: 0, z: 0 };
    downed.status = 'down';
    ticks(world, 60, { p1: input({ move: { x: 1, z: 0 }, dash: true }) });
    expect(downed.position.x).toBeCloseTo(1.5, 6);
    expect(downed.velocity.x).toBe(1.5);
    expect(downed.dashRemaining).toBe(0);
  });

  it('limita o centro do círculo aos limites configurados', () => {
    const world = makeWorld();
    world.bounds = { min: { x: -2, z: -2 }, max: { x: 2, z: 2 } };
    ticks(world, 60, { p1: input({ move: { x: -1, z: 0 } }) });
    expect(player(world, 'p1').position.x).toBeCloseTo(-2 + 0.85, 7);
    expect(player(world, 'p1').velocity.x).toBe(0);
  });

  it('para antes da parede e desliza pelo componente tangencial', () => {
    const world = makeWorld();
    world.colliders.push(box);
    player(world, 'p1').position = { x: 0, z: -1 };
    for (let tick = 0; tick < 90; tick += 1) {
      ticks(world, 1, { p1: input({ move: { x: 1, z: 1 } }) });
      if (player(world, 'p1').position.z <= box.max.z) {
        expect(player(world, 'p1').position.x).toBeLessThanOrEqual(2 - 0.85 + 0.01);
      }
    }
    expect(player(world, 'p1').position.z).toBeGreaterThan(0);
  });

  it('dash só ativa na borda e não atravessa paredes', () => {
    const world = makeWorld();
    world.colliders.push(box);
    player(world, 'p1').position = { x: 0, z: 0 };
    ticks(world, 3, { p1: input({ move: { x: 1, z: 0 }, dash: true }) });
    const afterDash = player(world, 'p1').position.x;
    expect(afterDash).toBeLessThan(2 - 0.85);
    expect(afterDash).toBeGreaterThan(0.8);
    ticks(world, 30, { p1: input({ move: { x: 1, z: 0 }, dash: true }) });
    expect(player(world, 'p1').position.x - afterDash).toBeLessThan(3);
  });

  it('recusa uma nova borda antes de expirar o cooldown de 1,4 s', () => {
    const world = makeWorld();
    player(world, 'p1').position = { x: 0, z: 0 };
    ticks(world, 1, { p1: input({ dash: true }) });
    ticks(world, 8, { p1: input({ dash: false }) });
    expect(player(world, 'p1').dashRemaining).toBe(0);
    ticks(world, 1, { p1: input({ dash: true }) });
    expect(player(world, 'p1').dashRemaining).toBe(0);
    expect(player(world, 'p1').dashCooldown).toBeGreaterThan(0);
  });

  it('dash dura nove ticks, não repete sob botão sustentado e aceita uma nova borda', () => {
    const world = makeWorld();
    world.bounds = { min: { x: -100, z: -100 }, max: { x: 100, z: 100 } };
    player(world, 'p1').position = { x: 0, z: 0 };
    ticks(world, 120, { p1: input({ move: { x: 1, z: 0 }, dash: true }) });
    expect(player(world, 'p1').position.x).toBeCloseTo(17.5, 7);
    expect(player(world, 'p1').dashRemaining).toBe(0);
    expect(player(world, 'p1').dashCooldown).toBe(0);

    ticks(world, 1, { p1: input({ move: { x: 1, z: 0 }, dash: false }) });
    ticks(world, 1, { p1: input({ move: { x: 1, z: 0 }, dash: true }) });
    expect(player(world, 'p1').dashRemaining).toBeCloseTo(0.15 - 1 / 60, 8);
    expect(player(world, 'p1').dashCooldown).toBe(1.4);
  });

  it('desembaraça uma sobreposição inicial e consegue sair da quina', () => {
    const world = makeWorld();
    world.colliders.push({ min: { x: -0.2, z: -0.2 }, max: { x: 0.2, z: 0.2 } });
    player(world, 'p1').position = { x: 0, z: 0 };
    ticks(world, 120, { p1: input({ move: { x: 1, z: 0.4 } }) });
    expect(Number.isFinite(player(world, 'p1').position.x)).toBe(true);
    expect(Math.hypot(player(world, 'p1').position.x, player(world, 'p1').position.z)).toBeGreaterThan(1);
  });

  it('resolve uma sobreposição para dentro quando a caixa encosta no limite', () => {
    const world = makeWorld();
    world.bounds = { min: { x: 0, z: -4 }, max: { x: 4, z: 4 } };
    world.colliders.push({ min: { x: 0, z: -3 }, max: { x: 1.8, z: 3 } });
    player(world, 'p1').position = { x: 0.85, z: 0 };
    ticks(world, 60, { p1: input({ move: { x: 1, z: 0 } }) });
    expect(player(world, 'p1').position.x).toBeGreaterThan(1.8 + 0.85);
  });

  it('não deixa o círculo penetrar na junção de duas paredes', () => {
    const world = makeWorld();
    const vertical: Aabb = { min: { x: 2, z: -2 }, max: { x: 2.2, z: 1 } };
    const horizontal: Aabb = { min: { x: 2, z: 1 }, max: { x: 4, z: 1.2 } };
    world.colliders.push(vertical, horizontal);
    player(world, 'p1').position = { x: 0, z: 0 };
    ticks(world, 120, { p1: input({ move: { x: 1, z: 1 } }) });
    for (const obstacle of [vertical, horizontal]) {
      const nearestX = Math.max(obstacle.min.x, Math.min(obstacle.max.x, player(world, 'p1').position.x));
      const nearestZ = Math.max(obstacle.min.z, Math.min(obstacle.max.z, player(world, 'p1').position.z));
      expect(Math.hypot(player(world, 'p1').position.x - nearestX, player(world, 'p1').position.z - nearestZ))
        .toBeGreaterThanOrEqual(0.85 - 1e-5);
    }
    expect(Number.isFinite(player(world, 'p1').position.x)).toBe(true);
    expect(Number.isFinite(player(world, 'p1').position.z)).toBe(true);
  });
});
