// Centralized game-balance knobs.
export const GameBalance = {
  baseEnemyDamage: 10,
  damageScalePerWave: 0.2,

  basePlayerDamage: 12,
  playerDamageScalePerWave: 0.08,

  getDamageForWave: (wave: number) =>
    Math.floor(GameBalance.baseEnemyDamage * (1 + (wave - 1) * GameBalance.damageScalePerWave)),

  getPlayerDamageForWave: (wave: number) =>
    Math.floor(GameBalance.basePlayerDamage * (1 + (wave - 1) * GameBalance.playerDamageScalePerWave)),

  getKillsNeededForWave: (wave: number) => wave * 10,

  getEnemyHealthForWave: (wave: number) => 30 + (wave - 1) * 10,
};
