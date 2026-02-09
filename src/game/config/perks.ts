import type { RunPerkId } from '../types';

export interface RunPerkConfig {
  id: RunPerkId;
  label: string;
  description: string;
  modifiers: {
    fireRateMultiplier?: number;
    damageMultiplier?: number;
    projectileSpeedMultiplier?: number;
    maxHealthBonus?: number;
    lifeSteal?: number;
    recoilMultiplier?: number;
    splashDamage?: number;
  };
}

export const RUN_PERK_CONFIG: Record<RunPerkId, RunPerkConfig> = {
  rapid_loader: {
    id: 'rapid_loader',
    label: 'Rapid Loader',
    description: '+18% fire rate on all weapons.',
    modifiers: { fireRateMultiplier: 0.82 },
  },
  overcharge: {
    id: 'overcharge',
    label: 'Overcharge Core',
    description: '+22% weapon damage.',
    modifiers: { damageMultiplier: 1.22 },
  },
  fortified: {
    id: 'fortified',
    label: 'Fortified Plating',
    description: '+35 max health this run.',
    modifiers: { maxHealthBonus: 35 },
  },
  vampiric_rounds: {
    id: 'vampiric_rounds',
    label: 'Vampiric Rounds',
    description: 'Recover 8% of damage dealt as health.',
    modifiers: { lifeSteal: 0.08 },
  },
  stabilizer: {
    id: 'stabilizer',
    label: 'Gyro Stabilizer',
    description: '-35% recoil and tighter spread feel.',
    modifiers: { recoilMultiplier: 0.65 },
  },
  shockwave: {
    id: 'shockwave',
    label: 'Shockwave Ammo',
    description: 'Direct hits trigger light splash damage.',
    modifiers: { splashDamage: 12 },
  },
};

export const RUN_PERK_POOL: RunPerkId[] = [
  'rapid_loader',
  'overcharge',
  'fortified',
  'vampiric_rounds',
  'stabilizer',
  'shockwave',
];
