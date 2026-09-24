import type { InputFrame, PlayerId, PlayerInput } from '../core/model';
import { EMPTY_MENU_COMMAND, type DeviceBinding, type MenuCommand } from './bindings';
import { readKeyboard, type KeyboardState } from './keyboard';
import { readStandardPad, readStandardPadMenu, type StandardPadSample } from './gamepad';

interface PadLike extends StandardPadSample {
  index: number;
  id: string;
  connected: boolean;
  mapping: string;
}

export interface KeyboardDiagnostics {
  simultaneousKeyCount: number;
  simultaneousCodes: string[];
  ghostingWarning: boolean;
}

export interface GamepadChoice { index: number; id: string; mapping: string }

export interface InputHubOptions {
  getGamepads?: () => ArrayLike<PadLike | null>;
  eventTarget?: EventTarget;
  visibilityTarget?: EventTarget;
  isVisible?: () => boolean;
  getViewport?: () => { width: number; height: number };
  resolveMouseAim?: (pointer: { x: number; y: number }, viewport: { width: number; height: number }) => { x: number; z: number };
  onPauseRequired?: (reason: 'device-disconnected' | 'focus-lost') => void;
}

const PLAYER_IDS: readonly PlayerId[] = ['p1', 'p2'];
const EMPTY_INPUT: PlayerInput = Object.freeze({
  move: Object.freeze({ x: 0, z: 0 }), aim: Object.freeze({ x: 0, z: 0 }),
  fire: false, dash: false, revive: false, nextWeapon: false,
});
const EDGE_ACTIONS = ['dash', 'nextWeapon'] as const;
type EdgeAction = typeof EDGE_ACTIONS[number];
type MenuEdge = 'confirmPressed' | 'backPressed' | 'pausePressed';

function browserPads(): ArrayLike<PadLike | null> {
  return typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function' ? [] : navigator.getGamepads();
}
function browserTarget(): EventTarget | undefined {
  return typeof window === 'undefined' ? undefined : window;
}
function browserVisibility(): boolean {
  return typeof document === 'undefined' || document.visibilityState !== 'hidden';
}
function eventCode(event: Event): string {
  return (event as KeyboardEvent).code ?? '';
}
function eventRepeat(event: Event): boolean {
  return Boolean((event as KeyboardEvent).repeat);
}
function eventButton(event: Event): number {
  return (event as MouseEvent).button ?? -1;
}
function eventPointer(event: Event): { x: number; y: number } {
  const mouse = event as MouseEvent;
  return { x: Number.isFinite(mouse.clientX) ? mouse.clientX : 0, y: Number.isFinite(mouse.clientY) ? mouse.clientY : 0 };
}

export class InputHub {
  private readonly bindings = new Map<PlayerId, DeviceBinding>();
  private readonly padConnected = new Map<PlayerId, { everConnected: boolean; awaitingConfirmation: boolean; identity: string | null }>();
  private readonly previousActions = new Map<PlayerId, Record<EdgeAction, boolean>>();
  private readonly pendingActions = new Map<PlayerId, Record<EdgeAction, boolean>>();
  private readonly previousMenu = new Map<PlayerId, Record<MenuEdge, boolean>>();
  private readonly pendingMenu = new Map<PlayerId, Record<MenuEdge, boolean>>();
  private readonly frames = new Map<PlayerId, PlayerInput>();
  private readonly lastAim = new Map<PlayerId, { x: number; z: number }>();
  private readonly menuCommands = new Map<PlayerId, MenuCommand>();
  private readonly pressedKeys = new Set<string>();
  private readonly pressedMouseButtons = new Set<number>();
  private readonly blockedInputs = new Set<string>();
  private readonly options: InputHubOptions;
  private readonly target?: EventTarget;
  private readonly listeners: Array<[EventTarget, string, EventListener]> = [];
  private pointer = { x: Number.NaN, y: Number.NaN };
  private focused = true;
  private pauseNotified = false;
  private disposed = false;
  private pauseHandler?: InputHubOptions['onPauseRequired'];
  private diagnostics: KeyboardDiagnostics = { simultaneousKeyCount: 0, simultaneousCodes: [], ghostingWarning: false };
  private unsupportedPads = new Set<number>();

