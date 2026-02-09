import type { WeaponId } from '../types';

export interface WeaponConfig {
  id: WeaponId;
  label: string;
  fireRate: number;
  damage: number;
  projectileSpeed: number;
  spreadAngle: number;
  pelletCount: number;
  recoil: number;
  color: string;
}

export const WEAPON_CONFIG: Record<WeaponId, WeaponConfig> = {
  pulse_rifle: {
    id: 'pulse_rifle',
    label: 'Pulse Rifle',
    fireRate: 0.12,
    damage: 16,
    projectileSpeed: 36,
    spreadAngle: 0.035,
    pelletCount: 1,
    recoil: 0.2,
    color: '#39d4ff',
  },
  scatter_cannon: {
    id: 'scatter_cannon',
    label: 'Scatter Cannon',
    fireRate: 0.45,
    damage: 12,
    projectileSpeed: 28,
    spreadAngle: 0.17,
    pelletCount: 6,
    recoil: 0.45,
    color: '#ff9f29',
  },
  arc_marksman: {
    id: 'arc_marksman',
    label: 'Arc Marksman',
    fireRate: 0.78,
    damage: 48,
    projectileSpeed: 44,
    spreadAngle: 0.01,
    pelletCount: 1,
    recoil: 0.62,
    color: '#d070ff',
  },
};

export const WEAPON_ROTATION_ORDER: WeaponId[] = ['pulse_rifle', 'scatter_cannon', 'arc_marksman'];
