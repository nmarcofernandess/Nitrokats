import { useUiStore } from './uiStore';

const WEAPON_LABELS: Record<string, string> = {
  pulse_rifle: 'Pulse Rifle', scatter_cannon: 'Scatter Cannon', arc_marksman: 'Arc Marksman',
};

function PlayerHud({ player, tone }: {
  player: NonNullable<ReturnType<typeof useUiStore.getState>['snapshot']>['players'][number];
  tone: 'cyan' | 'orange';
}) {
  const accent = tone === 'cyan' ? 'border-cyan-300/50 text-cyan-100' : 'border-orange-300/50 text-orange-100';
  const hpPercent = Math.max(0, Math.min(100, (player.hp / Math.max(player.maxHp, 1)) * 100));
  return (
    <section data-testid={`hud-${player.id}`} aria-label={`Status de ${player.id.toUpperCase()}`} className={`w-[min(42vw,22rem)] rounded-xl border ${accent} bg-slate-950/90 px-3 py-2 shadow-lg backdrop-blur-sm sm:px-4 sm:py-3`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-black tracking-wide">{player.id.toUpperCase()} · {player.catId.toUpperCase()}</h2>
        <span className="text-xs font-bold">{player.status === 'down' ? 'CAÍDO' : 'ATIVO'}</span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs sm:text-sm">
        <span aria-label={`Vida ${player.hp} de ${player.maxHp}`}>HP {player.hp}/{player.maxHp}</span>
        <span aria-label={`Arma ${WEAPON_LABELS[player.weaponId]}`}>{WEAPON_LABELS[player.weaponId]}</span>
      </div>
      <div role="progressbar" aria-label={`Vida de ${player.id.toUpperCase()}`} aria-valuemin={0} aria-valuemax={player.maxHp} aria-valuenow={player.hp} className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-700">
        <div className="h-full rounded-full bg-emerald-400 transition-[width]" style={{ width: `${hpPercent}%` }} />
      </div>
      <p className="mt-1 text-[11px] text-slate-200" aria-label={`Dash de ${player.id.toUpperCase()}`}>
        {player.dashCooldown > 0 ? `Dash recarrega ${player.dashCooldown.toFixed(1)} s` : 'Dash pronto'}
      </p>
    </section>
  );
}

export function Hud() {
  const snapshot = useUiStore((state) => state.snapshot);
  if (!snapshot) return null;
  const p1 = snapshot.players.find((player) => player.id === 'p1');
  const p2 = snapshot.players.find((player) => player.id === 'p2');
  return (
    <>
      <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex justify-center sm:top-4">
        <div data-testid="hud-objective" aria-live="polite" className="rounded-full border border-white/15 bg-slate-950/90 px-4 py-2 text-center text-xs font-bold text-white shadow-lg backdrop-blur-sm sm:text-sm">
          {snapshot.training ? `TREINO · ${snapshot.targetCount} alvos sem dano` : `OBJETIVO · ${snapshot.objective}`} · ONDA {snapshot.wave + 1}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex items-end justify-between gap-3 sm:inset-x-5 sm:bottom-5">
        {p1 && <PlayerHud player={p1} tone="cyan" />}
        {p2 && <PlayerHud player={p2} tone="orange" />}
      </div>
      {snapshot.training && <p className="pointer-events-none absolute bottom-28 left-1/2 z-10 -translate-x-1/2 rounded-lg bg-slate-950/75 px-3 py-2 text-center text-xs text-white shadow sm:bottom-32">Mover: WASD / setas · Atirar: F / K · Dash: G / L · Resgatar: E / O</p>}
    </>
  );
}
