import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../../store';

describe('game mode start behavior', () => {
  beforeEach(() => {
    useGameStore.setState(useGameStore.getInitialState(), true);
  });

  it('starts in classic mode when classic is requested', () => {
    useGameStore.getState().startGame('classic');

    const state = useGameStore.getState();
    expect(state.gameMode).toBe('classic');
    expect(state.gameState).toBe('playing');
  });

  it('starts in zombie mode when zombie is requested', () => {
    useGameStore.getState().startGame('zombie');

    const state = useGameStore.getState();
    expect(state.gameMode).toBe('zombie');
    expect(state.gameState).toBe('playing');
  });
});
