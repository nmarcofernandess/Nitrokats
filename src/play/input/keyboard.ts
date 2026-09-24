import type { PlayerInput, Vec2 } from '../core/model';
import type { DeviceBinding, MenuCommand } from './bindings';

export interface KeyboardState {
  keys: ReadonlySet<string>;
  mouseButtons: ReadonlySet<number>;
  pointer: { x: number; y: number };
  viewport: { width: number; height: number };
  resolveMouseAim?: (pointer: { x: number; y: number }, viewport: { width: number; height: number }) => Vec2;
}

export interface KeyboardRead { input: PlayerInput; menu: MenuCommand }

const P1_KEYS = {
  up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', fire: 'KeyF', dash: 'KeyG',
  revive: 'KeyE', nextWeapon: 'KeyQ', confirm: 'Enter', back: 'Backspace', pause: 'Escape',
};
const P2_KEYS = {
  up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', fire: 'KeyK', dash: 'KeyL',
  revive: 'KeyO', nextWeapon: 'KeyP', confirm: 'NumpadEnter', back: 'Delete', pause: 'Escape',
};
const MOUSE_KEYS = {
  up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', dash: 'Space', revive: 'KeyE', nextWeapon: 'KeyQ',
  confirm: 'Enter', back: 'Backspace', pause: 'Escape',
};
type KeyboardProfile = Omit<typeof P1_KEYS, 'fire'> & { fire?: string };

function held(keys: ReadonlySet<string>, code: string): boolean { return keys.has(code); }
function normalized(x: number, z: number): Vec2 {
  const length = Math.hypot(x, z);
  return length ? { x: x / Math.max(1, length), z: z / Math.max(1, length) } : { x: 0, z: 0 };
}

function readProfile(keys: ReadonlySet<string>, profile: KeyboardProfile, isMouse: boolean, state: KeyboardState): KeyboardRead {
  const horizontal = Number(held(keys, profile.right)) - Number(held(keys, profile.left));
  const vertical = Number(held(keys, profile.down)) - Number(held(keys, profile.up));
  let aim: Vec2 = { x: 0, z: 0 };
  if (isMouse) {
    const resolved = state.resolveMouseAim?.(state.pointer, state.viewport);
    if (resolved) {
      const length = Math.hypot(resolved.x, resolved.z);
      if (Number.isFinite(length) && length) aim = { x: resolved.x / length, z: resolved.z / length };
    } else {
      const x = state.pointer.x - state.viewport.width / 2;
      const z = -(state.pointer.y - state.viewport.height / 2);
      const length = Math.hypot(x, z);
      if (length) aim = { x: x / length, z: z / length };
    }
  }
  return {
    input: {
      move: normalized(horizontal, vertical), aim, fire: isMouse ? state.mouseButtons.has(0) : Boolean(profile.fire && held(keys, profile.fire)),
      dash: held(keys, profile.dash), revive: held(keys, profile.revive), nextWeapon: held(keys, profile.nextWeapon),
    },
    menu: {
      confirmPressed: held(keys, profile.confirm), backPressed: held(keys, profile.back),
      pausePressed: held(keys, profile.pause), navX: horizontal, navY: -vertical,
    },
  };
}

export function readKeyboard(binding: Extract<DeviceBinding, { type: 'keyboard-mouse' | 'keyboard-shared' }>, state: KeyboardState): KeyboardRead {
  if (binding.type === 'keyboard-mouse') return readProfile(state.keys, MOUSE_KEYS, true, state);
  return binding.profile === 'p1' ? readProfile(state.keys, P1_KEYS, false, state) : readProfile(state.keys, P2_KEYS, false, state);
}

export const SHARED_KEY_PROFILES = Object.freeze({ p1: P1_KEYS, p2: P2_KEYS });
