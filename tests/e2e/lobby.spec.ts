import { expect, test, type Page } from '@playwright/test';

type MutablePad = { axes: number[]; buttons: Array<{ value: number; pressed: boolean }>; index: number; id: string; mapping: string; connected: boolean };

async function setPad(page: Page, index: number, x = 0, y = 0, button?: number) {
  await page.evaluate(({ index: padIndex, x: axisX, y: axisY, button: pressedButton }) => {
    const pads = (window as Window & { __nitroTestPads: MutablePad[] }).__nitroTestPads;
    for (const pad of pads) {
      pad.axes[0] = 0;
      pad.axes[1] = 0;
      pad.buttons.forEach((entry) => { entry.pressed = false; entry.value = 0; });
    }
    const selected = pads[padIndex]!;
    selected.axes[0] = axisX;
    selected.axes[1] = axisY;
    if (pressedButton !== undefined) {
      selected.buttons[pressedButton]!.pressed = true;
      selected.buttons[pressedButton]!.value = 1;
    }
  }, { index, x, y, button });
  await page.waitForTimeout(110);
}

async function pulsePad(page: Page, index: number, x = 0, y = 0, button?: number) {
  await setPad(page, index, x, y, button);
  await setPad(page, index);
  await page.waitForTimeout(240);
}

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
  await page.getByRole('button', { name: 'P1 pronto', exact: true }).click();
  await page.getByRole('button', { name: 'P2 pronto', exact: true }).click();
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

