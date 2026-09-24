import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Difficulty, PlayerId, RunConfig, RunMode, Vec2, World } from './core/model';
import { spawnEnemy } from './core/world';
import { InputHub } from './input/InputHub';
import type { MenuCommand } from './input/bindings';
import { GameRuntime } from './runtime/GameRuntime';
import { PlayScene } from './render/PlayScene';
import { MouseAimBridge } from './render/WorldView';
import { Hud } from './ui/Hud';
import { Lobby } from './ui/Lobby';
import { PauseMenu } from './ui/PauseMenu';
import { useUiStore, type LobbyPlayer, type RuntimeSnapshot } from './ui/uiStore';

export function GameApp({ onBack }: { onBack: () => void }) {
  const [screen, setScreen] = useState<'home' | 'lobby' | 'game' | 'options'>('home');
  const [playerCount, setPlayerCount] = useState<1 | 2>(2);
  const [initialMode, setInitialMode] = useState<RunMode>('campaign');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [trainingBot, setTrainingBot] = useState(false);

  useEffect(() => { useUiStore.getState().setScreen(screen === 'options' ? 'home' : screen); }, [screen]);

  if (screen === 'lobby') {
    return <Lobby initialCount={playerCount} initialMode={initialMode} onBack={() => setScreen('home')} onStart={(selected, mode, selectedDifficulty, useTrainingBot) => {
      setPlayers(selected.map((player) => ({ ...player })));
      useUiStore.getState().setLobbyPlayers(selected);
      setInitialMode(mode);
      setDifficulty(selectedDifficulty);
      setTrainingBot(useTrainingBot);
      setScreen('game');
      useUiStore.getState().setRuntimeSnapshot({ phase: 'playing', players: [], objective: 'Preparando a arena', wave: 0, targetCount: 0, training: mode === 'training' });
    }} />;
  }

  if (screen === 'game') {
    return <GameSession players={players} mode={initialMode} difficulty={difficulty} trainingBot={trainingBot} onBackToLobby={() => {
      setScreen('lobby');
      useUiStore.getState().clearRuntimeSnapshot();
    }} />;
  }

  if (screen === 'options') {
    return <main className="absolute inset-0 grid place-items-center bg-[#19242c] p-5 text-white"><section className="w-full max-w-2xl rounded-3xl border border-white/15 bg-[#23323c] p-7"><h1 className="text-3xl font-black">Controles</h1><p className="mt-4 leading-relaxed text-slate-200">Teclado compartilhado: P1 usa WASD, F para atirar, G para dash, E para resgatar e Q para trocar arma. P2 usa as setas, K para atirar, L para dash, O para resgatar e P para trocar arma. Gamepad standard: analógicos movem e miram; RT atira; botão sul usa dash; oeste resgata; norte troca arma.</p><button type="button" onClick={() => setScreen('home')} className="mt-6 rounded-lg bg-cyan-300 px-5 py-3 font-bold text-slate-950 outline-none focus-visible:ring-4 focus-visible:ring-white">Voltar</button></section></main>;
  }

  return (
    <main className="absolute inset-0 grid place-items-center overflow-auto bg-[#19242c] p-5 text-white sm:p-8">
      <section className="relative w-full max-w-4xl rounded-3xl border border-cyan-100/20 bg-[#23323c]/95 p-7 shadow-2xl sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-cyan-200">Nitrokats Reborn</p>
        <h1 className="mt-3 text-4xl font-black leading-tight sm:text-6xl">Madrugada de Caos</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-200">Dois gatos, uma arena e uma garagem cheia de robôs fora de controle. Escolham seus gatos e lutem juntos.</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => { setPlayerCount(2); setInitialMode('campaign'); setScreen('lobby'); }} className="rounded-xl bg-cyan-300 px-6 py-4 text-lg font-black text-slate-950 outline-none transition hover:bg-cyan-200 focus-visible:ring-4 focus-visible:ring-white">Jogar em dupla</button>
          <button type="button" onClick={() => { setPlayerCount(1); setInitialMode('campaign'); setScreen('lobby'); }} className="rounded-xl border border-white/25 px-6 py-4 text-lg font-bold outline-none transition hover:bg-white/10 focus-visible:ring-4 focus-visible:ring-cyan-300">Jogar sozinho</button>
          <button type="button" onClick={() => { setPlayerCount(2); setInitialMode('training'); setScreen('lobby'); }} className="rounded-xl border border-white/25 px-6 py-4 text-lg font-bold outline-none transition hover:bg-white/10 focus-visible:ring-4 focus-visible:ring-cyan-300">Treino</button>
          <button type="button" onClick={() => setScreen('options')} className="rounded-xl border border-white/25 px-6 py-4 text-lg font-bold outline-none transition hover:bg-white/10 focus-visible:ring-4 focus-visible:ring-cyan-300">Opções</button>
        </div>
        <button type="button" onClick={onBack} className="mt-5 rounded-lg px-3 py-2 text-sm font-bold text-slate-300 outline-none hover:text-white focus-visible:ring-4 focus-visible:ring-cyan-300">Voltar ao jogo antigo</button>
      </section>
    </main>
  );
}

