import type { World } from './model';

/** Advances the world's seeded PRNG and returns a value in [0, 1). */
export function nextRandom(world: World): number {
  let value = (world.rngState + 0x6d2b79f5) >>> 0;
  world.rngState = value;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}
