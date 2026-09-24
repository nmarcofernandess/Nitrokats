import { create } from 'zustand';
import type { CatId, Difficulty, PlayerId, RunPhase, WeaponId } from '../core/model';
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
  lobbyOptions: { difficulty: Difficulty; trainingBot: boolean };
  snapshot: RuntimeSnapshot | null;
  setScreen: (screen: UiState['screen']) => void;
  setLobbyPlayers: (players: LobbyPlayer[]) => void;
  setLobbyOptions: (options: UiState['lobbyOptions']) => void;
  setRuntimeSnapshot: (snapshot: RuntimeSnapshot) => void;
  clearRuntimeSnapshot: () => void;
}

const initialLobby: LobbyPlayer[] = [
  { id: 'p1', catId: 'anakin', weaponId: 'pulse_rifle', device: null, ready: false },
  { id: 'p2', catId: 'yang', weaponId: 'pulse_rifle', device: null, ready: false },
];

const initialLobbyOptions = { difficulty: 'normal' as Difficulty, trainingBot: false };

export const useUiStore = create<UiState>((set) => ({
  screen: 'home',
  lobbyPlayers: initialLobby,
  lobbyOptions: initialLobbyOptions,
  snapshot: null,
  setScreen: (screen) => set({ screen }),
  setLobbyPlayers: (lobbyPlayers) => set({ lobbyPlayers: lobbyPlayers.map((player) => ({ ...player, device: player.device ? { ...player.device } : null })) }),
  setLobbyOptions: (lobbyOptions) => set({ lobbyOptions: { ...lobbyOptions } }),
  // Runtime values are a read-only projection. UI actions never write combat state here.
  setRuntimeSnapshot: (snapshot) => set({ snapshot }),
  clearRuntimeSnapshot: () => set({ snapshot: null }),
}));

export function copyLobbyPlayers(players: LobbyPlayer[]): LobbyPlayer[] {
  const savedById = new Map(players.map((player) => [player.id, player]));
  return initialLobby.map((fallback) => {
    const player = savedById.get(fallback.id) ?? fallback;
    return { ...player, device: player.device ? { ...player.device } : null };
  });
}
