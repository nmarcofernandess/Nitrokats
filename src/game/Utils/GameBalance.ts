// Game Balance Calculations
export const GameBalance = {
    // Base Stats
    baseEnemyDamage: 10,
    damageScalePerWave: 0.2, // 20% increase per wave

    // Calculate damage based on current wave
    getDamageForWave: (wave: number) => {
        return Math.floor(GameBalance.baseEnemyDamage * (1 + (wave - 1) * GameBalance.damageScalePerWave));
    },

    // Wave Progression
    // How many kills needed to clear a wave?
    // Let's say: 3 kills wave 1, then +2 per wave
    getKillsNeededForWave: (wave: number) => {
        return 3 + (wave - 1) * 2;
    },

    // Enemy Toughness
    // Player deals 10 damage per shot.
    // Wave 1: 30 HP (3 shots)
    // Scaling: +10 HP (1 extra shot) per wave.
    getEnemyHealthForWave: (wave: number) => {
        return 30 + (wave - 1) * 10;
    }
};
