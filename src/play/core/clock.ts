const FIXED_STEP_SECONDS = 1 / 60;
const MAX_CATCH_UP_STEPS = 5;
const EPSILON_SECONDS = 1e-10;

export interface SimulationClock {
  advance(seconds: number): void;
  reset(): void;
}

/** Accumulates render time into fixed simulation ticks, dropping excess catch-up time. */
export function createClock(onTick: () => void): SimulationClock {
  let accumulator = 0;

  return {
    advance(seconds) {
      if (!Number.isFinite(seconds) || seconds <= 0) return;
      accumulator += Math.min(seconds, FIXED_STEP_SECONDS * MAX_CATCH_UP_STEPS);
      let steps = 0;
      while (accumulator + EPSILON_SECONDS >= FIXED_STEP_SECONDS && steps < MAX_CATCH_UP_STEPS) {
        accumulator -= FIXED_STEP_SECONDS;
        if (accumulator < 0 && accumulator > -EPSILON_SECONDS) accumulator = 0;
        onTick();
        steps += 1;
      }
    },
    reset() {
      accumulator = 0;
    },
  };
}
