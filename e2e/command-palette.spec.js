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

  test('task selection jumps to its week and highlights it', async ({ page }) => {
    // 2週前のタスクをシード（1週前だと carryOverOldTasks で未割り当てに繰り越されるため2週前にする）
    await page.addInitScript(() => {
      const now = new Date();
      const monday = new Date(now);
      const day = (monday.getDay() + 6) % 7; // 月曜日起算
      monday.setDate(monday.getDate() - day - 14);
      const y = monday.getFullYear();
      const m = String(monday.getMonth() + 1).padStart(2, '0');
      const d = String(monday.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      localStorage.setItem('weekly-task-board.tasks', JSON.stringify([{
        id: 'e2e-past-task',
        name: '過去週の検証用タスク',
        estimated_time: 30,
        actual_time: 0,
        completed: false,
        priority: 'medium',
        category: 'task',
        date: dateStr,
        assigned_date: dateStr,
        due_date: null,
        details: '',
        is_recurring: false,
        recurrence_pattern: null,
        recurrence_end_date: null
      }]));
    });
    await page.goto('/');

    await page.keyboard.press('Control+k');
    const input = page.locator('#command-palette-input');
    await input.fill('過去週の検証用タスク');
    // debounce(150ms) 後の結果反映を待ってから Enter する（結果が空のまま Enter するとコマンド側が実行される）
    await expect(page.locator('#command-palette-results li').filter({ hasText: '過去週の検証用タスク' })).toBeVisible();
    await page.keyboard.press('Enter');

    // 週移動＋再描画により過去週タスクが描画される。ハイライトは3秒で消えるため最初に検証
    await expect(page.locator('[data-task-id="e2e-past-task"].palette-highlight')).toHaveCount(1);
    await expect(page.locator('[data-task-id="e2e-past-task"]')).toBeVisible();
    await expect(page.locator('#command-palette')).toBeHidden();
  });
});
