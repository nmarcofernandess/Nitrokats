import type { InputFrame, PlayerState, Vec2, World } from '../core/model';
import { slideCircle } from './collision';

const STEP_SECONDS = 1 / 60;
const MAX_SPEED = 8;
const ACCELERATION = 40;
const DASH_SPEED = 18;
const DASH_SECONDS = 0.15;
const DASH_COOLDOWN_SECONDS = 1.4;
const PLAYER_RADIUS = 0.85;
const TIMER_EPSILON = 1e-9;

function finite(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function normalized(value: Vec2): Vec2 {
  const x = finite(value.x);
  const z = finite(value.z);
  const length = Math.hypot(x, z);
  const scale = length > 1 ? 1 / length : 1;
  return { x: x * scale, z: z * scale };
}

function approach(current: Vec2, target: Vec2, maximumDelta: number): Vec2 {
  const dx = target.x - current.x;
  const dz = target.z - current.z;
  const distance = Math.hypot(dx, dz);
  if (distance <= maximumDelta || distance === 0) return { ...target };
  const scale = maximumDelta / distance;
  return { x: current.x + dx * scale, z: current.z + dz * scale };
}

function tickTimer(seconds: number): number {
  const remaining = seconds - STEP_SECONDS;
  return remaining <= TIMER_EPSILON ? 0 : remaining;
}

function constrainToBounds(position: Vec2, velocity: Vec2, world: World): void {
  const { min, max } = world.bounds;
  const minX = min.x + PLAYER_RADIUS;
  const maxX = max.x - PLAYER_RADIUS;
  const minZ = min.z + PLAYER_RADIUS;
  const maxZ = max.z - PLAYER_RADIUS;
  if (position.x < minX || position.x > maxX) velocity.x = 0;
  if (position.z < minZ || position.z > maxZ) velocity.z = 0;
  position.x = Math.max(minX, Math.min(maxX, position.x));
  position.z = Math.max(minZ, Math.min(maxZ, position.z));
}

function stepPlayer(player: PlayerState, frame: InputFrame[PlayerState['id']], world: World): void {
  const command = frame;
  const move = normalized(command?.move ?? { x: 0, z: 0 });
  if (player.status === 'down') {
    player.dashWasPressed = command?.dash === true;
    player.dashRemaining = 0;
    player.velocity = { x: move.x * 1.5, z: move.z * 1.5 };
    const moved = slideCircle(player.position, {
      x: player.velocity.x * STEP_SECONDS,
      z: player.velocity.z * STEP_SECONDS,
    }, PLAYER_RADIUS, world.colliders, world.bounds);
    player.position = moved;
    constrainToBounds(player.position, player.velocity, world);
    return;
  }
  const desired = { x: move.x * MAX_SPEED, z: move.z * MAX_SPEED };
  const dashPressed = command?.dash === true;
  const dashEdge = dashPressed && !player.dashWasPressed;
  player.dashWasPressed = dashPressed;
  player.dashCooldown = tickTimer(player.dashCooldown);

  if (dashEdge && player.dashCooldown === 0 && player.status === 'active') {
    const directionLength = Math.hypot(move.x, move.z);
    const aim = normalized(player.aim);
    const aimLength = Math.hypot(aim.x, aim.z);
    const direction = directionLength > 0
      ? move
      : aimLength > 0 ? aim : normalized(player.velocity);
    player.velocity = { x: direction.x * DASH_SPEED, z: direction.z * DASH_SPEED };
    player.dashRemaining = DASH_SECONDS;
    player.dashCooldown = DASH_COOLDOWN_SECONDS;
  }

  const dashing = player.dashRemaining > 0;
  if (!dashing) player.velocity = approach(player.velocity, desired, ACCELERATION * STEP_SECONDS);
  const intendedDelta = { x: player.velocity.x * STEP_SECONDS, z: player.velocity.z * STEP_SECONDS };
  const moved = slideCircle(player.position, intendedDelta, PLAYER_RADIUS, world.colliders, world.bounds);
  player.position = moved;
  constrainToBounds(player.position, player.velocity, world);

  if (dashing) {
    player.dashRemaining = tickTimer(player.dashRemaining);
    if (player.dashRemaining === 0) player.velocity = { ...desired };
  }
}

/** Applies one deterministic movement step using only the fixed simulation frame. */
export function stepMovement(world: World, input: InputFrame): void {
  for (const player of world.players) stepPlayer(player, input[player.id], world);
}
