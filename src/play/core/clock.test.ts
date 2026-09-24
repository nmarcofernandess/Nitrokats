import { describe, expect, it } from 'vitest';
import { createClock } from './clock';
import { pauseWorld, resumeWorld } from './lifecycle';
import { makeWorld, ticks } from '../../../tests/fixtures/world';
import { GameRuntime } from '../runtime/GameRuntime';
import { emitGameEvent } from './step';
import { spawnEnemy } from './world';
import type { InputFrame } from './model';

describe('clock de simulação', () => {
  it('limita catch-up e pausa o tempo de combate', () => {
    let count = 0;
    const clock = createClock(() => count++);
    clock.advance(10);
    expect(count).toBe(5);
    clock.reset();
    clock.advance(1 / 60);
    expect(count).toBe(6);

    const world = makeWorld();
    ticks(world, 60);
    pauseWorld(world);
    const before = world.elapsed;
    ticks(world, 600);
    expect(world.elapsed).toBe(before);
    resumeWorld(world);
    ticks(world, 1);
    expect(world.elapsed).toBeCloseTo(before + 1 / 60);
  });

  it.each([30, 60, 120])('produz 60 ticks em 1 segundo a %i Hz', (hz) => {
    let count = 0;
    const clock = createClock(() => count++);
    for (let frame = 0; frame < hz; frame++) clock.advance(1 / hz);
    expect(count).toBe(60);
  });

  it('ignora deltas inválidos e reset descarta fração acumulada', () => {
    let count = 0;
    const clock = createClock(() => count++);
    clock.advance(Number.NaN);
    clock.advance(-1);
    clock.advance(1 / 120);
    clock.reset();
    clock.advance(1 / 120);
    expect(count).toBe(0);
    clock.advance(1 / 120);
    expect(count).toBe(1);
  });

  it('atribui IDs monotônicos aos eventos do mesmo mundo', () => {
    const world = makeWorld();
    const first = emitGameEvent(world, { type: 'shot', playerId: 'p1' });
    spawnEnemy(world, { kind: 'runner', position: { x: 0, z: 0 }, hp: 10 });
    const second = emitGameEvent(world, { type: 'hit', playerId: 'p2' });
    expect(second.id).toBeGreaterThan(first.id);
    expect(second.tick).toBe(world.tick);
    expect(world.events).toEqual([first, second]);
  });
});

describe('ciclo de vida do runtime', () => {
  const config = {
    seed: 42,
    mode: 'training' as const,
    difficulty: 'normal' as const,
    players: [{ id: 'p1' as const, catId: 'anakin' as const, weaponId: 'pulse_rifle' as const }],
  };

  it('pausa idempotentemente, limpa input e não avança durante intermission', () => {
    let heldInput: InputFrame = { p1: { move: { x: 1, z: 0 }, aim: { x: 0, z: 1 }, fire: true, dash: true, revive: false, nextWeapon: false } };
    const readInput = Object.assign(() => heldInput, { clear: () => { heldInput = {}; } });
    const runtime = new GameRuntime(config, readInput);
    runtime.advance(1 / 60);
    expect(runtime.world.tick).toBe(1);
    runtime.pause();
    runtime.pause();
    expect(heldInput).toEqual({});
    runtime.advance(1 / 30);
    expect(runtime.world.tick).toBe(1);
    runtime.resume();
    runtime.world.phase = 'intermission';
    runtime.advance(1 / 30);
    expect(runtime.world.tick).toBe(1);
    expect(runtime.world.elapsed).toBeCloseTo(1 / 60);
    runtime.dispose();
  });

  it('restart substitui o mundo e descarte repetido é seguro', () => {
    const runtime = new GameRuntime(config);
    const abandonedWorld = runtime.world;
    runtime.advance(1);
    runtime.restart();
    expect(runtime.world).not.toBe(abandonedWorld);
    expect(runtime.world.tick).toBe(0);
    expect(runtime.world.players).not.toBe(abandonedWorld.players);
    runtime.dispose();
    runtime.dispose();
    runtime.advance(1);
    expect(runtime.world.tick).toBe(0);
  });

  it('preserva fração nenhuma entre pausa e retomada', () => {
    const runtime = new GameRuntime(config);
    runtime.advance(1 / 120);
    runtime.pause();
    runtime.resume();
    runtime.advance(1 / 120);
    expect(runtime.world.tick).toBe(0);
    runtime.advance(1 / 120);
    expect(runtime.world.tick).toBe(1);
    runtime.dispose();
  });

  it('mantém o mesmo batch visível para leituras independentes até o próximo avanço', () => {
    const runtime = new GameRuntime(config);
    runtime.advance(1 / 60);
    const audioBatch = runtime.eventBatches;
    const renderBatch = runtime.eventBatches;
    expect(renderBatch).toBe(audioBatch);
    runtime.advance(1 / 60);
    expect(runtime.eventBatches).not.toBe(audioBatch);
    runtime.dispose();
  });
});
