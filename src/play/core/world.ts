import type {
  CatId,
  EnemyKind,
  PlayerConfig,
  PlayerState,
  RunConfig,
  Vec2,
  WeaponId,
  World,
} from './model';

const CAT_IDS: readonly CatId[] = ['anakin', 'yang', 'maya', 'ivy'];
const WEAPON_IDS: readonly WeaponId[] = ['pulse_rifle', 'scatter_cannon', 'arc_marksman'];
const ENEMY_KINDS: readonly EnemyKind[] = ['runner', 'gunner', 'brute', 'mechacat'];
const PLAYER_STARTS: Readonly<Record<'p1' | 'p2', Vec2>> = {
  p1: { x: -1, z: 0 },
  p2: { x: 1, z: 0 },
};

function cloneConfig(config: RunConfig): RunConfig {
  return { ...config, players: config.players.map(player => ({ ...player })) };
}

function validatePlayer(player: PlayerConfig): void {
  if (!CAT_IDS.includes(player.catId)) throw new Error(`ID de catálogo de gato inválido: ${String(player.catId)}`);
  if (!WEAPON_IDS.includes(player.weaponId)) throw new Error(`ID de catálogo de arma inválido: ${String(player.weaponId)}`);
}

function createPlayer(playerConfig: PlayerConfig): PlayerState {
  const position = { ...PLAYER_STARTS[playerConfig.id] };
  return {
    ...playerConfig,
    position,
    velocity: { x: 0, z: 0 },
    aim: { x: 0, z: 1 },
    hp: 100,
    maxHp: 100,
    status: 'active',
    shotCooldown: 0,
    dashCooldown: 0,
    dashRemaining: 0,
    invulnerableSeconds: 0,
    downSeconds: 0,
    reviveProgress: 0,
    perks: [],
  };
}

export function createWorld(config: RunConfig): World {
  if (!Number.isFinite(config.seed)) throw new Error('A seed deve ser finita');
  if (!Array.isArray(config.players) || config.players.length < 1 || config.players.length > 2) {
    throw new Error('A configuração precisa de 1 ou 2 jogadores');
  }
  const ids = new Set(config.players.map(player => player.id));
  if (ids.size !== config.players.length) throw new Error('ID de jogador duplicado');
  config.players.forEach(validatePlayer);

  const copiedConfig = cloneConfig(config);
  return {
    config: copiedConfig,
    rngState: config.seed >>> 0,
    nextEntityId: 1,
    tick: 0,
    elapsed: 0,
    phase: 'playing',
    resumePhase: null,
    players: copiedConfig.players.map(createPlayer),
    enemies: [],
    projectiles: [],
    stageIndex: 0,
    objective: null,
    encounter: null,
    perkOptions: [],
    events: [],
    result: null,
  };
}

export function spawnEnemy(
  world: World,
  enemy: { kind: EnemyKind; position: Vec2; hp: number },
): string {
  if (!ENEMY_KINDS.includes(enemy.kind)) throw new Error(`Tipo de inimigo inválido: ${String(enemy.kind)}`);
  if (!Number.isFinite(enemy.position.x) || !Number.isFinite(enemy.position.z)) {
    throw new Error('A posição do inimigo precisa ser finita');
  }
  if (!Number.isFinite(enemy.hp) || enemy.hp <= 0) throw new Error('A vida do inimigo precisa ser positiva e finita');
  const id = `e:${world.nextEntityId}`;
  world.nextEntityId += 1;
  world.enemies.push({
    id,
    kind: enemy.kind,
    position: { ...enemy.position },
    hp: enemy.hp,
    maxHp: enemy.hp,
    status: 'alive',
  });
  return id;
}