  constructor(options: InputHubOptions = {}) {
    this.options = options;
    this.target = options.eventTarget ?? browserTarget();
    this.pauseHandler = options.onPauseRequired;
    const visibilityTarget = options.visibilityTarget
      ?? (typeof document === 'undefined' ? this.target : document);
    this.listen('keydown', event => {
      const code = eventCode(event);
      if (!code || this.blockedInputs.has(`key:${code}`) || eventRepeat(event)) return;
      this.pressedKeys.add(code);
    });
    this.listen('keyup', event => {
      const code = eventCode(event);
      this.pressedKeys.delete(code);
      this.blockedInputs.delete(`key:${code}`);
    });
    this.listen('mousedown', event => {
      const button = eventButton(event);
      this.pointer = eventPointer(event);
      if (!this.blockedInputs.has(`mouse:${button}`)) this.pressedMouseButtons.add(button);
    });
    this.listen('mouseup', event => {
      const button = eventButton(event);
      this.pressedMouseButtons.delete(button);
      this.blockedInputs.delete(`mouse:${button}`);
    });
    this.listen('mousemove', event => { this.pointer = eventPointer(event); });
    this.listen('blur', () => {
      this.focused = false;
      this.requirePause('focus-lost');
      this.clear();
    });
    this.listen('focus', () => { this.focused = true; });
    this.listen('visibilitychange', () => {
      const visible = this.options.isVisible?.() ?? browserVisibility();
      if (!visible) {
        this.focused = false;
        this.requirePause('focus-lost');
        this.clear();
      } else {
        this.focused = true;
      }
    }, visibilityTarget);
  }

  setPauseHandler(handler: InputHubOptions['onPauseRequired']): void { this.pauseHandler = handler; }

  assign(slot: PlayerId, binding: DeviceBinding): void {
    this.assertLive();
    if (binding.type === 'gamepad' && (!Number.isInteger(binding.index) || binding.index < 0)) {
      throw new RangeError('índice de gamepad inválido');
    }
    if (binding.type === 'keyboard-shared' && binding.profile !== slot) {
      throw new Error(`o perfil ${binding.profile} pertence ao slot ${binding.profile}`);
    }
    for (const [otherSlot, other] of this.bindings) {
      if (slot === otherSlot) continue;
      if (binding.type === 'gamepad' && other.type === 'gamepad' && binding.index === other.index) {
        throw new Error(`o gamepad ${binding.index} já está atribuído a ${otherSlot}`);
      }
      if (binding.type === 'keyboard-mouse' && other.type === 'keyboard-mouse') {
        throw new Error(`teclado/mouse já está atribuído a ${otherSlot}`);
      }
      const overlapsMouseKeyboard = (binding.type === 'keyboard-shared' && binding.profile === 'p1' && other.type === 'keyboard-mouse')
        || (binding.type === 'keyboard-mouse' && other.type === 'keyboard-shared' && other.profile === 'p1');
      if (overlapsMouseKeyboard) {
        throw new Error('teclado compartilhado e teclado/mouse usam teclas sobrepostas');
      }
    }
    for (const code of this.pressedKeys) this.blockedInputs.add(`key:${code}`);
    for (const button of this.pressedMouseButtons) this.blockedInputs.add(`mouse:${button}`);
    this.blockHeldControls(slot, this.frames.get(slot), this.menuCommands.get(slot));
    this.bindings.set(slot, { ...binding });
    this.resetSlot(slot);
    this.padConnected.delete(slot);
    if (binding.type === 'gamepad') {
      const pad = this.findPad(this.options.getGamepads?.() ?? browserPads(), binding.index);
      this.padConnected.set(slot, {
        everConnected: Boolean(pad), awaitingConfirmation: false,
        identity: pad ? `${pad.id}\u0000${pad.mapping}` : null,
      });
      if (pad?.mapping === 'standard') {
        const sample = readStandardPad(pad);
        const menu = readStandardPadMenu(pad);
        this.blockHeldControls(slot, sample, {
          confirmPressed: menu.confirm, backPressed: menu.back, pausePressed: menu.pause, navX: menu.navX, navY: menu.navY,
        });
      }
    } else {
      const read = readKeyboard(binding, {
        keys: this.pressedKeys, mouseButtons: this.pressedMouseButtons, pointer: this.pointer,
        viewport: this.options.getViewport?.() ?? this.browserViewport(), resolveMouseAim: this.options.resolveMouseAim,
      });
      this.blockHeldControls(slot, read.input, read.menu);
    }
    this.clearPendingForSlot(slot);
  }

