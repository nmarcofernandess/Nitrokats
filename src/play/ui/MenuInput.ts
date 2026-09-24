import type { PlayerId } from '../core/model';
import type { DeviceBinding } from '../input/bindings';
import type { MenuCommand } from '../input/bindings';

export type MenuCommandFrame = Partial<Record<PlayerId, MenuCommand>>;

export function moveMenuFocus(index: number, itemCount: number, command: MenuCommand): number {
  if (itemCount < 1) return -1;
  const direction = command.navY < -0.5 || command.navX > 0.5 ? 1
    : command.navY > 0.5 || command.navX < -0.5 ? -1 : 0;
  if (direction === 0) return Math.max(0, Math.min(index, itemCount - 1));
  return (index + direction + itemCount) % itemCount;
}

export function hasMenuNavigation(command: MenuCommand): boolean {
  return Math.abs(command.navX) > 0.5 || Math.abs(command.navY) > 0.5;
}

export function playerConfirmed(commands: MenuCommandFrame, playerId: PlayerId): boolean {
  return commands[playerId]?.confirmPressed === true;
}

export function hostConfirmed(commands: MenuCommandFrame): boolean {
  return playerConfirmed(commands, 'p1');
}

export function hasValidDeviceAssignments(players: Array<{ id: PlayerId; device: DeviceBinding | null }>): boolean {
  for (const [index, player] of players.entries()) {
    if (!player.device) return false;
    if (player.device.type === 'keyboard-shared' && player.device.profile !== player.id) return false;
    if (player.device.type === 'keyboard-mouse' && player.id !== 'p1') return false;
    for (const other of players.slice(index + 1)) {
      if (!other.device) return false;
      if (player.device.type === 'gamepad' && other.device.type === 'gamepad' && player.device.index === other.device.index) return false;
      if (player.device.type === 'keyboard-mouse' && other.device.type === 'keyboard-mouse') return false;
      if ((player.device.type === 'keyboard-mouse' && other.device.type === 'keyboard-shared' && other.device.profile === 'p1')
        || (other.device.type === 'keyboard-mouse' && player.device.type === 'keyboard-shared' && player.device.profile === 'p1')) return false;
    }
  }
  return true;
}
