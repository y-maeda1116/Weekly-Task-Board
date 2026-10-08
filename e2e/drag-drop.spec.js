import { test, expect } from '@playwright/test';

test.describe('Drag and Drop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    await page.evaluate(() => localStorage.removeItem('weekly-task-board.tasks'));
    await page.evaluate(() => localStorage.removeItem('weekly-task-board.archive'));
    await page.reload();
    await page.waitForTimeout(500);
  });

  test('task loaded at startup can be moved to another day', async ({ page }) => {
    await page.click('#add-task-btn');
    await page.fill('#task-name', '既存タスク');
    await page.fill('#estimated-time', '1');
    await page.click('#task-form button[type="submit"]');
    await page.waitForTimeout(300);
    await page.reload();
    await page.waitForTimeout(500);

    const task = page.locator('.task', { hasText: '既存タスク' });
    const target = page.locator('.day-column:not(#unassigned-tasks)').last();
    const targetDate = await target.getAttribute('data-date');
    await task.dragTo(target);
    await page.waitForTimeout(300);

    await expect(target.locator('.task', { hasText: '既存タスク' })).toHaveCount(1);
    const stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('weekly-task-board.tasks') || '[]'),
    );
    expect(stored.find((t) => t.name === '既存タスク')?.assigned_date).toBe(targetDate);
  });

  test('task created via modal can be moved to another day', async ({ page }) => {
    // Creating a task via the modal replaces the in-memory task list
    await page.click('#add-task-btn');
    await page.fill('#task-name', 'ドラッグテスト');
    await page.fill('#estimated-time', '1');
    await page.click('#task-form button[type="submit"]');
    await page.waitForTimeout(300);

    const task = page.locator('.task', { hasText: 'ドラッグテスト' });
    await expect(task).toHaveCount(1);

    const target = page.locator('.day-column:not(#unassigned-tasks)').last();
    const targetDate = await target.getAttribute('data-date');
    await task.dragTo(target);
    await page.waitForTimeout(300);

    await expect(target.locator('.task', { hasText: 'ドラッグテスト' })).toHaveCount(1);
    const stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('weekly-task-board.tasks') || '[]'),
    );
    expect(stored.find((t) => t.name === 'ドラッグテスト')?.assigned_date).toBe(targetDate);
  });
});