  poll(): void {
    if (this.disposed) return;
    const pads = this.options.getGamepads?.() ?? browserPads();
    this.updateKeyboardDiagnostics();
    this.unsupportedPads.clear();
    for (const slot of PLAYER_IDS) {
      const binding = this.bindings.get(slot);
      if (!binding) continue;
      if (!this.focused || !(this.options.isVisible?.() ?? browserVisibility())) {
        this.frames.delete(slot);
        this.menuCommands.set(slot, EMPTY_MENU_COMMAND);
        continue;
      }
      if (binding.type === 'gamepad') {
        const state = this.padConnected.get(slot)!;
        const pad = this.findPad(pads, binding.index);
        if (!pad) {
          this.frames.delete(slot);
          this.menuCommands.set(slot, EMPTY_MENU_COMMAND);
          state.awaitingConfirmation = true;
          state.identity = null;
          this.requirePause('device-disconnected');
          continue;
        }
        if (state.awaitingConfirmation) {
          this.frames.delete(slot);
          this.menuCommands.set(slot, EMPTY_MENU_COMMAND);
          continue;
        }
        const identity = `${pad.id}\u0000${pad.mapping}`;
        if (state.everConnected && state.identity !== identity) {
          state.awaitingConfirmation = true;
          this.frames.delete(slot);
          this.menuCommands.set(slot, EMPTY_MENU_COMMAND);
          this.requirePause('device-disconnected');
          continue;
        }
        state.everConnected = true;
        state.identity = identity;
        if (pad.mapping !== 'standard') {
          this.unsupportedPads.add(binding.index);
          this.frames.set(slot, EMPTY_INPUT);
          this.updateMenu(slot, { confirm: false, back: false, pause: false, navX: 0, navY: 0 });
          this.updateEdges(slot, EMPTY_INPUT);
          continue;
        }
        this.readPad(slot, binding.index, pad);
      } else {
        const keyboardState: KeyboardState = {
          keys: this.pressedKeys, mouseButtons: this.pressedMouseButtons, pointer: this.pointer,
          viewport: this.options.getViewport?.() ?? this.browserViewport(),
          resolveMouseAim: this.options.resolveMouseAim,
        };
        const read = readKeyboard(binding, keyboardState);
        this.releaseInactiveControls(slot, read.input);
        const input = this.rememberAim(slot, this.maskBlockedInput(slot, read.input));
        this.frames.set(slot, input);
        this.updateEdges(slot, input);
        this.updateMenu(slot, read.menu);
      }
    }
  }

  consumeFrame(): InputFrame {
    const frame: InputFrame = {};
    for (const slot of PLAYER_IDS) {
      const current = this.frames.get(slot);
      if (!current) continue;
      const pending = this.pendingActions.get(slot) ?? { dash: false, nextWeapon: false };
      frame[slot] = { ...current, dash: pending.dash, nextWeapon: pending.nextWeapon };
      this.pendingActions.set(slot, { dash: false, nextWeapon: false });
    }
    return frame;
  }

  consumeMenuCommands(): Partial<Record<PlayerId, MenuCommand>> {
    const commands: Partial<Record<PlayerId, MenuCommand>> = {};
    for (const slot of PLAYER_IDS) {
      const current = this.menuCommands.get(slot);
      if (!current) continue;
      const pending = this.pendingMenu.get(slot) ?? { confirmPressed: false, backPressed: false, pausePressed: false };
      commands[slot] = {
        ...current,
        confirmPressed: pending.confirmPressed,
        backPressed: pending.backPressed,
        pausePressed: pending.pausePressed,
      };
      this.pendingMenu.set(slot, { confirmPressed: false, backPressed: false, pausePressed: false });
    }
    return commands;
  }

  clear(): void {
    if (this.disposed) return;
    for (const code of this.pressedKeys) this.blockedInputs.add(`key:${code}`);
    for (const button of this.pressedMouseButtons) this.blockedInputs.add(`mouse:${button}`);
    for (const [slot, frame] of this.frames) {
      for (const action of ['fire', 'dash', 'revive', 'nextWeapon'] as const) {
        if (frame[action]) this.blockedInputs.add(`control:${slot}:${action}`);
      }
    }
    for (const [slot, command] of this.menuCommands) {
      for (const edge of ['confirmPressed', 'backPressed', 'pausePressed'] as const) {
        if (command[edge]) this.blockedInputs.add(`menu:${slot}:${edge}`);
      }
    }
    this.pressedKeys.clear();
    this.pressedMouseButtons.clear();
    this.frames.clear();
    this.menuCommands.clear();
    for (const slot of PLAYER_IDS) this.clearPendingForSlot(slot);
    this.previousActions.clear();
    this.previousMenu.clear();
    this.lastAim.clear();
  }

