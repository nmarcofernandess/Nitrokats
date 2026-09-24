import { expect, test } from '@playwright/test';

test('dupla entra pelo teclado compartilhado, treina, pausa e reentra sem estado velho @smoke', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/?edition=reboot');

  await page.getByRole('button', { name: 'Jogar em dupla', exact: true }).click();
  await page.getByRole('button', { name: 'Teclado compartilhado', exact: true }).click();
  await page.getByRole('button', { name: 'Treinar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Lobby cooperativo' })).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Escolha e confirme');
  await expect(page.getByLabel('Dispositivo de P1')).toHaveValue('keyboard-shared');
  await expect(page.getByLabel('Dispositivo de P2')).toHaveValue('keyboard-shared');
  await page.getByLabel('Gato de P1').selectOption('maya');
  await page.getByLabel('Gato de P2').selectOption('maya');
  await page.getByLabel('Arma de P2').selectOption('arc_marksman');
  await page.getByRole('button', { name: 'P1 pronto', exact: true }).click();
  await page.getByRole('button', { name: 'P2 pronto', exact: true }).click();
  await page.getByRole('button', { name: 'Treinar', exact: true }).click();
  await expect(page.getByTestId('hud-p1')).toBeVisible();
  await expect(page.getByTestId('hud-p2')).toBeVisible();
  await expect(page.getByTestId('hud-objective')).toBeVisible();
  await expect(page.getByTestId('hud-objective')).toContainText('3 alvos sem dano');
  await expect(page.getByText(/WASD|setas|teclas/i).first()).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Vida de P1' })).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Vida de P2' })).toBeVisible();

  const hudP1 = page.getByTestId('hud-p1');
  const hudP2 = page.getByTestId('hud-p2');
  const p1Box = await hudP1.boundingBox();
  const p2Box = await hudP2.boundingBox();
  expect(p1Box).not.toBeNull();
  expect(p2Box).not.toBeNull();
  expect(p1Box!.x + p1Box!.width).toBeLessThanOrEqual(1280);
  expect(p2Box!.x + p2Box!.width).toBeLessThanOrEqual(1280);

  await page.screenshot({ path: 'test-results/t09-training-1280x720.png' });
  await page.getByRole('button', { name: 'Simular queda de P1' }).click();
  await expect(hudP1).toContainText('CAÍDO');
  await page.keyboard.down('o');
  await expect(hudP1).toContainText('HP 40/100', { timeout: 6000 });
  await page.keyboard.up('o');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Partida pausada' })).toBeVisible();
  await page.screenshot({ path: 'test-results/t09-pause-1280x720.png' });
  await page.getByRole('button', { name: 'Recomeçar' }).click();
  await expect(page.getByRole('dialog', { name: 'Confirmar recomeço' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar' }).click();
  await expect(page.getByRole('dialog', { name: 'Partida pausada' })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByRole('dialog', { name: 'Partida pausada' })).toBeHidden();

  await page.getByRole('button', { name: 'Pausar partida' }).click();
  await page.getByRole('button', { name: 'Recomeçar' }).click();
  await page.getByRole('button', { name: 'Confirmar recomeço' }).click();
  await expect(page.getByTestId('hud-p1')).toBeVisible();
  await expect(page.getByTestId('hud-p2')).toBeVisible();
  await expect(page.getByTestId('hud-objective')).toContainText('3 alvos sem dano');

  await page.getByRole('button', { name: 'Pausar partida' }).click();
  await page.getByRole('button', { name: 'Voltar ao lobby' }).click();
  await expect(page.getByRole('heading', { name: 'Lobby cooperativo' })).toBeVisible();
  await expect(page.getByLabel('Gato de P1')).toHaveValue('maya');
  await expect(page.getByLabel('Gato de P2')).toHaveValue('maya');
  await expect(page.getByLabel('Arma de P2')).toHaveValue('arc_marksman');
  await page.getByRole('button', { name: 'Treinar' }).click();
  await expect(page.getByTestId('hud-p1')).toBeVisible();
  await expect(page.getByTestId('hud-p2')).toBeVisible();
});

test('treino solo permite ativar bot parceiro sem tirar o controle do jogador', async ({ page }) => {
  await page.goto('/?edition=reboot');
  await page.getByRole('button', { name: 'Jogar sozinho', exact: true }).click();
  await page.getByRole('button', { name: 'Teclado compartilhado', exact: true }).click();
  await page.getByRole('button', { name: 'Modo treino' }).click();
  await page.getByLabel('Treinar com bot parceiro (sem dano aos jogadores)').check();
  await page.getByRole('button', { name: 'P1 pronto', exact: true }).click();
  await page.getByRole('button', { name: 'Treinar', exact: true }).click();
  await expect(page.getByTestId('hud-p1')).toBeVisible();
  await expect(page.getByTestId('hud-p2')).toBeVisible();
  await expect(page.getByTestId('hud-objective')).toContainText('3 alvos sem dano');
});

test('confirmação de recomeço identifica a campanha', async ({ page }) => {
  await page.goto('/?edition=reboot');
  await page.getByRole('button', { name: 'Jogar em dupla', exact: true }).click();
  await page.getByRole('button', { name: 'Teclado compartilhado', exact: true }).click();
  await page.getByRole('button', { name: 'P1 pronto', exact: true }).click();
  await page.getByRole('button', { name: 'P2 pronto', exact: true }).click();
  await page.getByRole('button', { name: 'Começar campanha', exact: true }).click();
  await page.getByRole('button', { name: 'Pausar partida' }).click();
  await page.getByRole('button', { name: 'Recomeçar' }).click();
  await expect(page.getByRole('heading', { name: 'Recomeçar campanha?' })).toBeVisible();
});
