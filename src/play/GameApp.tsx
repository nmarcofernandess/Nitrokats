import { useEffect, useMemo, useRef, useState } from 'react';
import type { RunConfig, Vec2 } from './core/model';
import { spawnEnemy } from './core/world';
import { InputHub } from './input/InputHub';
import { GameRuntime } from './runtime/GameRuntime';
import { PlayScene } from './render/PlayScene';
import { MouseAimBridge, type HudBridge } from './render/WorldView';

const TRAINING_RUN: RunConfig = {
  seed: 240924,
  mode: 'training',
  difficulty: 'normal',
  players: [
    { id: 'p1', catId: 'anakin', weaponId: 'pulse_rifle' },
    { id: 'p2', catId: 'yang', weaponId: 'pulse_rifle' },
  ],
};

export function GameApp({ onBack }: { onBack: () => void }) {
  const [playing, setPlaying] = useState(false);

  if (!playing) {
    return (
      <main className="absolute inset-0 grid place-items-center overflow-hidden bg-[#19242c] p-6 text-white">
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'linear-gradient(30deg, transparent 48%, #88a1ad 49%, transparent 50%), linear-gradient(150deg, transparent 48%, #88a1ad 49%, transparent 50%)', backgroundSize: '68px 68px' }} />
        <section className="relative z-10 w-full max-w-3xl rounded-3xl border border-cyan-100/20 bg-[#23323c]/95 p-8 shadow-2xl sm:p-12">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-cyan-200">Nitrokats Reborn</p>
          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-6xl">Madrugada de Caos</h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-200">Dois gatos, uma arena e uma garagem cheia de robôs fora de controle. Teste o combate cooperativo local.</p>
          <div className="mt-8 grid gap-3 rounded-xl bg-black/20 p-4 text-sm text-slate-200 sm:grid-cols-2">
            <p><strong className="text-cyan-200">P1:</strong> WASD move · mouse mira e atira · Espaço dash · E resgata · Q troca arma</p>
            <p><strong className="text-orange-200">P2:</strong> setas movem · K atira · L dash · O resgata · P troca arma</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={() => setPlaying(true)} className="rounded-xl bg-cyan-300 px-7 py-4 text-lg font-black text-slate-950 transition hover:bg-cyan-200">Jogar em dupla</button>
            <button type="button" onClick={onBack} className="rounded-xl border border-white/20 px-6 py-4 font-bold text-white transition hover:bg-white/10">Voltar ao jogo antigo</button>
          </div>
        </section>
      </main>
    );
  }

  return <GameSession onBack={() => setPlaying(false)} />;
}

function GameSession({ onBack }: { onBack: () => void }) {
  const [runtime, setRuntime] = useState<GameRuntime | null>(null);
  const mouseAimBridge = useMemo(() => new MouseAimBridge(), []);
  const p1Ref = useRef<HTMLDivElement>(null);
  const p2Ref = useRef<HTMLDivElement>(null);
  const objectiveRef = useRef<HTMLDivElement>(null);
  const activityRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef<HTMLDivElement>(null);
  const hudBridge = useMemo<HudBridge>(() => ({
    update(world) {
      const p1 = world.players.find(player => player.id === 'p1');
      const p2 = world.players.find(player => player.id === 'p2');
      if (p1 && p1Ref.current) p1Ref.current.textContent = `P1 · ${p1.catId.toUpperCase()} · ${p1.hp}/${p1.maxHp} HP · ${p1.status === 'down' ? 'CAÍDO' : 'ATIVO'}`;
      if (p2 && p2Ref.current) p2Ref.current.textContent = `P2 · ${p2.catId.toUpperCase()} · ${p2.hp}/${p2.maxHp} HP · ${p2.status === 'down' ? 'CAÍDO' : 'ATIVO'}`;
      if (objectiveRef.current) objectiveRef.current.textContent = `TREINO · TICK ${world.tick} · ${world.phase.toUpperCase()}`;
      if (activityRef.current) activityRef.current.textContent = `${world.enemies.filter(enemy => enemy.status === 'alive').length} alvos · ${world.projectiles.length} tiros`;
    },
    setPaused(paused) {
      if (pausedRef.current) pausedRef.current.hidden = !paused;
    },
  }), []);

  useEffect(() => {
    const input = new InputHub({
      resolveMouseAim: (pointer, viewport): Vec2 => mouseAimBridge.resolve(pointer, viewport),
    });
    input.assign('p1', { type: 'keyboard-mouse' });
    input.assign('p2', { type: 'keyboard-shared', profile: 'p2' });
    const session = new GameRuntime(TRAINING_RUN, input);
    spawnEnemy(session.world, { kind: 'runner', position: { x: -1, z: 7 }, hp: 64 });
    spawnEnemy(session.world, { kind: 'gunner', position: { x: 1, z: 8 }, hp: 64 });
    let active = true;
    queueMicrotask(() => { if (active) setRuntime(session); });
    return () => { active = false; session.dispose(); };
  }, [mouseAimBridge]);

  if (!runtime) {
    return <div className="absolute inset-0 grid place-items-center bg-[#19242c] text-white">Abrindo a garagem…</div>;
  }

  return (
    <main className="absolute inset-0 overflow-hidden bg-[#222d35] text-white" data-testid="reboot-session">
      <PlayScene runtime={runtime} mouseAimBridge={mouseAimBridge} hudBridge={hudBridge} onBack={onBack} />
      <section className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-4 sm:p-6">
        <div className="grid gap-2 rounded-xl border border-white/10 bg-[#172129]/90 px-4 py-3 shadow-lg backdrop-blur-sm">
          <div ref={p1Ref} className="font-bold text-cyan-200">P1 · ANAKIN · 100/100 HP · ATIVO</div>
          <div ref={p2Ref} className="font-bold text-orange-200">P2 · YANG · 100/100 HP · ATIVO</div>
          <div ref={objectiveRef} className="text-xs uppercase tracking-widest text-slate-300">TREINO · INICIANDO</div>
          <div ref={activityRef} className="text-xs text-slate-300">2 alvos · 0 tiros</div>
        </div>
        <div className="pointer-events-auto flex gap-2">
          <button type="button" onClick={onBack} className="rounded-lg border border-white/20 bg-[#172129]/90 px-4 py-3 text-sm font-bold shadow-lg hover:bg-[#30424e]">Voltar ao menu</button>
        </div>
      </section>
      <div ref={pausedRef} hidden className="absolute inset-0 z-20 grid place-items-center bg-black/65 p-6">
        <section className="rounded-2xl border border-white/15 bg-[#172129] p-8 text-center shadow-2xl">
          <h2 className="text-3xl font-black">Partida pausada</h2>
          <p className="mt-2 text-slate-200">Pressione Esc ou Enter para continuar.</p>
          <button type="button" onClick={() => runtime.resume()} className="mt-5 rounded-lg bg-cyan-300 px-6 py-3 font-bold text-slate-950">Continuar</button>
        </section>
      </div>
      <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-lg bg-[#172129]/80 px-3 py-2 text-xs text-slate-200">Caixa de teste visual · arte temporária · Esc pausa</div>
    </main>
  );
}
