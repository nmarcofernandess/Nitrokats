import { describe, expect, it, vi } from 'vitest';
import { readStandardPad, applyDeadzone } from './gamepad';
import { InputHub, type InputHubOptions } from './InputHub';
import { GameRuntime } from '../runtime/GameRuntime';

const pad = (id: string, buttons: number[] = [], axes: number[] = []) => ({
  id, index: 0, connected: true, mapping: 'standard', axes,
  buttons: buttons.map(value => ({ value, pressed: value > 0.5, touched: value > 0 })),
});
const harness = (initial: (ReturnType<typeof pad> | null)[] = [], extra: Partial<InputHubOptions> = {}) => {
  let pads = [...initial];
  const pause = vi.fn();
  const target = new EventTarget();
  const options: InputHubOptions = { getGamepads: () => pads, eventTarget: target, onPauseRequired: pause, ...extra };
  const hub = new InputHub(options);
  return { hub, pause, target, setPads: (value: (ReturnType<typeof pad> | null)[]) => { pads = value; } };
};

const browserEvent = (type: string, props: Record<string, unknown> = {}) => {
  const event = new Event(type);
  for (const [key, value] of Object.entries(props)) Object.defineProperty(event, key, { value });
  return event;
};

describe('readStandardPad', () => {
  it('ignora drift e não dispara sem botão', () => {
    const command = readStandardPad({ axes: [0.07, -0.05, 0, 0], buttons: [] });
    expect(command.move).toEqual({ x: 0, z: 0 });
    expect(command.fire).toBe(false);
    expect(command.dash).toBe(false);
  });

  it('normaliza movimento diagonal, aplica zona morta radial e sanitiza dados ausentes', () => {
    expect(readStandardPad({ axes: [1, -1], buttons: [] }).move.x).toBeCloseTo(Math.SQRT1_2);
    expect(readStandardPad({ axes: [1, -1], buttons: [] }).move.z).toBeCloseTo(-Math.SQRT1_2);
    expect(readStandardPad({ axes: [Number.NaN, Number.POSITIVE_INFINITY], buttons: [] }).move).toEqual({ x: 0, z: 0 });
    expect(readStandardPad({ axes: [], buttons: [] }).aim).toEqual({ x: 0, z: 0 });
    expect(applyDeadzone(0.18, 0, 0.18)).toEqual({ x: 0, y: 0 });
    expect(applyDeadzone(0.59, 0, 0.18).x).toBeCloseTo(0.5);
    expect(applyDeadzone(Number.POSITIVE_INFINITY, 0.8, 0.18)).toEqual({ x: 0, y: 0 });
    expect(applyDeadzone(Number.NaN, 0.8, 0.18)).toEqual({ x: 0, y: 0 });
    expect(() => applyDeadzone(0, 0, 1)).toThrow(RangeError);
  });

  it('mantém fogo e resgate enquanto pressionados e detecta bordas dos botões de ação', () => {
    const input = readStandardPad({ axes: [], buttons: [0, 0, 0.8, 0.8, 0, 0, 0, 0.3] });
    expect(input.fire).toBe(true);
    expect(input.revive).toBe(true);
    expect(input.dash).toBe(false);
    expect(readStandardPad({ axes: null, buttons: [0, 0, 0, 0, 0, 0, 0, 0.25] }).fire).toBe(false);
    expect(readStandardPad({ axes: null, buttons: [0, 0, 0, 0, 0, 0, 0, 0.251] }).fire).toBe(true);
  });
});

