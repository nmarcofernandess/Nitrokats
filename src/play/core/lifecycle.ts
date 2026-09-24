import type { World } from './model';

export function pauseWorld(world: World): void {
  if (world.phase !== 'playing' && world.phase !== 'intermission') return;
  world.resumePhase = world.phase;
  world.phase = 'paused';
}

export function resumeWorld(world: World): void {
  if (world.phase !== 'paused') return;
  world.phase = world.resumePhase ?? 'playing';
  world.resumePhase = null;
}
