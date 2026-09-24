import { describe, expect, it } from 'vitest';
import { applyDamage } from '../combat/damage';
import { spawnEnemy } from '../core/world';
import { makeWorld, input, player, ticks } from '../../../tests/fixtures/world';

describe('queda e resgate cooperativo', () => {
  it('resgata o parceiro sem terminar a partida na primeira queda', () => {
    const w = makeWorld();
    player(w, 'p1').position = { x: 0, z: 0 };
    player(w, 'p2').position = { x: 1, z: 0 };
    applyDamage(w, 'p2', 100, { team: 'enemies', ownerId: 'e:test' });

    ticks(w, 1);
    expect(w.phase).toBe('playing');
    ticks(w, 120, { p1: input({ revive: true }) });

    expect(player(w, 'p2').status).toBe('active');
    expect(player(w, 'p2').hp).toBe(40);
    expect(player(w, 'p2').invulnerableSeconds).toBeCloseTo(1.5);
  });

  it('resolve derrota quando os dois jogadores caem no mesmo tick', () => {
    const w = makeWorld();
    for (const id of ['p1', 'p2'] as const) {
      const target = player(w, id);
      w.projectiles.push({
        id: `b:${id}`, ownerId: 'e:runner', team: 'enemies',
        position: { ...target.position }, previousPosition: { ...target.position },
        velocity: { x: 0, z: 0 }, damage: 100, lifeSeconds: 1,
      });
    }

    ticks(w, 1);

    expect(player(w, 'p1').status).toBe('down');
    expect(player(w, 'p2').status).toBe('down');
    expect(w.phase).toBe('lost');
    expect(w.result).toBe('lost');
  });

  it('resolve derrota ao cair em modo solo', () => {
    const w = makeWorld({ players: [{ id: 'p1', catId: 'anakin', weaponId: 'pulse_rifle' }] });
    applyDamage(w, 'p1', 100, { team: 'enemies', ownerId: 'e:runner' });

    ticks(w, 1);

    expect(player(w, 'p1').status).toBe('down');
    expect(w.phase).toBe('lost');
  });

  it.each([
    { reason: 'por distância', moveAway: true },
    { reason: 'por soltura', moveAway: false },
  ])('zera o resgate manual interrompido $reason', ({ moveAway }) => {
    const w = makeWorld();
    player(w, 'p1').position = { x: 0, z: 0 };
    player(w, 'p2').position = { x: 1, z: 0 };
    applyDamage(w, 'p2', 100, { team: 'enemies', ownerId: 'e:test' });
    ticks(w, 60, { p1: input({ revive: true }) });
    expect(player(w, 'p2').reviveProgress).toBeCloseTo(1);

    if (moveAway) player(w, 'p1').position.x = 4;
    ticks(w, 1, { p1: input({ revive: moveAway }) });

    expect(player(w, 'p2').reviveProgress).toBe(0);
    expect(player(w, 'p2').status).toBe('down');
  });

  it('resgata automaticamente aos 12 segundos se um aliado segue ativo', () => {
    const w = makeWorld();
    applyDamage(w, 'p2', 100, { team: 'enemies', ownerId: 'e:test' });

    ticks(w, 12 * 60);

    expect(player(w, 'p2').status).toBe('active');
    expect(player(w, 'p2').hp).toBe(30);
    expect(player(w, 'p2').invulnerableSeconds).toBeCloseTo(1.5);
  });

  it('congela os timers de queda e resgate durante a pausa', () => {
    const w = makeWorld();
    player(w, 'p1').position = { x: 0, z: 0 };
    player(w, 'p2').position = { x: 1, z: 0 };
    applyDamage(w, 'p2', 100, { team: 'enemies', ownerId: 'e:test' });
    ticks(w, 30, { p1: input({ revive: true }) });
    const downTime = player(w, 'p2').downSeconds;
    const progress = player(w, 'p2').reviveProgress;
    player(w, 'p1').invulnerableSeconds = 0.5;
    w.phase = 'paused';

    ticks(w, 600, { p1: input({ revive: true }) });

    expect(player(w, 'p2').downSeconds).toBe(downTime);
    expect(player(w, 'p2').reviveProgress).toBe(progress);
    expect(player(w, 'p1').invulnerableSeconds).toBe(0.5);
    expect(player(w, 'p2').status).toBe('down');
  });

  it('não derruba um aliado por dano direto de jogador nem aplica hits depois da queda', () => {
    const w = makeWorld();
    expect(applyDamage(w, 'p2', 100, { team: 'players', ownerId: 'p1' }))
      .toEqual({ applied: 0, killed: false });
    expect(player(w, 'p2').hp).toBe(100);

    applyDamage(w, 'p2', 100, { team: 'enemies', ownerId: 'e:test' });
    expect(applyDamage(w, 'p2', 10, { team: 'enemies', ownerId: 'e:test' }))
      .toEqual({ applied: 0, killed: false });
    expect(player(w, 'p2').hp).toBe(0);
  });

  it('não permite que o jogador caído dispare e respeita a invulnerabilidade do resgate', () => {
    const w = makeWorld();
    const downed = player(w, 'p2');
    downed.status = 'down';
    ticks(w, 1, { p2: input({ fire: true }) });
    expect(w.projectiles).toHaveLength(0);

    downed.status = 'active';
    downed.hp = 40;
    downed.invulnerableSeconds = 1.5;
    expect(applyDamage(w, 'p2', 10, { team: 'enemies', ownerId: 'e:test' }))
      .toEqual({ applied: 0, killed: false });
    ticks(w, 90);
    expect(downed.invulnerableSeconds).toBe(0);
    expect(applyDamage(w, 'p2', 10, { team: 'enemies', ownerId: 'e:test' }))
      .toEqual({ applied: 10, killed: false });
  });

  it('prioriza derrota se o chefe e o último jogador caem no mesmo tick', () => {
    const w = makeWorld({ players: [{ id: 'p1', catId: 'anakin', weaponId: 'pulse_rifle' }] });
    const boss = spawnEnemy(w, { kind: 'mechacat', position: { x: 0, z: 8 }, hp: 1 });
    const target = player(w, 'p1');
    const bossPosition = { x: 0, z: 8 };
    w.projectiles.push({
      id: 'b:boss-kill', ownerId: 'p1', team: 'players',
      position: { ...bossPosition }, previousPosition: { ...bossPosition },
      velocity: { x: 0, z: 0 }, damage: 1, lifeSeconds: 1,
    }, {
      id: 'b:last-player', ownerId: boss, team: 'enemies',
      position: { ...target.position }, previousPosition: { ...target.position },
      velocity: { x: 0, z: 0 }, damage: 100, lifeSeconds: 1,
    });

    ticks(w, 1);

    expect(w.phase).toBe('lost');
    expect(w.result).toBe('lost');
    expect(w.events.find(event => event.type === 'enemy-killed' && event.entityId === boss)?.tick)
      .toBe(w.events.find(event => event.type === 'run-ended')?.tick);
  });
});
