import type { Page } from '@playwright/test';
import type { PlayerId, PlayerInput, RunPhase, Vec2 } from '../../../src/play/core/model';

export interface TestSnapshot {
  tick: number;
  phase: RunPhase;
  players: Array<{ id: PlayerId; position: Vec2; hp: number; status: 'active' | 'down' }>;
  enemies: Array<{ id: string; position: Vec2; hp: number; status: 'alive' | 'dead' }>;
  projectiles: Array<{ id: string; team: 'players' | 'enemies'; position: Vec2 }>;
  stageIndex: number;
  encounter: { emitted: number; defeated: number; quota: number } | null;
  colliders: Array<{ min: Vec2; max: Vec2 }>;
}

export async function enterTraining(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/?edition=reboot');
  await page.getByRole('button', { name: 'Jogar em dupla', exact: true }).click();
  await page.getByRole('button', { name: 'Teclado compartilhado', exact: true }).click();
  await page.getByRole('button', { name: 'P1 pronto', exact: true }).click();
  await page.getByRole('button', { name: 'P2 pronto', exact: true }).click();
  await page.getByRole('button', { name: 'Treinar', exact: true }).click();
  await expectTrainingReady(page);
}

async function expectTrainingReady(page: Page): Promise<void> {
  await page.getByTestId('hud-p1').waitFor({ state: 'visible' });
  await page.getByTestId('hud-p2').waitFor({ state: 'visible' });
}

export async function setInput(page: Page, slot: PlayerId, command: Partial<PlayerInput>): Promise<void> {
  await page.evaluate(({ playerId, patch }) => {
    const bridge = (window as Window & { __nitrokatsTest?: { setInput(slot: PlayerId, command: Partial<PlayerInput>): void } }).__nitrokatsTest;
    if (!bridge) throw new Error('TestBridge indisponível neste build');
    bridge.setInput(playerId, patch);
  }, { playerId: slot, patch: command });
}

export async function snapshot(page: Page): Promise<TestSnapshot> {
  return page.evaluate(() => {
    const bridge = (window as Window & { __nitrokatsTest?: { snapshot(): TestSnapshot } }).__nitrokatsTest;
    if (!bridge) throw new Error('TestBridge indisponível neste build');
    return bridge.snapshot();
  });
}
