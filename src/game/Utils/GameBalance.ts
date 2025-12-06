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
    // Wave 1: 10 enemies, Wave 2: 20, etc.
    getKillsNeededForWave: (wave: number) => {
        return wave * 10;
    },

    // Enemy Toughness
    // Player deals 10 damage per shot.
    // Wave 1: 30 HP (3 shots)
    // Scaling: +10 HP (1 extra shot) per wave.
    getEnemyHealthForWave: (wave: number) => {
        return 30 + (wave - 1) * 10;
    }
};