describe('InputHub', () => {
  it('lê por índice no poll atual, mantém slots distintos apesar de IDs duplicados e não confunde índice com slot', () => {
    const first = { ...pad('duplicate'), index: 2, axes: [1, 0, 0, 1] };
    const second = { ...pad('duplicate'), index: 5, axes: [-1, 0, 0, -1] };
    const { hub, setPads } = harness([null, null, first, null, null, second]);
    expect(hub.getAvailableGamepads()).toEqual([
      { index: 2, id: 'duplicate', mapping: 'standard' }, { index: 5, id: 'duplicate', mapping: 'standard' },
    ]);
    hub.assign('p1', { type: 'gamepad', index: 2 });
    hub.assign('p2', { type: 'gamepad', index: 5 });
    hub.poll();
    const frame = hub.consumeFrame();
    expect(frame.p1!.move.x).toBeGreaterThan(0);
    expect(frame.p2!.move.x).toBeLessThan(0);
    setPads([null, null, { ...first, axes: [-1, 0, 0, -1] }, null, null, { ...second, axes: [1, 0, 0, 1] }]);
    hub.poll();
    expect(hub.consumeFrame().p1!.move.x).toBeLessThan(0);
    expect(hub.consumeFrame().p2!.move.x).toBeGreaterThan(0);
    hub.dispose();
  });

  it('accepts an already connected pad on first poll and handles null/disconnect/reconnect without stealing or resuming', () => {
    const { hub, pause, setPads } = harness([pad('A')]);
    hub.assign('p1', { type: 'gamepad', index: 0 });
    hub.poll();
    expect(hub.consumeFrame().p1).toBeDefined();
    setPads([null]);
    hub.poll();
    expect(pause).toHaveBeenCalledTimes(1);
    expect(hub.consumeFrame().p1).toBeUndefined();
    setPads([pad('B', [0, 1])]);
    hub.poll();
    expect(hub.consumeFrame().p1).toBeUndefined();
    expect(pause).toHaveBeenCalledTimes(1);
    hub.assign('p1', { type: 'gamepad', index: 0 });
    hub.poll();
    expect(hub.consumeFrame().p1?.fire).toBe(false);
    hub.dispose();
  });

  it('rejects assigning one physical gamepad to both players', () => {
    const { hub } = harness([pad('same')]);
    hub.assign('p1', { type: 'gamepad', index: 0 });
    expect(() => hub.assign('p2', { type: 'gamepad', index: 0 })).toThrow(/já está atribuído/);
    hub.dispose();
  });

  it('combines mouse and keyboard P1 with the disjoint shared-keyboard P2 profile', () => {
    const { hub, target } = harness([], { resolveMouseAim: () => ({ x: 1, z: 1 }) });
    hub.assign('p1', { type: 'keyboard-mouse' });
    hub.assign('p2', { type: 'keyboard-shared', profile: 'p2' });
    target.dispatchEvent(browserEvent('mousemove', { clientX: 820, clientY: 340 }));
    target.dispatchEvent(browserEvent('mousedown', { button: 0, clientX: 820, clientY: 340 }));
    target.dispatchEvent(browserEvent('keydown', { code: 'ArrowUp', repeat: false }));
    target.dispatchEvent(browserEvent('keydown', { code: 'KeyK', repeat: false }));
    hub.poll();
    const frame = hub.consumeFrame();
    expect(frame.p1?.aim.x).toBeCloseTo(Math.SQRT1_2);
    expect(frame.p1?.aim.z).toBeCloseTo(Math.SQRT1_2);
    expect(frame.p1?.fire).toBe(true);
    expect(frame.p2).toMatchObject({ move: { x: 0, z: -1 }, fire: true });
    hub.dispose();
  });

  it('reports a connected non-standard pad for diagnostics instead of guessing its button layout', () => {
    const nonStandard = { ...pad('custom'), mapping: '' };
    const { hub } = harness([nonStandard]);
    hub.assign('p1', { type: 'gamepad', index: 0 });
    hub.poll();
    expect(hub.getDeviceDiagnostics()).toEqual({ unsupportedGamepadIndexes: [0], awaitingConfirmation: [] });
    expect(hub.canResume()).toBe(false);
    expect(hub.consumeFrame().p1).toMatchObject({ fire: false, dash: false, nextWeapon: false });
    hub.dispose();
  });

  it('treats Start as a rising-edge pause/confirm menu command', () => {
    const { hub, setPads } = harness([pad('A')]);
    hub.assign('p1', { type: 'gamepad', index: 0 });
    hub.poll(); hub.consumeMenuCommands();
    setPads([pad('A', [0, 0, 0, 0, 0, 0, 0, 0, 0, 1])]);
    hub.poll();
    expect(hub.consumeMenuCommands().p1?.pausePressed).toBe(true);
    hub.poll();
    expect(hub.consumeMenuCommands().p1?.pausePressed).toBe(false);
    hub.clear();
    hub.poll();
    expect(hub.consumeMenuCommands().p1?.pausePressed).toBe(false);
    setPads([pad('A')]); hub.poll(); hub.consumeMenuCommands();
    setPads([pad('A', [0, 0, 0, 0, 0, 0, 0, 0, 0, 1])]); hub.poll();
    expect(hub.consumeMenuCommands().p1?.pausePressed).toBe(true);
    hub.dispose();
  });

  it('emits dash and weapon edges once per press, while fire and revive are held', () => {
    const { hub, setPads } = harness([pad('A')]);
    hub.assign('p1', { type: 'gamepad', index: 0 });
    hub.poll(); hub.consumeFrame();
    setPads([pad('A', [1, 0, 1, 1, 0, 0, 0, 0.8])]); hub.poll();
    const first = hub.consumeFrame().p1!;
    expect(first.dash).toBe(true);
    expect(first.nextWeapon).toBe(true);
    expect(first.fire).toBe(true);
    expect(first.revive).toBe(true);
    hub.poll();
    const held = hub.consumeFrame().p1!;
    expect(held.dash).toBe(false);
    expect(held.nextWeapon).toBe(false);
    expect(held.fire).toBe(true);
    expect(held.revive).toBe(true);
    setPads([pad('A')]); hub.poll(); hub.consumeFrame();
    setPads([pad('A', [1])]); hub.poll();
    expect(hub.consumeFrame().p1?.dash).toBe(true);
    hub.dispose();
  });

  it('preserves the last valid gamepad aim direction when the aim stick returns to center', () => {
    const { hub, setPads } = harness([pad('A')]);
    hub.assign('p1', { type: 'gamepad', index: 0 });
    setPads([pad('A', [], [0, 0, 0.6, -0.8])]);
    hub.poll();
    const aimed = hub.consumeFrame().p1!.aim;
    expect(aimed.x).toBeCloseTo(0.6);
    expect(aimed.z).toBeCloseTo(-0.8);
    setPads([pad('A')]); hub.poll();
    expect(hub.consumeFrame().p1!.aim).toEqual(aimed);
    hub.dispose();
  });

  it('clear resets sticky aim so a new campaign cannot inherit the previous direction', () => {
    const { hub, setPads } = harness([pad('A')]);
    hub.assign('p1', { type: 'gamepad', index: 0 });
    setPads([pad('A', [], [0, 0, 1, 0])]); hub.poll();
    expect(hub.consumeFrame().p1!.aim.x).toBeCloseTo(1);
    hub.clear();
    setPads([pad('A')]); hub.poll();
    expect(hub.consumeFrame().p1!.aim).toEqual({ x: 0, z: 0 });
    hub.dispose();
  });

  it('clear masks every held combat control until each physical control is released', () => {
    const { hub, setPads } = harness([pad('A')]);
    hub.assign('p1', { type: 'gamepad', index: 0 });
    hub.poll(); hub.consumeFrame();
    setPads([pad('A', [1, 0, 1, 1, 0, 0, 0, 0.8])]); hub.poll();
    expect(hub.consumeFrame().p1).toMatchObject({ fire: true, dash: true, revive: true, nextWeapon: true });
    hub.clear();
    hub.poll();
    expect(hub.consumeFrame().p1).toMatchObject({ fire: false, dash: false, revive: false, nextWeapon: false });
    setPads([pad('A')]); hub.poll(); hub.consumeFrame();
    setPads([pad('A', [1, 0, 1, 1, 0, 0, 0, 0.8])]); hub.poll();
    expect(hub.consumeFrame().p1).toMatchObject({ fire: true, dash: true, revive: true, nextWeapon: true });
    hub.dispose();
  });

  it('uses separate shared-keyboard profiles and reports simultaneous-key ghosting diagnostics', () => {
    const { hub, target } = harness();
    hub.assign('p1', { type: 'keyboard-shared', profile: 'p1' });
    hub.assign('p2', { type: 'keyboard-shared', profile: 'p2' });
    const key = (code: string, type = 'keydown') => target.dispatchEvent(browserEvent(type, { code, repeat: false }));
    key('KeyW'); key('ArrowUp'); key('KeyF'); key('KeyK');
    hub.poll();
    const frame = hub.consumeFrame();
    expect(frame.p1!.move.z).toBeLessThan(0);
    expect(frame.p2!.move.z).toBeLessThan(0);
    expect(frame.p1!.fire).toBe(true);
    expect(frame.p2!.fire).toBe(true);
    expect(hub.getKeyboardDiagnostics()).toMatchObject({ simultaneousKeyCount: 4, ghostingWarning: true });
    hub.dispose();
  });

  it('clears held input on blur and visibility loss, requiring an explicit resume action', () => {
    const { hub, pause, target } = harness();
    hub.assign('p1', { type: 'keyboard-shared', profile: 'p1' });
    target.dispatchEvent(browserEvent('keydown', { code: 'KeyW', repeat: false }));
    hub.poll();
    expect(hub.consumeFrame().p1?.move.z).toBeLessThan(0);
    target.dispatchEvent(new Event('blur'));
    expect(pause).toHaveBeenCalledTimes(1);
    hub.poll();
    expect(hub.consumeFrame().p1).toBeUndefined();
    target.dispatchEvent(new Event('visibilitychange'));
    expect(pause).toHaveBeenCalledTimes(1);
    hub.dispose();
  });

  it('does not accept a visibility loss as a resume and suppresses pre-loss keys after focus returns', () => {
    let visible = true;
    const { hub, pause, target } = harness([], { isVisible: () => visible });
    hub.assign('p1', { type: 'keyboard-shared', profile: 'p1' });
    target.dispatchEvent(browserEvent('keydown', { code: 'KeyW', repeat: false }));
    hub.poll(); hub.consumeFrame();
    visible = false;
    target.dispatchEvent(new Event('visibilitychange'));
    expect(pause).toHaveBeenCalledTimes(1);
    expect(hub.canResume()).toBe(false);
    visible = true;
    target.dispatchEvent(new Event('visibilitychange'));
    expect(hub.canResume()).toBe(true);
    expect(hub.confirmResume()).toBe(true);
    hub.poll();
    expect(hub.consumeFrame().p1?.move).toEqual({ x: 0, z: 0 });
    target.dispatchEvent(browserEvent('keyup', { code: 'KeyW' }));
    target.dispatchEvent(browserEvent('keydown', { code: 'KeyW', repeat: false }));
    hub.poll();
    expect(hub.consumeFrame().p1?.move.z).toBeLessThan(0);
    hub.dispose();
  });

  it('separates keyboard-mouse intent from menu commands and clears one-shot edges', () => {
    const { hub, target } = harness();
    hub.assign('p1', { type: 'keyboard-mouse' });
    target.dispatchEvent(browserEvent('keydown', { code: 'Space', repeat: false }));
    target.dispatchEvent(browserEvent('mousedown', { button: 0, clientX: 800, clientY: 400 }));
    hub.poll();
    const frame = hub.consumeFrame();
    expect(frame.p1?.dash).toBe(true);
    expect(frame.p1?.fire).toBe(true);
    expect(frame.p1?.aim.x).toBeGreaterThan(0);
    expect(hub.consumeMenuCommands().p1).toBeDefined();
    hub.clear();
    expect(hub.consumeFrame().p1).toBeUndefined();
    hub.dispose();
  });

  it('adapts InputHub to fixed ticks and pauses the runtime on device loss until reassignment and confirmation', () => {
    const { hub, setPads } = harness([pad('A')]);
    hub.assign('p1', { type: 'gamepad', index: 0 });
    const runtime = new GameRuntime({
      seed: 4, mode: 'training', difficulty: 'normal',
      players: [{ id: 'p1', catId: 'anakin', weaponId: 'pulse_rifle' }],
    }, hub as never);
    runtime.advance(1 / 60);
    expect(runtime.world.tick).toBe(1);
    setPads([null]);
    runtime.advance(1 / 60);
    expect(runtime.world.phase).toBe('paused');
    expect(runtime.world.tick).toBe(1);
    setPads([pad('B', [1])]);
    runtime.advance(1 / 60);
    runtime.resume();
    expect(runtime.world.phase).toBe('paused');
    hub.assign('p1', { type: 'gamepad', index: 0 });
    runtime.resume();
    expect(runtime.world.phase).toBe('playing');
    runtime.advance(1 / 60);
    expect(runtime.world.tick).toBe(2);
    expect(runtime.world.players[0].dashRemaining).toBe(0);
    runtime.dispose();
  });

  it('runtime restart clears input-session aim before a new campaign', () => {
    const { hub, setPads } = harness([pad('A')]);
    hub.assign('p1', { type: 'gamepad', index: 0 });
    const runtime = new GameRuntime({
      seed: 4, mode: 'training', difficulty: 'normal',
      players: [{ id: 'p1', catId: 'anakin', weaponId: 'pulse_rifle' }],
    }, hub);
    setPads([pad('A', [0, 0, 0, 0, 0, 0, 0, 0.8], [0, 0, 1, 0])]);
    runtime.advance(1 / 60);
    expect(runtime.world.players[0].aim.x).toBeCloseTo(1);
    runtime.restart();
    setPads([pad('A')]);
    runtime.advance(1 / 60);
    setPads([pad('A', [0, 0, 0, 0, 0, 0, 0, 0.8])]);
    runtime.advance(1 / 60);
    expect(runtime.world.players[0].aim).toEqual({ x: 0, z: 1 });
    runtime.dispose();
  });

  it('runtime owns and disposes hub listeners exactly once while legacy function providers remain valid', () => {
    const target = new EventTarget();
    const hub = new InputHub({ eventTarget: target, getGamepads: () => [] });
    hub.assign('p1', { type: 'keyboard-shared', profile: 'p1' });
    const disposeSpy = vi.spyOn(hub, 'dispose');
    const runtime = new GameRuntime({
      seed: 4, mode: 'training', difficulty: 'normal',
      players: [{ id: 'p1', catId: 'anakin', weaponId: 'pulse_rifle' }],
    }, hub);
    const removeListener = vi.spyOn(target, 'removeEventListener');
    runtime.dispose();
    runtime.dispose();
    expect(removeListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(removeListener).toHaveBeenCalledWith('keyup', expect.any(Function));
    expect(removeListener).toHaveBeenCalledWith('blur', expect.any(Function));
    expect(removeListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    target.dispatchEvent(browserEvent('keydown', { code: 'KeyW', repeat: false }));
    hub.poll();
    expect(hub.consumeFrame().p1).toBeUndefined();
    expect(disposeSpy).toHaveBeenCalledTimes(1);

    const legacyInput = Object.assign(() => ({}), { clear: vi.fn() });
    const legacyRuntime = new GameRuntime({
      seed: 4, mode: 'training', difficulty: 'normal',
      players: [{ id: 'p1', catId: 'anakin', weaponId: 'pulse_rifle' }],
    }, legacyInput);
    expect(() => legacyRuntime.advance(1 / 60)).not.toThrow();
    legacyRuntime.dispose();
    expect(legacyInput.clear).toHaveBeenCalled();
  });
});