  getKeyboardDiagnostics(): KeyboardDiagnostics { return { ...this.diagnostics, simultaneousCodes: [...this.diagnostics.simultaneousCodes] }; }

  getAvailableGamepads(): GamepadChoice[] {
    const pads = this.options.getGamepads?.() ?? browserPads();
    const choices: GamepadChoice[] = [];
    for (let index = 0; index < pads.length; index += 1) {
      const pad = pads[index];
      if (!pad?.connected || !Number.isInteger(pad.index) || pad.index < 0) continue;
      choices.push({ index: pad.index, id: pad.id, mapping: pad.mapping });
    }
    return choices.sort((left, right) => left.index - right.index);
  }

  getBinding(slot: PlayerId): DeviceBinding | null {
    const binding = this.bindings.get(slot);
    return binding ? { ...binding } : null;
  }

  getDeviceDiagnostics(): { unsupportedGamepadIndexes: number[]; awaitingConfirmation: PlayerId[] } {
    return {
      unsupportedGamepadIndexes: [...this.unsupportedPads].sort((a, b) => a - b),
      awaitingConfirmation: PLAYER_IDS.filter(slot => this.padConnected.get(slot)?.awaitingConfirmation),
    };
  }

  canResume(): boolean {
    if (!this.focused || !(this.options.isVisible?.() ?? browserVisibility())) return false;
    for (const slot of PLAYER_IDS) {
      const binding = this.bindings.get(slot);
      if (binding?.type === 'gamepad') {
        const status = this.padConnected.get(slot);
        if (!status?.everConnected || status.awaitingConfirmation) return false;
        const pad = this.findPad(this.options.getGamepads?.() ?? browserPads(), binding.index);
        if (!pad || pad.mapping !== 'standard' || `${pad.id}\u0000${pad.mapping}` !== status.identity) return false;
      }
    }
    return true;
  }

  confirmResume(): boolean {
    if (!this.canResume()) return false;
    this.pauseNotified = false;
    this.clear();
    return true;
  }

  dispose(): void {
    if (this.disposed) return;
    this.clear();
    for (const [target, type, listener] of this.listeners) target.removeEventListener(type, listener);
    this.listeners.length = 0;
    this.bindings.clear();
    this.padConnected.clear();
    this.disposed = true;
  }

  private readPad(slot: PlayerId, index: number, pad: PadLike): void {
    const raw = readStandardPad(pad);
    const menu = readStandardPadMenu(pad);
    this.releaseInactiveControls(slot, raw);
    const input = this.rememberAim(slot, this.maskBlockedInput(slot, raw));
    this.frames.set(slot, input);
    this.updateEdges(slot, input);
    this.updateMenu(slot, {
      confirmPressed: menu.confirm, backPressed: menu.back, pausePressed: menu.pause, navX: menu.navX, navY: menu.navY,
    });
    if (this.unsupportedPads.has(index)) this.frames.set(slot, EMPTY_INPUT);
  }

  private maskBlockedInput(slot: PlayerId, input: PlayerInput): PlayerInput {
    const result = { ...input };
    for (const action of ['fire', 'dash', 'revive', 'nextWeapon'] as const) {
      if (this.blockedInputs.has(`control:${slot}:${action}`)) result[action] = false;
    }
    return result;
  }

  private rememberAim(slot: PlayerId, input: PlayerInput): PlayerInput {
    const length = Math.hypot(input.aim.x, input.aim.z);
    const aim = length > 0
      ? { x: input.aim.x / length, z: input.aim.z / length }
      : this.lastAim.get(slot) ?? input.aim;
    if (length > 0) this.lastAim.set(slot, aim);
    return { ...input, aim };
  }

  private releaseInactiveControls(slot: PlayerId, input: PlayerInput): void {
    for (const action of ['fire', 'dash', 'revive', 'nextWeapon'] as const) {
      if (!input[action]) this.blockedInputs.delete(`control:${slot}:${action}`);
    }
  }

