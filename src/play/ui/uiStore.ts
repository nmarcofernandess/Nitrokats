import { create } from 'zustand';
import type { CatId, PlayerId, RunPhase, WeaponId } from '../core/model';
import type { DeviceBinding } from '../input/bindings';

export interface LobbyPlayer {
  id: PlayerId;
  catId: CatId;
  weaponId: WeaponId;
  device: DeviceBinding | null;
  ready: boolean;
}

export interface RuntimePlayerSnapshot {
  id: PlayerId;
  catId: CatId;
  weaponId: WeaponId;
  hp: number;
  maxHp: number;
  dashCooldown: number;
  status: 'active' | 'down';
}

export interface RuntimeSnapshot {
  phase: RunPhase;
  players: RuntimePlayerSnapshot[];
  objective: string;
  wave: number;
  targetCount: number;
  training: boolean;
}

interface UiState {
  screen: 'home' | 'lobby' | 'game';
  lobbyPlayers: LobbyPlayer[];
  snapshot: RuntimeSnapshot | null;
  setScreen: (screen: UiState['screen']) => void;
  setLobbyPlayers: (players: LobbyPlayer[]) => void;
  setRuntimeSnapshot: (snapshot: RuntimeSnapshot) => void;
  clearRuntimeSnapshot: () => void;
}

const initialLobby: LobbyPlayer[] = [
  { id: 'p1', catId: 'anakin', weaponId: 'pulse_rifle', device: null, ready: false },
  { id: 'p2', catId: 'yang', weaponId: 'pulse_rifle', device: null, ready: false },
];

export const useUiStore = create<UiState>((set) => ({
  screen: 'home',
  lobbyPlayers: initialLobby,
  snapshot: null,
  setScreen: (screen) => set({ screen }),
  setLobbyPlayers: (lobbyPlayers) => set({ lobbyPlayers: lobbyPlayers.map((player) => ({ ...player, device: player.device ? { ...player.device } : null })) }),
  // Runtime values are a read-only projection. UI actions never write combat state here.
  setRuntimeSnapshot: (snapshot) => set({ snapshot }),
  clearRuntimeSnapshot: () => set({ snapshot: null }),
}));

export function copyLobbyPlayers(players: LobbyPlayer[]): LobbyPlayer[] {
  return players.map((player) => ({ ...player, device: player.device ? { ...player.device } : null }));
}
