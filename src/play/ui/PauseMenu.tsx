import { useEffect, useRef, useState } from 'react';
import type { RunMode } from '../core/model';
import { moveMenuFocus } from './MenuInput';
import type { MenuCommand } from '../input/bindings';

export interface PauseMenuProps {
  open: boolean;
  canRestart: boolean;
  mode: RunMode;
  onContinue: () => void;
  onRestart: () => void;
  onReturnToLobby: () => void;
  controllerPulse: { command: MenuCommand; sequence: number } | null;
}

export function PauseMenu({ open, canRestart, mode, onContinue, onRestart, onReturnToLobby, controllerPulse }: PauseMenuProps) {
  const [confirmingRestart, setConfirmingRestart] = useState(false);
  const focusIndex = useRef(0);
  const actionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const lastNavigation = useRef(0);

  useEffect(() => {
    if (open) {
      focusIndex.current = 0;
      requestAnimationFrame(() => actionRefs.current[0]?.focus());
    }
  }, [open, confirmingRestart]);

  useEffect(() => {
    if (!controllerPulse || !open) return;
    const command = controllerPulse.command;
    const frame = requestAnimationFrame(() => {
      const now = performance.now();
      if ((command.navX || command.navY) && now - lastNavigation.current > 220) {
        lastNavigation.current = now;
        focusIndex.current = moveMenuFocus(focusIndex.current, confirmingRestart ? 2 : 3, command);
        actionRefs.current[focusIndex.current]?.focus({ preventScroll: true });
      }
      if (command.confirmPressed) actionRefs.current[focusIndex.current]?.click();
    });
    return () => cancelAnimationFrame(frame);
  }, [controllerPulse, open, confirmingRestart]);

  if (!open) return null;
  if (confirmingRestart) {
    return (
      <div className="absolute inset-0 z-30 grid place-items-center bg-black/70 p-5" role="presentation">
        <section role="dialog" aria-modal="true" aria-label="Confirmar recomeço" className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-950 p-7 text-center text-white shadow-2xl">
          <h2 id="restart-title" className="text-2xl font-black">{mode === 'training' ? 'Recomeçar treino?' : 'Recomeçar campanha?'}</h2>
          <p className="mt-2 text-sm text-slate-200">O combate atual será descartado e uma arena nova será criada.</p>
          <div className="mt-6 flex justify-center gap-3">
            <button ref={(element) => { actionRefs.current[0] = element; }} type="button" onClick={() => { focusIndex.current = 0; setConfirmingRestart(false); }} className="rounded-lg border border-white/25 px-5 py-3 font-bold outline-none focus-visible:ring-4 focus-visible:ring-cyan-300">Cancelar</button>
            <button ref={(element) => { actionRefs.current[1] = element; }} type="button" onClick={onRestart} className="rounded-lg bg-cyan-300 px-5 py-3 font-black text-slate-950 outline-none focus-visible:ring-4 focus-visible:ring-white">Confirmar recomeço</button>
          </div>
        </section>
      </div>
    );
  }
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-black/65 p-5" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="pause-title" aria-label="Partida pausada" className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-950 p-7 text-center text-white shadow-2xl">
        <h2 id="pause-title" className="text-3xl font-black">Partida pausada</h2>
        <p className="mt-2 text-slate-200">Esc ou Start abre esta pausa.</p>
        <div className="mt-6 grid gap-3">
          <button ref={(element) => { actionRefs.current[0] = element; }} type="button" onClick={onContinue} className="rounded-lg bg-cyan-300 px-6 py-3 font-black text-slate-950 outline-none focus-visible:ring-4 focus-visible:ring-white">Continuar</button>
          <button ref={(element) => { actionRefs.current[1] = element; }} type="button" disabled={!canRestart} onClick={() => { focusIndex.current = 0; setConfirmingRestart(true); }} className="rounded-lg border border-white/25 px-6 py-3 font-bold outline-none focus-visible:ring-4 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-50">Recomeçar</button>
          <button ref={(element) => { actionRefs.current[2] = element; }} type="button" onClick={onReturnToLobby} className="rounded-lg border border-white/25 px-6 py-3 font-bold outline-none focus-visible:ring-4 focus-visible:ring-orange-300">Voltar ao lobby</button>
        </div>
      </section>
    </div>
  );
}