  private blockHeldControls(slot: PlayerId, input?: PlayerInput, menu?: MenuCommand): void {
    if (input) {
      for (const action of ['fire', 'dash', 'revive', 'nextWeapon'] as const) {
        if (input[action]) this.blockedInputs.add(`control:${slot}:${action}`);
      }
    }
    if (menu) {
      for (const edge of ['confirmPressed', 'backPressed', 'pausePressed'] as const) {
        if (menu[edge]) this.blockedInputs.add(`menu:${slot}:${edge}`);
      }
    }
  }

  private updateEdges(slot: PlayerId, input: PlayerInput): void {
    const previous = this.previousActions.get(slot) ?? { dash: false, nextWeapon: false };
    const pending = this.pendingActions.get(slot) ?? { dash: false, nextWeapon: false };
    for (const action of EDGE_ACTIONS) {
      pending[action] ||= input[action] && !previous[action] && !this.blockedInputs.has(`control:${slot}:${action}`);
    }
    this.pendingActions.set(slot, pending);
    this.previousActions.set(slot, { dash: input.dash, nextWeapon: input.nextWeapon });
  }

  private updateMenu(slot: PlayerId, command: MenuCommand | { confirm: boolean; back: boolean; pause: boolean; navX: number; navY: number }): void {
    const raw: MenuCommand = 'confirmPressed' in command ? command : {
      confirmPressed: command.confirm, backPressed: command.back, pausePressed: command.pause, navX: command.navX, navY: command.navY,
    };
    const normalized = { ...raw };
    const previous = this.previousMenu.get(slot) ?? { confirmPressed: false, backPressed: false, pausePressed: false };
    const pending = this.pendingMenu.get(slot) ?? { confirmPressed: false, backPressed: false, pausePressed: false };
    for (const edge of ['confirmPressed', 'backPressed', 'pausePressed'] as const) {
      const blocked = `menu:${slot}:${edge}`;
      if (this.blockedInputs.has(blocked)) {
        if (normalized[edge]) normalized[edge] = false;
        else this.blockedInputs.delete(blocked);
      }
      pending[edge] ||= normalized[edge] && !previous[edge];
    }
    this.pendingMenu.set(slot, pending);
    this.previousMenu.set(slot, {
      confirmPressed: normalized.confirmPressed, backPressed: normalized.backPressed, pausePressed: normalized.pausePressed,
    });
    this.menuCommands.set(slot, normalized);
  }

  private findPad(pads: ArrayLike<PadLike | null>, index: number): PadLike | null {
    const candidate = pads[index];
    return candidate?.connected && candidate.index === index ? candidate : null;
  }

  private requirePause(reason: 'device-disconnected' | 'focus-lost'): void {
    if (this.pauseNotified) return;
    this.pauseNotified = true;
    this.pauseHandler?.(reason);
  }

  private resetSlot(slot: PlayerId): void {
    this.frames.delete(slot);
    this.menuCommands.delete(slot);
    this.previousActions.delete(slot);
    this.previousMenu.delete(slot);
  }

  private clearPendingForSlot(slot: PlayerId): void {
    this.pendingActions.set(slot, { dash: false, nextWeapon: false });
    this.pendingMenu.set(slot, { confirmPressed: false, backPressed: false, pausePressed: false });
  }

  private listen(type: string, callback: (event: Event) => void, target = this.target): void {
    const listener: EventListener = event => callback(event);
    target?.addEventListener(type, listener);
    if (target) this.listeners.push([target, type, listener]);
  }

  private updateKeyboardDiagnostics(): void {
    const relevantKeys = new Set<string>();
    for (const binding of this.bindings.values()) {
      if (binding.type === 'keyboard-shared') {
        const profile = binding.profile === 'p1'
          ? ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyE', 'KeyQ']
          : ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'KeyK', 'KeyL', 'KeyO', 'KeyP'];
        for (const code of profile) if (this.pressedKeys.has(code)) relevantKeys.add(code);
      }
    }
    const codes = [...relevantKeys].sort();
    this.diagnostics = { simultaneousKeyCount: codes.length, simultaneousCodes: codes, ghostingWarning: codes.length > 1 };
  }

  private browserViewport(): { width: number; height: number } {
    return typeof window === 'undefined' ? { width: 1, height: 1 } : { width: window.innerWidth, height: window.innerHeight };
  }

  private assertLive(): void { if (this.disposed) throw new Error('InputHub já foi descartado'); }
}
