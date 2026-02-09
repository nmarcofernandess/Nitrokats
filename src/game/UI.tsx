import { useEffect, useState } from 'react';
import { useGameStore } from './store';
import { audioManager } from './Utils/AudioManager';
import { RUN_PERK_CONFIG } from './config/perks';

export const UI = () => {
  const score = useGameStore((state) => state.score);
  const kills = useGameStore((state) => state.kills);
  const wave = useGameStore((state) => state.wave);
  const health = useGameStore((state) => state.health);
  const maxHealth = useGameStore((state) => state.maxHealth);
  const selectedWeapon = useGameStore((state) => state.selectedWeapon);
  const gameMode = useGameStore((state) => state.gameMode);
  const currentObjective = useGameStore((state) => state.currentObjective);
  const runPerks = useGameStore((state) => state.runPerks);
  const showWaveAnnouncement = useGameStore((state) => state.showWaveAnnouncement);
  const gameState = useGameStore((state) => state.gameState);
  const matchPhase = useGameStore((state) => state.matchPhase);
  const perkOptions = useGameStore((state) => state.perkOptions);

  const restartGame = useGameStore((state) => state.restartGame);
  const startGame = useGameStore((state) => state.startGame);
  const togglePause = useGameStore((state) => state.togglePause);
  const goToMenu = useGameStore((state) => state.goToMenu);
  const grantRunPerk = useGameStore((state) => state.grantRunPerk);

  const requestGamePointerLock = () => {
    const canvas = document.querySelector('canvas');
    if (canvas instanceof HTMLCanvasElement && document.pointerLockElement !== canvas) {
      const lockRequest = canvas.requestPointerLock();
      if (lockRequest && 'catch' in lockRequest) {
        lockRequest.catch(() => undefined);
      }
    }
  };

  const [pointerLocked, setPointerLocked] = useState(false);

  useEffect(() => {
    const onPointerLockChange = () => {
      setPointerLocked(Boolean(document.pointerLockElement));
    };

    document.addEventListener('pointerlockchange', onPointerLockChange);
    onPointerLockChange();

    return () => {
      document.removeEventListener('pointerlockchange', onPointerLockChange);
    };
  }, []);

  if (gameState === 'menu') {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90">
        <h1 className="mb-3 text-8xl font-black tracking-tight text-cyan-400">CATZ COMBIES</h1>
        <h2 className="mb-10 text-3xl font-bold text-fuchsia-500">Tank or Zombie</h2>

        <div className="flex gap-4">
          <button
            className="rounded bg-cyan-500 px-9 py-4 text-xl font-black uppercase tracking-widest text-black transition hover:bg-cyan-400"
            onClick={() => {
              audioManager.startMusic();
              startGame('classic');
              requestGamePointerLock();
            }}
          >
            Play Tank
          </button>
          <button
            className="rounded bg-green-600 px-9 py-4 text-xl font-black uppercase tracking-widest text-black transition hover:bg-green-500"
            onClick={() => {
              audioManager.startMusic();
              startGame('zombie');
              requestGamePointerLock();
            }}
          >
            Play Zombie
          </button>
        </div>

        <div className="mt-10 text-center text-lg text-gray-400">
          <p className="mb-1">WASD move • Hold LMB shoot • Mouse look</p>
          <p>ESC pause • Click game to lock mouse</p>
        </div>
      </div>
    );
  }

  if (gameState === 'paused') {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90">
        <h1 className="mb-8 text-6xl font-black text-yellow-400">PAUSED</h1>

        <div className="mb-8 rounded-lg border-2 border-cyan-500/50 bg-gray-900/90 p-8">
          <div className="grid grid-cols-2 gap-6 text-xl">
            <span className="text-cyan-400">WAVE:</span>
            <span className="text-right text-2xl font-bold text-white">{wave}</span>
            <span className="text-cyan-400">KILLS:</span>
            <span className="text-right text-2xl font-bold text-white">{kills}</span>
            <span className="text-fuchsia-400">SCORE:</span>
            <span className="text-right text-2xl font-bold text-fuchsia-300">{score}</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={togglePause}
            className="cursor-pointer bg-cyan-500 px-16 py-4 text-2xl font-bold text-black transition-all hover:bg-cyan-400"
          >
            RESUME
          </button>
          <button
            onClick={restartGame}
            className="cursor-pointer bg-yellow-500 px-16 py-4 text-2xl font-bold text-black transition-all hover:bg-yellow-400"
          >
            RESTART
          </button>
          <button
            onClick={() => {
              audioManager.stopMusic();
              goToMenu();
            }}
            className="cursor-pointer bg-gray-600 px-16 py-4 text-2xl font-bold text-white transition-all hover:bg-gray-500"
          >
            QUIT
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'gameover') {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90">
        <h1 className="mb-8 text-7xl font-black text-red-500">RUN FAILED</h1>

        <div className="mb-8 rounded-lg border-2 border-red-500/50 bg-gray-900/90 p-8">
          <div className="grid grid-cols-2 gap-6 text-2xl">
            <span className="text-gray-400">FINAL WAVE:</span>
            <span className="text-right font-bold text-yellow-400">{wave}</span>
            <span className="text-gray-400">TOTAL KILLS:</span>
            <span className="text-right font-bold text-white">{kills}</span>
            <span className="text-gray-400">FINAL SCORE:</span>
            <span className="text-right font-bold text-fuchsia-400">{score}</span>
          </div>
        </div>

        <button
          onClick={restartGame}
          className="cursor-pointer bg-cyan-500 px-20 py-5 text-3xl font-bold text-black transition-all hover:bg-cyan-400"
        >
          RETRY
        </button>
      </div>
    );
  }

  if (matchPhase === 'perk_select') {
    return (
      <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 pointer-events-auto">
        <div className="w-[900px] rounded-xl border border-cyan-700 bg-[#040d1f]/95 p-8">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">Wave Cleared</p>
          <h3 className="mt-2 text-3xl font-black text-white">Choose One Perk</h3>

          <div className="mt-6 grid grid-cols-3 gap-4">
            {perkOptions.map((perkId) => (
              <button
                key={perkId}
                onClick={() => grantRunPerk(perkId)}
                className="rounded-lg border border-cyan-700 bg-[#0b1f40] p-4 text-left transition hover:border-cyan-400 hover:bg-[#133469]"
              >
                <p className="text-xl font-black text-cyan-200">{RUN_PERK_CONFIG[perkId].label}</p>
                <p className="mt-2 text-sm text-blue-200">{RUN_PERK_CONFIG[perkId].description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {showWaveAnnouncement && (
        <div className="absolute inset-0 z-30 flex items-center justify-center">
          <h1 className="animate-pulse text-8xl font-black text-yellow-400 drop-shadow-[0_0_50px_rgba(255,255,0,0.8)]">
            WAVE {wave}
          </h1>
        </div>
      )}

      {!pointerLocked && gameState === 'playing' && (
        <div className="absolute left-1/2 top-8 -translate-x-1/2 rounded bg-black/70 px-4 py-2 text-sm font-bold uppercase tracking-widest text-cyan-200">
          Click to lock mouse
        </div>
      )}

      <div className="absolute left-8 bottom-8 min-w-[320px] rounded-r-lg border-l-4 border-cyan-500 bg-black/80 p-4 shadow-lg shadow-cyan-500/10 backdrop-blur-md">
        <div className="border-b border-gray-800 pb-2 text-xs font-bold tracking-wider">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-yellow-500">WAVE</span>
              <span className="text-xl font-black text-yellow-400">{wave}</span>
            </div>
            <div className="h-4 w-px bg-gray-700" />
            <div className="flex items-center gap-2">
              <span className="text-gray-400">KILLS</span>
              <span className="text-lg text-white">{kills}</span>
            </div>
            <div className="h-4 w-px bg-gray-700" />
            <div className="font-black text-fuchsia-400">{score.toString().padStart(6, '0')}</div>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-1">
          <div className="flex items-end justify-between">
            <span className="text-[10px] font-bold tracking-widest text-cyan-400">INTEGRITY</span>
            <span className="text-xs font-bold text-cyan-300">
              {Math.round(health)} / {Math.round(maxHealth)}
            </span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-sm bg-gray-900">
            <div
              className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)] transition-all duration-200"
              style={{ width: `${Math.max(0, Math.min(100, (health / Math.max(maxHealth, 1)) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {currentObjective && (
        <div className="absolute left-1/2 top-16 w-[460px] -translate-x-1/2 rounded-lg border border-cyan-700/70 bg-black/70 px-4 py-3 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-cyan-300">
              {currentObjective.title}
            </p>
            <p className="text-xs font-bold text-cyan-100">
              {Math.min(currentObjective.progressValue, currentObjective.targetValue).toFixed(
                Number.isInteger(currentObjective.targetValue) ? 0 : 2,
              )}{' '}
              / {currentObjective.targetValue}
            </p>
          </div>
          <p className="mt-1 text-xs text-slate-200">{currentObjective.description}</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-900">
            <div
              className="h-full bg-cyan-400 transition-all duration-200"
              style={{
                width: `${Math.max(
                  0,
                  Math.min(100, (currentObjective.progressValue / Math.max(currentObjective.targetValue, 1)) * 100),
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="absolute right-8 bottom-8 min-w-[230px] rounded border border-fuchsia-500/30 bg-black/70 p-4 text-xs font-bold uppercase tracking-[0.16em] text-fuchsia-100 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-fuchsia-300">Mode</span>
          <span>{gameMode}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-fuchsia-300">Weapon</span>
          <span>{selectedWeapon.replace('_', ' ')}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-fuchsia-300">Perks</span>
          <span>{runPerks.length}</span>
        </div>
      </div>

      <div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2">
        <span className="absolute left-1/2 top-1/2 h-[2px] w-6 -translate-x-1/2 -translate-y-1/2 bg-cyan-300/85" />
        <span className="absolute left-1/2 top-1/2 h-6 w-[2px] -translate-x-1/2 -translate-y-1/2 bg-cyan-300/85" />
      </div>

      <div className="absolute bottom-4 left-9 text-[10px] font-mono tracking-[0.2em] text-cyan-900/40">
        SYSTEM ONLINE // [ESC] MENU
      </div>
    </div>
  );
};
