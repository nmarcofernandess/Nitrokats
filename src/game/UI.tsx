import { useGameStore } from './store';
import { audioManager } from './Utils/AudioManager';

export const UI = () => {
  const score = useGameStore((state) => state.score);
  const kills = useGameStore((state) => state.kills);
  const wave = useGameStore((state) => state.wave);
  const health = useGameStore((state) => state.health);
  const showWaveAnnouncement = useGameStore((state) => state.showWaveAnnouncement);
  const weaponAmmo = useGameStore((state) => state.weaponAmmo);
  const gameState = useGameStore((state) => state.gameState);
  const restartGame = useGameStore((state) => state.restartGame);
  const startGame = useGameStore((state) => state.startGame);
  const togglePause = useGameStore((state) => state.togglePause);
  const goToMenu = useGameStore((state) => state.goToMenu);

  if (showWaveAnnouncement && gameState === 'playing') {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
        <h1 className="text-9xl font-black text-yellow-400 neon-text animate-pulse drop-shadow-[0_0_50px_rgba(255,255,0,0.8)]">
          WAVE {wave}
        </h1>
      </div>
    );
  }

  if (gameState === 'menu') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-50">
        <h1 className="text-8xl font-black text-cyan-400 mb-2 neon-text tracking-tight">CYBERCAT</h1>
        <h2 className="text-4xl font-bold text-fuchsia-500 mb-16 neon-text">ARENA SURVIVOR</h2>

        <div className="flex space-x-4">
          <button
            className="bg-cyan-500 hover:bg-cyan-400 text-black px-8 py-3 rounded text-xl font-bold uppercase tracking-widest neon-text"
            onClick={() => {
              audioManager.startMusic();
              startGame('classic');
            }}
          >
            Play Classic
          </button>
          <button
            className="bg-green-600 hover:bg-green-500 text-black px-8 py-3 rounded text-xl font-bold uppercase tracking-widest neon-text"
            onClick={() => {
              audioManager.startMusic();
              startGame('zombie');
            }}
          >
            Play Zombie
          </button>
        </div>

        <div className="mt-12 text-gray-400 text-center text-lg">
          <p className="mb-2">WASD to Move • Mouse to Aim & Shoot</p>
          <p>ESC to Pause • Destroy enemies to survive!</p>
        </div>
      </div>
    );
  }

  if (gameState === 'paused') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-50">
        <h1 className="text-6xl font-black text-yellow-400 mb-8 neon-text">PAUSED</h1>

        <div className="bg-gray-900/90 border-2 border-cyan-500/50 p-8 mb-8 rounded-lg">
          <div className="grid grid-cols-2 gap-6 text-xl">
            <span className="text-cyan-400">WAVE:</span>
            <span className="text-white font-bold text-right text-2xl">{wave}</span>
            <span className="text-cyan-400">KILLS:</span>
            <span className="text-white font-bold text-right text-2xl">{kills}</span>
            <span className="text-fuchsia-400">SCORE:</span>
            <span className="text-fuchsia-300 font-bold text-right text-2xl">{score}</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={togglePause}
            className="px-16 py-4 bg-cyan-500 text-black font-bold text-2xl hover:bg-cyan-400 transition-all cursor-pointer"
          >
            RESUME
          </button>
          <button
            onClick={restartGame}
            className="px-16 py-4 bg-yellow-500 text-black font-bold text-2xl hover:bg-yellow-400 transition-all cursor-pointer"
          >
            RESTART
          </button>
          <button
            onClick={() => {
              audioManager.stopMusic();
              goToMenu();
            }}
            className="px-16 py-4 bg-gray-600 text-white font-bold text-2xl hover:bg-gray-500 transition-all cursor-pointer"
          >
            QUIT
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'gameover') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-50">
        <h1 className="text-7xl font-black text-red-500 mb-8 neon-text">GAME OVER</h1>

        <div className="bg-gray-900/90 border-2 border-red-500/50 p-8 mb-8 rounded-lg">
          <div className="grid grid-cols-2 gap-6 text-2xl">
            <span className="text-gray-400">FINAL WAVE:</span>
            <span className="text-yellow-400 font-bold text-right">{wave}</span>
            <span className="text-gray-400">TOTAL KILLS:</span>
            <span className="text-white font-bold text-right">{kills}</span>
            <span className="text-gray-400">FINAL SCORE:</span>
            <span className="text-fuchsia-400 font-bold text-right">{score}</span>
          </div>
        </div>

        <button
          onClick={restartGame}
          className="px-20 py-5 bg-cyan-500 text-black font-bold text-3xl hover:bg-cyan-400 transition-all cursor-pointer"
        >
          RETRY
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-end items-start p-8">
      <div className="flex flex-col gap-2 p-4 bg-black/80 border-l-4 border-cyan-500 rounded-r-lg backdrop-blur-md shadow-lg shadow-cyan-500/10 min-w-[300px]">
        <div className="flex items-center justify-between gap-4 text-xs font-bold tracking-wider pb-2 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-yellow-500">WAVE</span>
            <span className="text-xl text-yellow-400 font-black neon-text">{wave}</span>
          </div>
          <div className="w-px h-4 bg-gray-700" />
          <div className="flex items-center gap-2">
            <span className="text-gray-400">KILLS</span>
            <span className="text-lg text-white">{kills}</span>
          </div>
          <div className="w-px h-4 bg-gray-700" />
          <div className="text-fuchsia-400 neon-text">{score.toString().padStart(6, '0')}</div>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-end">
            <span className="text-[10px] text-cyan-400 font-bold tracking-widest">INTEGRITY</span>
            <span className="text-cyan-300 text-xs font-bold">{Math.round(health)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-900 rounded-sm overflow-hidden relative">
            <div
              className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)] transition-all duration-300"
              style={{ width: `${health}%` }}
            />
          </div>
        </div>

        {weaponAmmo > 0 && (
          <div className="flex justify-between items-center border-t border-gray-800 pt-2 text-xs font-bold">
            <span className="text-yellow-300 tracking-widest">SPREAD AMMO</span>
            <span className="text-yellow-100 text-sm">{weaponAmmo}</span>
          </div>
        )}
      </div>

      <div className="mt-2 text-cyan-900/40 text-[9px] tracking-[0.2em] font-mono ml-1">
        SYSTEM: ONLINE // [ESC] MENU
      </div>
    </div>
  );
};
