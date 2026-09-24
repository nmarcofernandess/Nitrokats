import type { Aabb, Vec2 } from '../core/model';

const EPSILON = 1e-7;

function closestPoint(point: Vec2, box: Aabb): Vec2 {
  return {
    x: Math.max(box.min.x, Math.min(box.max.x, point.x)),
    z: Math.max(box.min.z, Math.min(box.max.z, point.z)),
  };
}

function distanceSquared(a: Vec2, b: Vec2): number {
  const x = a.x - b.x;
  const z = a.z - b.z;
  return x * x + z * z;
}

function pointInside(point: Vec2, box: Aabb): boolean {
  return point.x >= box.min.x && point.x <= box.max.x && point.z >= box.min.z && point.z <= box.max.z;
}

function insideBounds(point: Vec2, radius: number, bounds: Aabb): boolean {
  return point.x >= bounds.min.x + radius - EPSILON && point.x <= bounds.max.x - radius + EPSILON &&
    point.z >= bounds.min.z + radius - EPSILON && point.z <= bounds.max.z - radius + EPSILON;
}

function separatesFromBox(point: Vec2, radius: number, box: Aabb): boolean {
  return distanceSquared(point, closestPoint(point, box)) >= (radius - EPSILON) ** 2;
}

function pushOut(point: Vec2, radius: number, box: Aabb, bounds?: Aabb): Vec2 {
  const nearest = closestPoint(point, box);
  const dx = point.x - nearest.x;
  const dz = point.z - nearest.z;
  const distance = Math.hypot(dx, dz);
  if (!pointInside(point, box) && distance >= radius) return point;
  if (distance > EPSILON) {
    const depth = radius - distance + EPSILON;
    const separated = { x: point.x + dx / distance * depth, z: point.z + dz / distance * depth };
    if (!bounds || insideBounds(separated, radius, bounds)) return separated;
  }

  const edges = [
    { distance: point.x - box.min.x, x: -1, z: 0 },
    { distance: box.max.x - point.x, x: 1, z: 0 },
    { distance: point.z - box.min.z, x: 0, z: -1 },
    { distance: box.max.z - point.z, x: 0, z: 1 },
  ];
  const separations = edges.map(edge => ({
    position: {
      x: point.x + edge.x * (edge.distance + radius + EPSILON),
      z: point.z + edge.z * (edge.distance + radius + EPSILON),
    },
  }));
  const feasible = separations.filter(candidate => separatesFromBox(candidate.position, radius, box) &&
    (!bounds || insideBounds(candidate.position, radius, bounds)));
  const candidates = feasible.length ? feasible : separations;
  const { position } = candidates.reduce((best, candidate) => {
    const bestDistance = Math.hypot(best.position.x - point.x, best.position.z - point.z);
    const candidateDistance = Math.hypot(candidate.position.x - point.x, candidate.position.z - point.z);
    return candidateDistance < bestDistance ? candidate : best;
  });
  return position;
}

/** Returns the first normalized time at which a swept circle touches an AABB. */
export function sweepCircleAabb(start: Vec2, end: Vec2, radius: number, box: Aabb): number | null {
  if (distanceSquared(start, closestPoint(start, box)) <= radius * radius) return 0;
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const candidates: number[] = [];
  const addFace = (t: number, axis: 'x' | 'z', coordinate: number) => {
    if (t < 0 || t > 1) return;
    const along = axis === 'x' ? start.z + dz * t : start.x + dx * t;
    if (along >= (axis === 'x' ? box.min.z : box.min.x) - EPSILON &&
        along <= (axis === 'x' ? box.max.z : box.max.x) + EPSILON &&
        Math.abs((axis === 'x' ? start.x + dx * t : start.z + dz * t) - coordinate) <= EPSILON) {
      candidates.push(t);
    }
  };

  if (dx > 0) addFace((box.min.x - radius - start.x) / dx, 'x', box.min.x - radius);
  if (dx < 0) addFace((box.max.x + radius - start.x) / dx, 'x', box.max.x + radius);
  if (dz > 0) addFace((box.min.z - radius - start.z) / dz, 'z', box.min.z - radius);
  if (dz < 0) addFace((box.max.z + radius - start.z) / dz, 'z', box.max.z + radius);

  const speedSquared = dx * dx + dz * dz;
  if (speedSquared > EPSILON) {
    for (const x of [box.min.x, box.max.x]) {
      for (const z of [box.min.z, box.max.z]) {
        const ox = start.x - x;
        const oz = start.z - z;
        const b = 2 * (ox * dx + oz * dz);
        const c = ox * ox + oz * oz - radius * radius;
        const discriminant = b * b - 4 * speedSquared * c;
        if (discriminant < 0) continue;
        const t = (-b - Math.sqrt(discriminant)) / (2 * speedSquared);
        const hitX = start.x + dx * t;
        const hitZ = start.z + dz * t;
        const onCornerQuadrant = (x === box.min.x ? hitX <= x : hitX >= x) &&
          (z === box.min.z ? hitZ <= z : hitZ >= z);
        if (t >= 0 && t <= 1 && onCornerQuadrant) candidates.push(t);
      }
    }
  }
  return candidates.length ? Math.min(...candidates) : null;
}

/** Sweeps a circle through boxes and removes inward motion at up to three contacts. */
export function slideCircle(
  position: Vec2,
  delta: Vec2,
  radius: number,
  boxes: readonly Aabb[],
  bounds?: Aabb,
): Vec2 {
  let current = { ...position };
  let remaining = { ...delta };
  for (let pass = 0; pass < 3; pass += 1) {
    for (const box of boxes) current = pushOut(current, radius, box, bounds);
    const end = { x: current.x + remaining.x, z: current.z + remaining.z };
    let earliest: { t: number; box: Aabb } | null = null;
    for (const box of boxes) {
      const t = sweepCircleAabb(current, end, radius, box);
      if (t === null) continue;
      if (t === 0) {
        const nearest = closestPoint(current, box);
        const nx = current.x - nearest.x;
        const nz = current.z - nearest.z;
        if (nx * remaining.x + nz * remaining.z >= -EPSILON) continue;
      }
      if (!earliest || t < earliest.t) earliest = { t, box };
    }
    if (!earliest) return end;

    const length = Math.hypot(remaining.x, remaining.z);
    const safeT = Math.max(0, earliest.t - EPSILON / Math.max(length, 1));
    current = { x: current.x + remaining.x * safeT, z: current.z + remaining.z * safeT };
    const left = { x: remaining.x * (1 - earliest.t), z: remaining.z * (1 - earliest.t) };
    const nearest = closestPoint(current, earliest.box);
    let nx = current.x - nearest.x;
    let nz = current.z - nearest.z;
    const normalLength = Math.hypot(nx, nz);
    if (normalLength > EPSILON) {
      nx /= normalLength;
      nz /= normalLength;
    } else {
      const toCenterX = (earliest.box.min.x + earliest.box.max.x) / 2 - current.x;
      const toCenterZ = (earliest.box.min.z + earliest.box.max.z) / 2 - current.z;
      if (Math.abs(toCenterX) > Math.abs(toCenterZ)) nx = toCenterX > 0 ? -1 : 1;
      else nz = toCenterZ > 0 ? -1 : 1;
    }
    const intoWall = left.x * nx + left.z * nz;
    remaining = intoWall < 0
      ? { x: left.x - nx * intoWall, z: left.z - nz * intoWall }
      : left;
    if (Math.hypot(remaining.x, remaining.z) <= EPSILON) return current;
  }
  return current;
}
