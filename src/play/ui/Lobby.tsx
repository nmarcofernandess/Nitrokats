import { useEffect, useRef, useState } from 'react';
import type { CatId, Difficulty, PlayerId, RunMode, WeaponId } from '../core/model';
import { InputHub, type GamepadChoice } from '../input/InputHub';
import { hasValidDeviceAssignments, hostConfirmed, moveMenuFocus, playerConfirmed } from './MenuInput';
import { copyLobbyPlayers, useUiStore, type LobbyPlayer } from './uiStore';

const CATS: Array<{ id: CatId; name: string }> = [
  { id: 'anakin', name: 'Anakin' }, { id: 'yang', name: 'Yang' }, { id: 'maya', name: 'Maya' }, { id: 'ivy', name: 'Ivy' },
];
const WEAPONS: Array<{ id: WeaponId; name: string }> = [
  { id: 'pulse_rifle', name: 'Pulse Rifle' }, { id: 'scatter_cannon', name: 'Scatter Cannon' }, { id: 'arc_marksman', name: 'Arc Marksman' },
];

export function Lobby({ initialCount, initialMode, onStart, onBack }: {
  initialCount: 1 | 2;
  initialMode: RunMode;
  onStart: (players: LobbyPlayer[], mode: RunMode, difficulty: Difficulty, trainingBot: boolean) => void;
  onBack: () => void;
}) {
  const savedPlayers = useUiStore((state) => state.lobbyPlayers);
  const storePlayers = useUiStore((state) => state.setLobbyPlayers);
  const [players, setPlayers] = useState<LobbyPlayer[]>(() => {
    const copied = copyLobbyPlayers(savedPlayers);
    return initialCount === 1 ? copied.slice(0, 1) : copied;
  });
  const [mode, setMode] = useState<RunMode>(initialMode);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [pads, setPads] = useState<GamepadChoice[]>([]);
  const [message, setMessage] = useState('Cada pessoa confirma seu próprio espaço.');
  const [trainingBot, setTrainingBot] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0);
  const hubRef = useRef<InputHub | null>(null);
  const latest = useRef({ players, focusIndex });
  const bindingSignature = players.map((player) => `${player.id}:${player.device?.type ?? 'none'}:${player.device?.type === 'gamepad' ? player.device.index : player.device?.type === 'keyboard-shared' ? player.device.profile : ''}`).join('|');
  const canStart = players.every((player) => player.ready) && hasValidDeviceAssignments(players);

  useEffect(() => { latest.current = { players, focusIndex }; }, [players, focusIndex]);

  useEffect(() => {
    const hub = new InputHub();
    hubRef.current = hub;
    for (const player of latest.current.players) {
      if (player.device) hub.assign(player.id, player.device);
    }
    return () => { hub.dispose(); if (hubRef.current === hub) hubRef.current = null; };
  // Selection and ready toggles do not need to rebuild the device listeners.
  }, [bindingSignature]);

  useEffect(() => {
    let lastNavigation = 0;
    const timer = window.setInterval(() => {
      const hub = hubRef.current;
      if (!hub) return;
      hub.poll();
      const currentPads = hub.getAvailableGamepads();
      setPads((previous) => JSON.stringify(previous) === JSON.stringify(currentPads) ? previous : currentPads);
      const commands = hub.consumeMenuCommands();
      const p1 = commands.p1;
      const now = performance.now();
      if (p1 && (p1.navX || p1.navY) && now - lastNavigation > 220) {
        lastNavigation = now;
        const focusable = document.querySelectorAll<HTMLElement>('[data-menu-control]');
        setFocusIndex((current) => moveMenuFocus(current, focusable.length, p1));
      }
      if (p1 && hostConfirmed(commands)) {
        const focusable = document.querySelectorAll<HTMLElement>('[data-menu-control]');
        const active = focusable[latest.current.focusIndex];
        if (active instanceof HTMLSelectElement) active.showPicker?.();
        else active?.click();
      }
      for (const player of latest.current.players) {
        if (playerConfirmed(commands, player.id)) {
          const ready = document.querySelector<HTMLElement>(`[data-ready-slot="${player.id}"]`);
          ready?.click();
        }
      }
    }, 50);
    return () => { window.clearInterval(timer); };
  }, []);

  useEffect(() => { storePlayers(players); }, [players, storePlayers]);

  useEffect(() => {
    document.querySelectorAll<HTMLElement>('[data-menu-control]')[focusIndex]?.focus({ preventScroll: true });
  }, [focusIndex]);

  const changePlayer = (playerId: PlayerId, change: Partial<LobbyPlayer>) => {
    setPlayers((current) => current.map((player) => player.id === playerId ? { ...player, ...change, ready: false } : player));
  };

  const setSharedKeyboard = () => {
    const next = players.map((player) => ({ ...player, device: { type: 'keyboard-shared' as const, profile: player.id }, ready: false }));
    setPlayers(next);
    setMessage('Teclado compartilhado: P1 usa WASD/F/G/E/Q; P2 usa setas/K/L/O/P. Confirme os dois espaços.');
  };

  const assignGamepad = (playerId: PlayerId, index: number) => {
    const pad = pads.find((choice) => choice.index === index);
    if (!pad) { setMessage('Esse controle não está conectado.'); return; }
    if (pad.mapping !== 'standard') { setMessage('Este controle precisa de diagnóstico antes de ser usado. Conecte um controle standard ou use teclado compartilhado.'); return; }
    if (players.some((player) => player.id !== playerId && player.device?.type === 'gamepad' && player.device.index === index)) {
      setMessage('Cada controle só pode ocupar um espaço.'); return;
    }
    changePlayer(playerId, { device: { type: 'gamepad', index } });
  };

  const toggleReady = (playerId: PlayerId) => {
    const player = players.find((entry) => entry.id === playerId);
    if (!player?.device) { setMessage(`Escolha o dispositivo de ${playerId.toUpperCase()} antes de confirmar.`); return; }
    setPlayers((current) => current.map((entry) => entry.id === playerId ? { ...entry, ready: !entry.ready } : entry));
  };

  const start = (runMode: RunMode) => {
    if (!canStart) { setMessage('Escolha e confirme um dispositivo em cada espaço antes de começar.'); return; }
    storePlayers(players);
    setMode(runMode);
    onStart(players, runMode, difficulty, trainingBot && runMode === 'training');
  };

  return (
    <main className="absolute inset-0 overflow-auto bg-[#18242c] p-4 text-white sm:p-7">
      <section className="mx-auto w-full max-w-6xl rounded-3xl border border-cyan-100/20 bg-[#23323c]/95 p-5 shadow-2xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[.24em] text-cyan-200">Nitrokats Reborn</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Lobby cooperativo</h1><p className="mt-2 text-sm text-slate-200">Escolha um gato, uma arma e confirme o seu espaço.</p></div>
          <button data-menu-control type="button" onClick={onBack} className="rounded-lg border border-white/25 px-4 py-2 font-bold outline-none focus-visible:ring-4 focus-visible:ring-cyan-300">Voltar</button>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {players.map((player) => {
            const tone = player.id === 'p1' ? 'border-cyan-300/40' : 'border-orange-300/40';
            return (
              <section key={player.id} aria-label={`Espaço ${player.id.toUpperCase()}`} className={`rounded-2xl border ${tone} bg-slate-950/40 p-4 sm:p-5`}>
                <div className="flex items-center justify-between"><h2 className="text-xl font-black">{player.id.toUpperCase()}</h2><span className="text-xs font-bold uppercase tracking-wider">{player.ready ? 'Pronto' : 'Escolhendo'}</span></div>
                <label className="mt-4 block text-sm font-bold" htmlFor={`cat-${player.id}`}>Gato</label>
                <select data-menu-control id={`cat-${player.id}`} aria-label={`Gato de ${player.id.toUpperCase()}`} value={player.catId} onChange={(event) => changePlayer(player.id, { catId: event.target.value as CatId })} className="mt-1 w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-3 text-white outline-none focus-visible:ring-4 focus-visible:ring-cyan-300">
                  {CATS.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                <label className="mt-3 block text-sm font-bold" htmlFor={`weapon-${player.id}`}>Arma</label>
                <select data-menu-control id={`weapon-${player.id}`} aria-label={`Arma de ${player.id.toUpperCase()}`} value={player.weaponId} onChange={(event) => changePlayer(player.id, { weaponId: event.target.value as WeaponId })} className="mt-1 w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-3 text-white outline-none focus-visible:ring-4 focus-visible:ring-cyan-300">
                  {WEAPONS.map((weapon) => <option key={weapon.id} value={weapon.id}>{weapon.name}</option>)}
                </select>
                <label className="mt-3 block text-sm font-bold" htmlFor={`device-${player.id}`}>Dispositivo</label>
                <select data-menu-control id={`device-${player.id}`} aria-label={`Dispositivo de ${player.id.toUpperCase()}`} value={player.device?.type === 'gamepad' ? `pad:${player.device.index}` : player.device?.type ?? ''} onChange={(event) => {
                  const value = event.target.value;
                  if (value === 'keyboard-shared') setSharedKeyboard();
                  else if (value === 'keyboard-mouse') changePlayer(player.id, { device: { type: 'keyboard-mouse' } });
                  else if (value.startsWith('pad:')) assignGamepad(player.id, Number(value.slice(4)));
                  else changePlayer(player.id, { device: null });
                }} className="mt-1 w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-3 text-white outline-none focus-visible:ring-4 focus-visible:ring-cyan-300">
                  <option value="">Escolha um dispositivo</option><option value="keyboard-shared">Teclado compartilhado</option><option value="keyboard-mouse">Teclado + mouse</option>
                  {pads.map((pad) => <option key={pad.index} value={`pad:${pad.index}`} disabled={players.some((other) => other.id !== player.id && other.device?.type === 'gamepad' && other.device.index === pad.index)}>{`Controle ${pad.index + 1}${pad.mapping === 'standard' ? '' : ' · diagnóstico necessário'}`}</option>)}
                </select>
                <p className="mt-2 min-h-9 text-xs leading-relaxed text-slate-300" aria-label={`Controles de ${player.id.toUpperCase()}`}>
                  {player.device?.type === 'keyboard-shared' ? (player.id === 'p1' ? 'WASD move · F atira · G dash · E resgata · Q troca arma · Enter confirma' : 'Setas movem · K atira · L dash · O resgata · P troca arma · Enter do teclado numérico confirma') : player.device?.type === 'gamepad' ? 'Analógico esquerdo move · direito mira · RT atira · botão sul dash · oeste resgata · norte troca arma' : player.device?.type === 'keyboard-mouse' ? 'WASD move · mouse mira/atira · Espaço dash · E resgata · Q troca arma' : 'Conecte um controle standard ou escolha teclado compartilhado.'}
                </p>
                <button data-menu-control data-ready-slot={player.id} type="button" onClick={() => toggleReady(player.id)} className="mt-2 w-full rounded-lg bg-white/10 px-4 py-3 font-black outline-none transition hover:bg-white/20 focus-visible:ring-4 focus-visible:ring-cyan-300">{player.ready ? `Cancelar pronto de ${player.id.toUpperCase()}` : `${player.id.toUpperCase()} pronto`}</button>
              </section>
            );
          })}
        </div>
        <div className="mt-5 grid gap-3 rounded-xl bg-black/20 p-4 sm:grid-cols-2">
          <div><label htmlFor="difficulty" className="block text-sm font-bold">Dificuldade</label><select data-menu-control id="difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value as Difficulty)} className="mt-1 w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-3 outline-none focus-visible:ring-4 focus-visible:ring-cyan-300"><option value="relaxed">Tranquila</option><option value="normal">Normal</option></select></div>
          <div className="flex flex-col justify-end gap-2 sm:flex-row"><button data-menu-control type="button" onClick={() => setMode('training')} aria-pressed={mode === 'training'} className={`rounded-lg px-4 py-3 font-bold outline-none focus-visible:ring-4 focus-visible:ring-cyan-300 ${mode === 'training' ? 'bg-cyan-300 text-slate-950' : 'border border-white/20'}`}>Modo treino</button><button data-menu-control type="button" onClick={() => setMode('campaign')} aria-pressed={mode === 'campaign'} className={`rounded-lg px-4 py-3 font-bold outline-none focus-visible:ring-4 focus-visible:ring-orange-300 ${mode === 'campaign' ? 'bg-orange-300 text-slate-950' : 'border border-white/20'}`}>Modo campanha</button></div>
        </div>
        {players.length === 1 && mode === 'training' && <label data-menu-control className="mt-4 flex items-center gap-3 rounded-xl border border-white/15 bg-black/20 p-4 text-sm font-bold outline-none focus-within:ring-4 focus-within:ring-cyan-300">
          <input type="checkbox" checked={trainingBot} onChange={(event) => setTrainingBot(event.target.checked)} className="h-5 w-5 accent-cyan-300" />
          Treinar com bot parceiro (sem dano aos jogadores)
        </label>}
        <p role="status" aria-live="polite" className="mt-4 min-h-6 text-sm text-cyan-100">{message}</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button data-menu-control type="button" onClick={() => start('training')} className="rounded-xl bg-cyan-300 px-7 py-4 text-lg font-black text-slate-950 outline-none transition hover:bg-cyan-200 focus-visible:ring-4 focus-visible:ring-white" aria-label="Treinar">Treinar</button>
          <button data-menu-control type="button" onClick={() => start('campaign')} className="rounded-xl border border-orange-200/40 px-7 py-4 text-lg font-black text-orange-100 outline-none focus-visible:ring-4 focus-visible:ring-white">Começar campanha</button>
          <button data-menu-control type="button" onClick={setSharedKeyboard} className="rounded-xl border border-white/20 px-5 py-4 font-bold outline-none focus-visible:ring-4 focus-visible:ring-cyan-300">Teclado compartilhado</button>
        </div>
      </section>
    </main>
  );
}
