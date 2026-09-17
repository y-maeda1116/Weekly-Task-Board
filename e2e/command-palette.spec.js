import { test, expect } from '@playwright/test';

test.describe('Command Palette', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Ctrl+K opens palette, filtering works, Escape closes', async ({ page }) => {
    await page.keyboard.press('Control+k');
    const input = page.locator('#command-palette-input');
    await expect(input).toBeVisible();
    await expect(page.locator('#command-palette-results li')).not.toHaveCount(0);

    await input.fill('テーマ');
    await expect(page.locator('#command-palette-results li')).not.toHaveCount(0);

    await page.keyboard.press('Escape');
    await expect(page.locator('#command-palette')).toBeHidden();
  });

  test('header search button opens palette', async ({ page }) => {
    await page.locator('#palette-toggle').click();
    await expect(page.locator('#command-palette-input')).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('arrow keys navigate and Enter executes a command', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await page.keyboard.press('ArrowDown');
    const selected = page.locator('#command-palette-results .palette-item-selected');
    await expect(selected).toHaveCount(1);
    // 選択状態の項目が Enter で実行されパレットが閉じること（実行結果の画面遷移はコマンド次第）
    await page.keyboard.press('Enter');
    await expect(page.locator('#command-palette')).toBeHidden();
  });
});
