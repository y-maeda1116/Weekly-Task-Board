import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads without JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.reload();
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });

  test('app version is displayed in console', async ({ page }) => {
    const logs = [];
    page.on('console', (msg) => {
      if (msg.text().includes('ウィークリータスクボード')) logs.push(msg.text());
    });
    await page.reload();
    await page.waitForTimeout(500);
    expect(logs.length).toBeGreaterThan(0);
  });

  test('header is visible', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('ウィークリータスクボード');
  });

  test('week title is displayed', async ({ page }) => {
    await expect(page.locator('#week-title')).not.toBeEmpty();
  });

  test('all 7 day columns are rendered', async ({ page }) => {
    const columns = page.locator('#task-board .day-column');
    await expect(columns).toHaveCount(7);
  });

  test('unassigned sidebar exists', async ({ page }) => {
    await expect(page.locator('#unassigned-tasks')).toBeVisible();
  });

  test('theme toggle switches to dark mode', async ({ page }) => {
    const html = page.locator('html');
    await page.click('#theme-toggle');
    await expect(html).toHaveAttribute('data-theme', 'dark');
  });

  test('theme toggle switches back to light mode', async ({ page }) => {
    const html = page.locator('html');
    await page.click('#theme-toggle');
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await page.click('#theme-toggle');
    await expect(html).toHaveAttribute('data-theme', 'light');
  });

  test('theme persists after reload', async ({ page }) => {
    await page.click('#theme-toggle');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await page.waitForTimeout(500);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    // cleanup
    await page.click('#theme-toggle');
  });

  test('task modal opens and closes', async ({ page }) => {
    await page.click('#add-task-btn');
    await expect(page.locator('#task-modal')).toBeVisible();
    await expect(page.locator('#task-modal')).toHaveClass(/show/);
    await page.locator('#task-modal .close-btn').click();
    await expect(page.locator('#task-modal')).not.toBeVisible();
  });

  test('migration modal opens and closes', async ({ page }) => {
    await page.click('#migration-toggle');
    await expect(page.locator('#migration-modal')).toBeVisible();
    await expect(page.locator('#migration-modal')).toHaveClass(/show/);
    await page.locator('#migration-modal .close-btn').click();
    await page.waitForTimeout(400);
    await expect(page.locator('#migration-modal')).not.toBeVisible();
  });

  test('no console errors from process.env or TDZ', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.reload();
    await page.waitForTimeout(1000);
    const critical = errors.filter(
      (e) => e.includes('process') || e.includes('TDZ') || e.includes('before initialization')
    );
    expect(critical).toEqual([]);
  });
});
