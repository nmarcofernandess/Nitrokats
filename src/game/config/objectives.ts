import type { ObjectiveType } from '../types';

export interface ObjectiveConfig {
  id: string;
  wave: number;
  type: ObjectiveType;
  title: string;
  description: string;
  targetValue: number;
  timerSeconds?: number;
}

export const OBJECTIVES_BY_WAVE: ObjectiveConfig[] = [
  {
    id: 'wave1-eliminate',
    wave: 1,
    type: 'eliminate',
    title: 'Sweep the Entrance',
    description: 'Neutralize the first assault line.',
    targetValue: 12,
  },
  {
    id: 'wave2-defend',
    wave: 2,
    type: 'defend_zone',
    title: 'Hold Zone Alpha',
    description: 'Maintain control of the uplink under pressure.',
    targetValue: 1,
    timerSeconds: 28,
  },
  {
    id: 'wave3-elite',
    wave: 3,
    type: 'eliminate_elite',
    title: 'Destroy the Brute Alpha',
    description: 'Eliminate the elite brute leading the swarm.',
    targetValue: 1,
  },
  {
    id: 'wave4-escort',
    wave: 4,
    type: 'escort',
    title: 'Escort the Beacon',
    description: 'Protect the moving beacon route.',
    targetValue: 1,
    timerSeconds: 34,
  },
  {
    id: 'wave5-mixed',
    wave: 5,
    type: 'survive_mixed',
    title: 'Survive Crossfire',
    description: 'Survive and clear mixed-pressure attack.',
    targetValue: 20,
    timerSeconds: 30,
  },
  {
    id: 'wave6-miniboss',
    wave: 6,
    type: 'miniboss',
    title: 'MechaCat Override',
    description: 'Defeat the MechaCat core unit.',
    targetValue: 1,
  },
];

export const getObjectiveForWave = (wave: number): ObjectiveConfig | undefined =>
  OBJECTIVES_BY_WAVE.find((objective) => objective.wave === wave);
