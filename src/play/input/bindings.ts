import type { PlayerId } from '../core/model';
export type DeviceBinding = { type: 'gamepad'; index: number } | { type: 'keyboard-mouse' } | { type: 'keyboard-shared'; profile: PlayerId };
export interface MenuCommand { confirmPressed: boolean; backPressed: boolean; pausePressed: boolean; navX: number; navY: number }
export const EMPTY_MENU_COMMAND: MenuCommand = Object.freeze({ confirmPressed: false, backPressed: false, pausePressed: false, navX: 0, navY: 0 });