function GameSession({ players, mode, difficulty, trainingBot, onBackToLobby }: {
  players: LobbyPlayer[];
  mode: RunMode;
  difficulty: Difficulty;
  trainingBot: boolean;
  onBackToLobby: () => void;
}) {
  const [runtime, setRuntime] = useState<GameRuntime | null>(null);
  const [paused, setPaused] = useState(false);
  const [controllerPulse, setControllerPulse] = useState<{ command: MenuCommand; sequence: number } | null>(null);
  const pulseSequence = useRef(0);
  const mouseAimBridge = useMemo(() => new MouseAimBridge(), []);

  const hudBridge = useMemo(() => ({
    update(world: GameRuntime['world']) {
      const snapshot: RuntimeSnapshot = {
        phase: world.phase,
        players: world.players.map((player) => ({ id: player.id, catId: player.catId, weaponId: player.weaponId, hp: player.hp, maxHp: player.maxHp, dashCooldown: player.dashCooldown, status: player.status })),
        objective: world.objective ? `${world.objective.kind} ${world.objective.progress}/${world.objective.target}` : 'sobreviva e pratique seus movimentos',
        wave: world.stageIndex,
        targetCount: world.enemies.filter((enemy) => enemy.status === 'alive' && enemy.hp > 0).length,
        training: world.config.mode === 'training',
      };
      useUiStore.getState().setRuntimeSnapshot(snapshot);
    },
    setPaused(value: boolean) { setPaused(value); },
  }), []);

  useEffect(() => {
    const input = new InputHub({
      resolveMouseAim: (pointer, viewport): Vec2 => mouseAimBridge.resolve(pointer, viewport),
    });
    for (const player of players) {
      input.assign(player.id, player.device ?? { type: 'keyboard-shared', profile: player.id });
    }
    const runPlayers = players.map(({ id, catId, weaponId }) => ({ id, catId, weaponId }));
    if (trainingBot && mode === 'training') runPlayers.push({ id: 'p2', catId: 'maya', weaponId: 'pulse_rifle' });
    const config: RunConfig = {
      seed: 240924,
      mode,
      difficulty,
      players: runPlayers,
    };
    const session = new GameRuntime(config, input, { trainingBot });
    if (mode === 'training') spawnTrainingTargets(session.world);
    let active = true;
    queueMicrotask(() => { if (active) setRuntime(session); });
    return () => {
      active = false;
      session.dispose();
      useUiStore.getState().clearRuntimeSnapshot();
    };
  }, [difficulty, mode, mouseAimBridge, players, trainingBot]);

  const handleMenuCommands = useCallback((commands: Partial<Record<PlayerId, MenuCommand>>) => {
    if (!runtime || runtime.world.phase !== 'paused') return;
    const p1 = commands.p1;
    if (!p1) return;
    if (p1.navX || p1.navY || p1.confirmPressed) {
      pulseSequence.current += 1;
      setControllerPulse({ command: { ...p1 }, sequence: pulseSequence.current });
    }
    if (p1.pausePressed) runtime.resume();
  }, [runtime]);

  const continueGame = () => { runtime?.resume(); setPaused(false); };
  const restartGame = () => {
    runtime?.restart();
    if (mode === 'training' && runtime) spawnTrainingTargets(runtime.world);
    setPaused(false);
  };
  const returnToLobby = () => { runtime?.dispose(); setRuntime(null); onBackToLobby(); };

  if (!runtime) return <div role="status" className="absolute inset-0 grid place-items-center bg-[#19242c] text-white">Abrindo a garagem…</div>;

  return (
    <main className="absolute inset-0 overflow-hidden bg-[#222d35] text-white" data-testid="reboot-session">
      <PlayScene runtime={runtime} mouseAimBridge={mouseAimBridge} hudBridge={hudBridge} onBack={returnToLobby} onMenuCommands={handleMenuCommands} />
      <Hud />
      <button type="button" onClick={() => { runtime.pause(); setPaused(true); }} className="absolute right-3 top-3 z-10 rounded-lg border border-white/25 bg-slate-950/85 px-3 py-2 text-xs font-bold outline-none focus-visible:ring-4 focus-visible:ring-cyan-300 sm:right-5 sm:top-4" aria-label="Pausar partida">Pausar · Esc / Start</button>
      {mode === 'training' && runtime.world.players.length > 1 && <button type="button" onClick={() => {
        runtime.simulateTrainingDown('p1');
      }} className="absolute right-3 top-14 z-10 rounded-lg border border-white/25 bg-slate-950/85 px-3 py-2 text-xs font-bold outline-none focus-visible:ring-4 focus-visible:ring-cyan-300 sm:right-5 sm:top-16" aria-label="Simular queda de P1">Simular queda · tutorial</button>}
      <PauseMenu key={paused ? 'pause-open' : 'pause-closed'} open={paused} canRestart={Boolean(runtime)} mode={mode} controllerPulse={controllerPulse} onContinue={continueGame} onRestart={restartGame} onReturnToLobby={returnToLobby} />
    </main>
  );
}

function spawnTrainingTargets(world: World): void {
  spawnEnemy(world, { kind: 'runner', position: { x: -5, z: 6 }, hp: 80 });
  spawnEnemy(world, { kind: 'gunner', position: { x: 5, z: 7 }, hp: 120 });
  spawnEnemy(world, { kind: 'brute', position: { x: 0, z: 9 }, hp: 160 });
}
