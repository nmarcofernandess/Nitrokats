import { expect, test } from '@playwright/test';

test('build normal mantém a ponte de teste fora da distribuição', async ({ page }) => {
  await page.goto('/?edition=reboot');

  const bridgeExists = await page.evaluate(() => '__nitrokatsTest' in window);
  expect(bridgeExists).toBe(false);
  await expect(page.getByRole('heading', { name: 'CATZ COMBIES' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play Tank' })).toBeVisible();
});
