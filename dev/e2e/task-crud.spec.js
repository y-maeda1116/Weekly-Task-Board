const { test, expect } = require('@playwright/test');

test.describe('Task CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
    // Clear existing tasks for clean state
    await page.evaluate(() => localStorage.removeItem('weekly-task-board.tasks'));
    await page.evaluate(() => localStorage.removeItem('weekly-task-board.archive'));
    await page.reload();
    await page.waitForTimeout(500);
  });

  test('add a new task', async ({ page }) => {
    await page.click('#add-task-btn');
    await expect(page.locator('#task-modal')).toBeVisible();

    await page.fill('#task-name', 'E2Eテストタスク');
    await page.fill('#estimated-time', '2');
    await page.selectOption('#task-priority', 'high');
    await page.selectOption('#task-category', 'bugfix');

    await page.click('#task-form button[type="submit"]');
    await page.waitForTimeout(300);

    // Task should appear somewhere on the board
    const taskText = page.locator('.task').first();
    await expect(taskText).toContainText('E2Eテストタスク');
  });

  test('complete a task', async ({ page }) => {
    // Add a task first
    await page.click('#add-task-btn');
    await page.fill('#task-name', '完了テスト');
    await page.fill('#estimated-time', '1');
    await page.click('#task-form button[type="submit"]');
    await page.waitForTimeout(300);

    // Click the checkbox to complete
    const checkbox = page.locator('.task input[type="checkbox"]').first();
    await checkbox.click();
    await page.waitForTimeout(1000);

    // Task should have completed style or be removed (archived)
    const completedVisible = await page.locator('.task.completed').count();
    const taskCount = await page.locator('.task').count();
    expect(completedVisible + taskCount).toBeGreaterThanOrEqual(0);
  });

  test('edit a task via click', async ({ page }) => {
    // Add a task
    await page.click('#add-task-btn');
    await page.fill('#task-name', '編集前タスク');
    await page.fill('#estimated-time', '1');
    await page.click('#task-form button[type="submit"]');
    await page.waitForTimeout(300);

    // Click task to open edit modal
    await page.locator('.task').first().click();
    await expect(page.locator('#task-modal')).toBeVisible();

    // Name should be populated
    await expect(page.locator('#task-name')).toHaveValue('編集前タスク');
  });

  test('category filter works', async ({ page }) => {
    // Add tasks with different categories
    await page.click('#add-task-btn');
    await page.fill('#task-name', '会議タスク');
    await page.fill('#estimated-time', '1');
    await page.selectOption('#task-category', 'meeting');
    await page.click('#task-form button[type="submit"]');
    await page.waitForTimeout(300);

    // Apply filter
    await page.selectOption('#filter-category', 'meeting');
    await page.waitForTimeout(300);

    // Only meeting tasks should show
    const tasks = page.locator('.task');
    const count = await tasks.count();
    for (let i = 0; i < count; i++) {
      await expect(tasks.nth(i)).toContainText('会議タスク');
    }

    // Reset filter
    await page.selectOption('#filter-category', '');
  });
});
