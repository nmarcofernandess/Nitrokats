import { WEAPONS, WEAPON_ROTATION_ORDER } from '../content/weapons';
import type { InputFrame, PlayerState, ProjectileState, Vec2, World } from '../core/model';
import { nextRandom } from '../core/rng';
import { emitGameEvent } from '../core/events';

const STEP_SECONDS = 1 / 60;
export const MAX_PROJECTILES = 256;
const TIMER_EPSILON = 1e-9;
export const LOGICAL_MUZZLE_OFFSET_METERS = 0.9;
const PROJECTILE_LIFETIME_SECONDS = 2.5;

/** Weapon selection, cadence, spread and projectile creation are owned by each player. */
export function stepWeapons(world: World, input: InputFrame): void {
  if (world.phase !== 'playing') return;
  for (const player of world.players) {
    const command = input[player.id];
    player.shotCooldown = decrementTimer(player.shotCooldown);

    const switchHeld = command?.nextWeapon === true;
    const switchPressed = switchHeld && !player.nextWeaponWasPressed;
    player.nextWeaponWasPressed = switchHeld;
    if (switchPressed) selectNextWeapon(player);

    if (!command?.fire || player.status !== 'active' || player.shotCooldown > 0) continue;
    const weapon = WEAPONS[player.weaponId];
    if (!weapon) continue;
    const aim = normalize(command.aim.x || command.aim.z ? command.aim : player.aim);
    if (Math.hypot(aim.x, aim.z) === 0) continue;
    player.aim = aim;
    const muzzle = logicalMuzzlePosition(player.position, aim);
    const availableSlots = Math.max(0, MAX_PROJECTILES - world.projectiles.length);
    const acceptedPellets = Math.min(weapon.pelletCount, availableSlots);
    world.projectileSaturationCount += weapon.pelletCount - acceptedPellets;
    if (acceptedPellets === 0) continue;

    for (let pellet = 0; pellet < acceptedPellets; pellet += 1) {
      const angle = (nextRandom(world) * 2 - 1) * weapon.spreadAngle;
      const direction = rotate(aim, angle);
      const projectile: ProjectileState = {
        id: `b:${world.nextEntityId++}`,
        ownerId: player.id,
        team: 'players',
        position: { ...muzzle },
        previousPosition: { ...muzzle },
        velocity: { x: direction.x * weapon.projectileSpeed, z: direction.z * weapon.projectileSpeed },
        damage: weapon.damage,
        lifeSeconds: PROJECTILE_LIFETIME_SECONDS,
      };
      world.projectiles.push(projectile);
    }
    player.shotCooldown = weapon.shotIntervalSeconds;
    emitGameEvent(world, { type: 'shot', playerId: player.id, position: { ...muzzle } });
  }
}

/** Shared logical barrel origin for combat and the later visual muzzle marker. */
export function logicalMuzzlePosition(position: Vec2, direction: Vec2): Vec2 {
  return {
    x: position.x + direction.x * LOGICAL_MUZZLE_OFFSET_METERS,
    z: position.z + direction.z * LOGICAL_MUZZLE_OFFSET_METERS,
  };
}

function selectNextWeapon(player: PlayerState): void {
  const index = WEAPON_ROTATION_ORDER.indexOf(player.weaponId);
  const nextIndex = index < 0 ? 0 : (index + 1) % WEAPON_ROTATION_ORDER.length;
  player.weaponId = WEAPON_ROTATION_ORDER[nextIndex];
}

function decrementTimer(seconds: number): number {
  const remaining = seconds - STEP_SECONDS;
  return remaining <= TIMER_EPSILON ? 0 : remaining;
}

function normalize(vector: Vec2): Vec2 {
  const x = Number.isFinite(vector.x) ? vector.x : 0;
  const z = Number.isFinite(vector.z) ? vector.z : 0;
  const length = Math.hypot(x, z);
  return length > 0 ? { x: x / length, z: z / length } : { x: 0, z: 0 };
}

function rotate(vector: Vec2, angle: number): Vec2 {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return { x: vector.x * cosine - vector.z * sine, z: vector.x * sine + vector.z * cosine };
}
