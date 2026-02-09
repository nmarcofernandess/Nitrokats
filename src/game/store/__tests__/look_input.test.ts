import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../../store';

describe('look input buffering', () => {
  beforeEach(() => {
    useGameStore.setState(useGameStore.getInitialState(), true);
  });

  it('accumulates look deltas and clears them deterministically', () => {
    const store = useGameStore.getState();

    store.setLookInput(7, -3);
    store.setLookInput(2, 4);

    let state = useGameStore.getState();
    expect(state.input.lookDeltaX).toBe(9);
    expect(state.input.lookDeltaY).toBe(1);

    store.clearLookInput();
    state = useGameStore.getState();

    expect(state.input.lookDeltaX).toBe(0);
    expect(state.input.lookDeltaY).toBe(0);
  });
});
