import type { Aabb, ProjectileState, Vec2, World } from '../core/model';
import { applyDamage } from './damage';

const STEP_SECONDS = 1 / 60;
const PLAYER_RADIUS = 0.85;
const ENEMY_RADIUS = 1;
const TTL_EPSILON = 1e-9;

type Candidate = { t: number; kind: 'wall' | 'target'; id: string };

/** Advances projectiles once, sweeps their full segment, and resolves a single nearest impact. */
export function stepProjectiles(world: World): void {
  if (world.phase !== 'playing') return;
  const survivors: ProjectileState[] = [];
  for (const projectile of world.projectiles) {
    if (projectile.lifeSeconds <= 0 || !isFiniteProjectile(projectile)) continue;
    projectile.previousPosition = { ...projectile.position };
    projectile.position = {
      x: projectile.position.x + projectile.velocity.x * STEP_SECONDS,
      z: projectile.position.z + projectile.velocity.z * STEP_SECONDS,
    };
    if (!Number.isFinite(projectile.position.x) || !Number.isFinite(projectile.position.z)) continue;

    const impact = findImpact(world, projectile);
    if (impact) {
      if (impact.kind === 'target') {
        applyDamage(world, impact.id, projectile.damage, {
          team: projectile.team,
          ownerId: projectile.ownerId,
        });
      }
      continue;
    }

    projectile.lifeSeconds = Math.max(0, projectile.lifeSeconds - STEP_SECONDS);
    if (projectile.lifeSeconds > TTL_EPSILON) survivors.push(projectile);
  }
  world.projectiles = survivors;
}

function findImpact(world: World, projectile: ProjectileState): Candidate | null {
  const candidates: Candidate[] = [];
  for (const collider of world.colliders) {
    const t = segmentAabb(projectile.previousPosition, projectile.position, collider);
    if (t !== null) candidates.push({ t, kind: 'wall', id: aabbId(collider) });
  }
  const boundsHit = segmentBoundsExit(projectile.previousPosition, projectile.position, world.bounds);
  if (boundsHit !== null) candidates.push({ t: boundsHit, kind: 'wall', id: 'world-bounds' });

  if (projectile.team === 'players') {
    for (const enemy of world.enemies) {
      if (enemy.status !== 'alive' || enemy.hp <= 0) continue;
      const t = segmentCircle(projectile.previousPosition, projectile.position, enemy.position, ENEMY_RADIUS);
      if (t !== null) candidates.push({ t, kind: 'target', id: enemy.id });
    }
  } else {
    for (const player of world.players) {
      if (player.status !== 'active' || player.hp <= 0) continue;
      const t = segmentCircle(projectile.previousPosition, projectile.position, player.position, PLAYER_RADIUS);
      if (t !== null) candidates.push({ t, kind: 'target', id: player.id });
    }
  }

  return candidates
    .filter(candidate => candidate.t >= 0 && candidate.t <= 1)
    .sort((a, b) => a.t - b.t || (a.kind === b.kind ? a.id.localeCompare(b.id) : a.kind === 'wall' ? -1 : 1))[0] ?? null;
}

/** First segment parameter where the segment enters the rectangle. */
function segmentAabb(start: Vec2, end: Vec2, box: Aabb): number | null {
  let near = 0;
  let far = 1;
  for (const [origin, delta, min, max] of [
    [start.x, end.x - start.x, box.min.x, box.max.x],
    [start.z, end.z - start.z, box.min.z, box.max.z],
  ]) {
    if (Math.abs(delta) < 1e-12) {
      if (origin < min || origin > max) return null;
      continue;
    }
    let axisNear = (min - origin) / delta;
    let axisFar = (max - origin) / delta;
    if (axisNear > axisFar) [axisNear, axisFar] = [axisFar, axisNear];
    near = Math.max(near, axisNear);
    far = Math.min(far, axisFar);
    if (near > far) return null;
  }
  return near <= 1 && far >= 0 ? Math.max(0, near) : null;
}

function segmentCircle(start: Vec2, end: Vec2, center: Vec2, radius: number): number | null {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const fx = start.x - center.x;
  const fz = start.z - center.z;
  const a = dx * dx + dz * dz;
  const c = fx * fx + fz * fz - radius * radius;
  if (c <= 0) return 0;
  if (a <= 1e-18) return null;
  const b = 2 * (fx * dx + fz * dz);
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;
  const t = (-b - Math.sqrt(discriminant)) / (2 * a);
  return t >= 0 && t <= 1 ? t : null;
}

function segmentBoundsExit(start: Vec2, end: Vec2, bounds: Aabb): number | null {
  const inside = (point: Vec2) => point.x >= bounds.min.x && point.x <= bounds.max.x
    && point.z >= bounds.min.z && point.z <= bounds.max.z;
  if (!inside(start)) return 0;
  if (inside(end)) return null;
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const candidates: number[] = [];
  if (dx > 0) candidates.push((bounds.max.x - start.x) / dx);
  if (dx < 0) candidates.push((bounds.min.x - start.x) / dx);
  if (dz > 0) candidates.push((bounds.max.z - start.z) / dz);
  if (dz < 0) candidates.push((bounds.min.z - start.z) / dz);
  return Math.min(...candidates.filter(t => t >= 0 && t <= 1));
}

function aabbId(box: Aabb): string {
  return `wall:${box.min.x},${box.min.z}:${box.max.x},${box.max.z}`;
}

function isFiniteProjectile(projectile: ProjectileState): boolean {
  return [projectile.position.x, projectile.position.z, projectile.previousPosition.x,
    projectile.previousPosition.z, projectile.velocity.x, projectile.velocity.z,
    projectile.damage, projectile.lifeSeconds].every(Number.isFinite);
}
