import { expect, test } from '@playwright/test';
import { enterTraining, setInput, snapshot } from './support/virtualInput';

test('dois jogadores movem independentemente @smoke', async ({ page }) => {
  await enterTraining(page);
  expect(await page.evaluate(() => Object.keys((window as Window & { __nitrokatsTest?: object }).__nitrokatsTest ?? {}).sort())).toEqual(['setInput', 'snapshot']);
  const before = await snapshot(page);
  expect(Object.keys(before).sort()).toEqual(['colliders', 'encounter', 'enemies', 'metrics', 'phase', 'players', 'projectiles', 'stageIndex', 'tick']);

  await setInput(page, 'p1', { move: { x: 1, z: 0 } });
  await expect.poll(async () => (await snapshot(page)).tick).toBeGreaterThan(before.tick + 20);
  await setInput(page, 'p1', { move: { x: 0, z: 0 } });

  const after = await snapshot(page);
  expect(after.players[0]?.position.x).toBeGreaterThan(before.players[0]!.position.x);
  expect(after.players[1]?.position).toEqual(before.players[1]!.position);

  const target = after.enemies[0]!;
  const player = after.players[0]!;
  const aim = { x: target.position.x - player.position.x, z: target.position.z - player.position.z };
  const length = Math.hypot(aim.x, aim.z);
  await setInput(page, 'p1', { aim: { x: aim.x / length, z: aim.z / length }, fire: true });
  await expect.poll(async () => (await snapshot(page)).enemies.find((enemy) => enemy.id === target.id)!.hp).toBeLessThan(target.hp);
  await setInput(page, 'p1', {});

  await page.getByRole('button', { name: 'Pausar partida' }).click();
  await expect(page.getByRole('dialog', { name: 'Partida pausada' })).toBeVisible();
  expect((await snapshot(page)).phase).toBe('paused');
  await page.getByRole('button', { name: 'Continuar' }).click();

  await page.getByRole('button', { name: 'Simular queda de P1' }).click();
  await expect(page.getByTestId('hud-p1')).toContainText('CAÍDO');
  await setInput(page, 'p2', { revive: true });
  await expect.poll(async () => (await snapshot(page)).players.find((entry) => entry.id === 'p1')!).toMatchObject({ hp: 40, status: 'active' });
  await setInput(page, 'p2', {});
});
