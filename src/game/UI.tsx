import { useGameStore } from './store';

export const UI = () => {
    const score = useGameStore((state) => state.score);
    const health = useGameStore((state) => state.health);
    const gameOver = useGameStore((state) => state.gameOver);
    const restartGame = useGameStore((state) => state.restartGame);

    if (gameOver) {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white z-50">
                <h1 className="text-6xl font-bold text-red-500 mb-4 neon-text">GAME OVER</h1>
                <p className="text-2xl mb-8">SCORE: {score}</p>
                <button
                    onClick={restartGame}
                    className="px-8 py-4 bg-cyan-500 text-black font-bold text-xl hover:bg-cyan-400 transition-colors"
                >
                    RETRY
                </button>
            </div>
        );
    }

    return (
        <div className="absolute top-0 left-0 w-full p-8 pointer-events-none z-10 flex justify-between text-white font-mono">
            {/* HEALTH */}
            <div className="flex flex-col">
                <span className="text-sm text-cyan-500 mb-1">INTEGRITY</span>
                <div className="w-64 h-6 bg-gray-900 border border-cyan-500/50 relative">
                    <div
                        className="h-full bg-cyan-500 transition-all duration-300"
                        style={{ width: `${health}%` }}
                    />
                </div>
            </div>

            {/* SCORE */}
            <div className="flex flex-col items-end">
                <span className="text-sm text-magenta-500 mb-1">SCORE</span>
                <span className="text-4xl font-bold text-magenta-500 neon-text">{score.toString().padStart(6, '0')}</span>
            </div>
        </div>
    );
};