test('sair do treino solo permite escolher dupla e iniciar com os dois slots', async ({ page }) => {
  await page.goto('/?edition=reboot');
  await page.getByRole('button', { name: 'Jogar em dupla', exact: true }).click();
  await page.getByRole('button', { name: 'Teclado compartilhado', exact: true }).click();
  await page.getByLabel('Gato de P2').selectOption('ivy');
  await page.getByLabel('Arma de P2').selectOption('scatter_cannon');
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await page.getByRole('button', { name: 'Jogar sozinho', exact: true }).click();
  await page.getByRole('button', { name: 'Teclado compartilhado', exact: true }).click();
  await page.getByRole('button', { name: 'P1 pronto', exact: true }).click();
  await page.getByRole('button', { name: 'Treinar', exact: true }).click();
  await page.getByRole('button', { name: 'Pausar partida' }).click();
  await page.getByRole('button', { name: 'Voltar ao lobby' }).click();
  await page.getByRole('button', { name: 'Voltar', exact: true }).click();
  await page.getByRole('button', { name: 'Jogar em dupla', exact: true }).click();

  await expect(page.getByRole('region', { name: 'Espaço P1' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Espaço P2' })).toBeVisible();
  await expect(page.getByLabel('Gato de P2')).toHaveValue('ivy');
  await expect(page.getByLabel('Arma de P2')).toHaveValue('scatter_cannon');
  await expect(page.getByLabel('Dispositivo de P2')).toHaveValue('keyboard-shared');
  await page.getByRole('button', { name: 'Teclado compartilhado', exact: true }).click();
  await page.getByRole('button', { name: 'P1 pronto', exact: true }).click();
  await page.getByRole('button', { name: 'P2 pronto', exact: true }).click();
  await page.getByRole('button', { name: 'Treinar', exact: true }).click();
  await expect(page.getByTestId('hud-p1')).toBeVisible();
  await expect(page.getByTestId('hud-p2')).toBeVisible();
});

test('Enter confirma P1 pronto uma vez sem marcar P2 nem ativar outra opção', async ({ page }) => {
  await page.goto('/?edition=reboot');
  await page.getByRole('button', { name: 'Jogar em dupla', exact: true }).click();
  await page.getByRole('button', { name: 'Teclado compartilhado', exact: true }).click();
  const p1Ready = page.getByTestId('ready-p1');
  await p1Ready.focus();
  await p1Ready.evaluate((element) => {
    let clicks = 0;
    element.addEventListener('click', () => { clicks += 1; element.setAttribute('data-test-click-count', String(clicks)); });
  });
  await page.keyboard.down('Enter');
  await page.waitForTimeout(120);
  await page.keyboard.up('Enter');
  await expect(page.getByRole('button', { name: 'Cancelar pronto de P1', exact: true })).toBeVisible();
  await expect(p1Ready).toHaveAttribute('data-test-click-count', '1');
  await expect(page.getByRole('button', { name: 'P2 pronto', exact: true })).toBeVisible();
  await expect(page.getByLabel('Dispositivo de P1')).toHaveValue('keyboard-shared');
  await expect(page.getByLabel('Dispositivo de P2')).toHaveValue('keyboard-shared');
});

test('retornar ao lobby preserva dificuldade tranquila e bot parceiro', async ({ page }) => {
  await page.goto('/?edition=reboot');
  await page.getByRole('button', { name: 'Jogar sozinho', exact: true }).click();
  await page.getByRole('button', { name: 'Teclado compartilhado', exact: true }).click();
  await page.getByRole('button', { name: 'Modo treino' }).click();
  await page.getByLabel('Dificuldade').selectOption('relaxed');
  await page.getByLabel('Treinar com bot parceiro (sem dano aos jogadores)').check();
  await page.getByRole('button', { name: 'P1 pronto', exact: true }).click();
  await page.getByRole('button', { name: 'Treinar', exact: true }).click();
  await page.getByRole('button', { name: 'Pausar partida' }).click();
  await page.getByRole('button', { name: 'Voltar ao lobby' }).click();
  await expect(page.getByLabel('Dificuldade')).toHaveValue('relaxed');
  await expect(page.getByLabel('Treinar com bot parceiro (sem dano aos jogadores)')).toBeChecked();
});

test('gamepads conseguem escolher dispositivos e confirmar os slots sem teclado', async ({ page }) => {
  await page.addInitScript(() => {
    const pads = Array.from({ length: 2 }, (_, index) => ({
      axes: [0, 0, 0, 0],
      buttons: Array.from({ length: 17 }, () => ({ value: 0, pressed: false })),
      connected: true,
      id: `Nitrokats test pad ${index + 1}`,
      index,
      mapping: 'standard',
    }));
    (window as Window & { __nitroTestPads: MutablePad[] }).__nitroTestPads = pads;
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => pads });
  });
  await page.goto('/?edition=reboot');
  await page.getByRole('button', { name: 'Jogar em dupla', exact: true }).click();
  await expect(page.getByLabel('Dispositivo de P1')).toHaveCount(1);

  // The first unassigned standard pad temporarily owns host navigation until P1 assigns a device.
  for (let step = 0; step < 3; step += 1) await pulsePad(page, 0, 0, 1);
  await expect(page.getByLabel('Dispositivo de P1')).toBeFocused();
  for (let step = 0; step < 3; step += 1) await pulsePad(page, 0, 1, 0);
  await expect(page.getByLabel('Dispositivo de P1')).toHaveValue('pad:0');
  await pulsePad(page, 0, 0, 0, 0);
  await expect(page.getByLabel('Dispositivo de P1')).toHaveValue('pad:0');
  await pulsePad(page, 0, 0, 1);
  await expect(page.getByRole('button', { name: 'P1 pronto', exact: true })).toBeFocused();
  await pulsePad(page, 0, 0, 0, 0);
  await expect(page.getByRole('button', { name: 'Cancelar pronto de P1', exact: true })).toBeVisible();

  for (let step = 0; step < 3; step += 1) await pulsePad(page, 0, 0, 1);
  await expect(page.getByLabel('Dispositivo de P2')).toBeFocused();
  for (let step = 0; step < 3; step += 1) await pulsePad(page, 0, 1, 0);
  await expect(page.getByLabel('Dispositivo de P2')).toHaveValue('pad:1');
  await pulsePad(page, 0, 0, 0, 0);
  await expect(page.getByLabel('Dispositivo de P2')).toHaveValue('pad:1');
  await pulsePad(page, 0, 0, 1);
  await expect(page.getByRole('button', { name: 'P2 pronto', exact: true })).toBeFocused();
  await pulsePad(page, 0, 0, 0, 0);
  await expect(page.getByRole('button', { name: 'P2 pronto', exact: true })).toBeVisible();
  await pulsePad(page, 1, 0, 0, 0);
  await expect(page.getByRole('button', { name: 'Cancelar pronto de P2', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Treinar', exact: true }).click();
  await expect(page.getByTestId('hud-p1')).toBeVisible();
  await expect(page.getByTestId('hud-p2')).toBeVisible();
});
