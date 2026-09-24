import { describe, expect, it } from 'vitest';
import type { DeviceBinding } from '../input/bindings';
import { hasValidDeviceAssignments, hostConfirmed, moveMenuFocus, playerConfirmed } from './MenuInput';

describe('menu input contract', () => {
  it('wraps focus and reserves global confirmation for P1', () => {
    const p1 = { confirmPressed: true, backPressed: false, pausePressed: false, navX: 0, navY: 0 };
    const p2 = { ...p1, confirmPressed: false };
    expect(moveMenuFocus(0, 3, { ...p1, navY: -1 })).toBe(1);
    expect(moveMenuFocus(0, 3, { ...p1, navY: 1 })).toBe(2);
    expect(hostConfirmed({ p1, p2 })).toBe(true);
    expect(playerConfirmed({ p1, p2 }, 'p2')).toBe(false);
  });

  it('rejects a duplicate physical controller while allowing separate shared-keyboard profiles', () => {
    const pad: DeviceBinding = { type: 'gamepad', index: 0 };
    expect(hasValidDeviceAssignments([{ id: 'p1', device: pad }, { id: 'p2', device: pad }])).toBe(false);
    expect(hasValidDeviceAssignments([
      { id: 'p1', device: { type: 'keyboard-shared', profile: 'p1' } },
      { id: 'p2', device: { type: 'keyboard-shared', profile: 'p2' } },
    ])).toBe(true);
    expect(hasValidDeviceAssignments([
      { id: 'p1', device: { type: 'keyboard-mouse' } },
      { id: 'p2', device: { type: 'keyboard-shared', profile: 'p2' } },
    ])).toBe(true);
  });
});
