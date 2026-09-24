import { expect, test } from '@playwright/test';

test('a base ainda abre um único canvas @smoke', async ({ page }, testInfo) => {
  const errors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.goto('/?edition=legacy');
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'CATZ COMBIES' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play Tank' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play Zombie' })).toBeVisible();
  await expect(page.getByText('WASD move • Hold LMB shoot • Mouse look')).toBeVisible();
  await expect(page.getByText('ESC pause • Click game to lock mouse')).toBeVisible();
  const screenshotPath = testInfo.outputPath('legacy-menu.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await testInfo.attach('legacy-menu', { path: screenshotPath, contentType: 'image/png' });

  expect(errors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
