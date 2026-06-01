import { test, expect } from '@playwright/test';

test.describe('Task Migration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
  });

  test('migration modal opens with .show class', async ({ page }) => {
    await page.click('#migration-toggle');
    await page.waitForTimeout(300);
    await expect(page.locator('#migration-modal')).toBeVisible();
    await expect(page.locator('#migration-modal')).toHaveClass(/show/);
  });

  test('migration modal closes properly', async ({ page }) => {
    await page.click('#migration-toggle');
    await page.waitForTimeout(300);
    await expect(page.locator('#migration-modal')).toBeVisible();

    await page.locator('#migration-modal .close-btn').click();
    await page.waitForTimeout(400);
    await expect(page.locator('#migration-modal')).not.toBeVisible();
  });

  test('migration modal shows message when no tasks', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('weekly-task-board.tasks'));
    await page.reload();
    await page.waitForTimeout(500);

    await page.click('#migration-toggle');
    await page.waitForTimeout(300);

    const content = page.locator('#migration-task-list');
    await expect(content).toContainText('移行対象の未完了タスクはありません');
  });

  test('migration modal shows unassigned tasks', async ({ page }) => {
    // Create an unassigned incomplete task
    await page.evaluate(() => {
      const tasks = [{
        id: 'task-migration-test-1',
        name: '移行テストタスク',
        estimated_time: 2,
        actual_time: 0,
        priority: 'medium',
        category: 'task',
        assigned_date: null,
        date: null,
        completed: false,
        details: '',
        is_recurring: false,
        recurrence_pattern: null,
        recurrence_end_date: null,
        signifier: null,
        created_at: new Date().toISOString()
      }];
      localStorage.setItem('weekly-task-board.tasks', JSON.stringify(tasks));
    });
    await page.reload();
    await page.waitForTimeout(500);

    await page.click('#migration-toggle');
    await page.waitForTimeout(300);

    await expect(page.locator('#migration-task-list')).toContainText('移行テストタスク');
  });

  test('migrate to next week', async ({ page }) => {
    await page.evaluate(() => {
      const tasks = [{
        id: 'task-migrate-next-1',
        name: '次週移行テスト',
        estimated_time: 1,
        actual_time: 0,
        priority: 'medium',
        category: 'task',
        assigned_date: null,
        date: null,
        completed: false,
        details: '',
        is_recurring: false,
        recurrence_pattern: null,
        recurrence_end_date: null,
        signifier: null,
        created_at: new Date().toISOString()
      }];
      localStorage.setItem('weekly-task-board.tasks', JSON.stringify(tasks));
    });
    await page.reload();
    await page.waitForTimeout(500);

    await page.click('#migration-toggle');
    await page.waitForTimeout(300);

    await expect(page.locator('#migration-task-list')).toContainText('次週移行テスト');

    await page.click('#migrate-next-week-btn');
    await page.waitForTimeout(500);

    // Modal should close
    await expect(page.locator('#migration-modal')).not.toBeVisible();

    // Verify task was migrated in localStorage
    const tasks = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('weekly-task-board.tasks') || '[]');
    });
    // Should have original (completed with >) + new copy
    expect(tasks.length).toBeGreaterThanOrEqual(2);
    const completed = tasks.find(t => t.name.includes('>'));
    expect(completed).toBeTruthy();
    expect(completed.completed).toBe(true);
  });

  test('migrate to unassigned', async ({ page }) => {
    await page.evaluate(() => {
      const tasks = [{
        id: 'task-migrate-unassigned-1',
        name: '未割り当て移行テスト',
        estimated_time: 1,
        actual_time: 0,
        priority: 'low',
        category: 'task',
        assigned_date: null,
        date: null,
        completed: false,
        details: '',
        is_recurring: false,
        recurrence_pattern: null,
        recurrence_end_date: null,
        signifier: null,
        created_at: new Date().toISOString()
      }];
      localStorage.setItem('weekly-task-board.tasks', JSON.stringify(tasks));
    });
    await page.reload();
    await page.waitForTimeout(500);

    await page.click('#migration-toggle');
    await page.waitForTimeout(300);

    await page.click('#migrate-unassigned-btn');
    await page.waitForTimeout(500);

    await expect(page.locator('#migration-modal')).not.toBeVisible();

    const tasks = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('weekly-task-board.tasks') || '[]');
    });
    const newTask = tasks.find(t => !t.completed && t.name === '未割り当て移行テスト');
    expect(newTask).toBeTruthy();
    expect(newTask.assigned_date).toBeNull();
  });
});
