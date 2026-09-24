import type { PlayerInput } from '../core/model';

export interface StandardPadSample {
  axes?: ArrayLike<number> | null;
  buttons?: ArrayLike<number | { value?: number; pressed?: boolean } | null> | null;
}

export const DEFAULT_DEADZONE = 0.18;
export const TRIGGER_THRESHOLD = 0.25;

function finiteAt(values: ArrayLike<number> | null | undefined, index: number): number {
  const value = values?.[index];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function buttonAt(buttons: StandardPadSample['buttons'], index: number): number {
  const button = buttons?.[index];
  if (typeof button === 'number') return Number.isFinite(button) ? Math.max(0, button) : 0;
  if (!button) return 0;
  if (typeof button.value === 'number' && Number.isFinite(button.value)) return Math.max(0, button.value);
  return button.pressed ? 1 : 0;
}

export function applyDeadzone(x: number, y: number, threshold: number): { x: number; y: number } {
  if (!Number.isFinite(threshold) || threshold < 0 || threshold >= 1) {
    throw new RangeError('threshold deve estar no intervalo [0, 1)');
  }
  const safeX = Number.isFinite(x) ? x : 0;
  const safeY = Number.isFinite(y) ? y : 0;
  const radius = Math.hypot(safeX, safeY);
  if (!Number.isFinite(radius) || radius <= threshold) return { x: 0, y: 0 };
  const scaled = Math.min(1, (radius - threshold) / (1 - threshold));
  return { x: safeX / radius * scaled, y: safeY / radius * scaled };
}

export function readStandardPad(sample: StandardPadSample): PlayerInput {
  const axes = sample.axes;
  const buttons = sample.buttons;
  const move = applyDeadzone(finiteAt(axes, 0), finiteAt(axes, 1), DEFAULT_DEADZONE);
  const aim = applyDeadzone(finiteAt(axes, 2), finiteAt(axes, 3), DEFAULT_DEADZONE);
  return {
    move: { x: move.x, z: move.y }, aim: { x: aim.x, z: aim.y },
    fire: buttonAt(buttons, 7) > TRIGGER_THRESHOLD,
    dash: buttonAt(buttons, 0) > 0.5, revive: buttonAt(buttons, 2) > 0.5,
    nextWeapon: buttonAt(buttons, 3) > 0.5,
  };
}

export function readStandardPadMenu(sample: StandardPadSample): {
  confirm: boolean; back: boolean; pause: boolean; navX: number; navY: number;
} {
  const axes = sample.axes;
  const buttons = sample.buttons;
  const axis = applyDeadzone(finiteAt(axes, 0), finiteAt(axes, 1), DEFAULT_DEADZONE);
  const hatX = Number(buttonAt(buttons, 15) > 0.5) - Number(buttonAt(buttons, 14) > 0.5);
  const hatY = Number(buttonAt(buttons, 13) > 0.5) - Number(buttonAt(buttons, 12) > 0.5);
  return {
    confirm: buttonAt(buttons, 0) > 0.5, back: buttonAt(buttons, 1) > 0.5,
    pause: buttonAt(buttons, 9) > 0.5, navX: hatX || Math.sign(axis.x), navY: hatY || Math.sign(-axis.y),
  };
}
