import { test, expect } from '@playwright/test';

test.describe('Panels', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
  });

  test('statistics panel opens and closes', async ({ page }) => {
    await page.click('#statistics-toggle');
    await page.waitForTimeout(300);
    await expect(page.locator('#dashboard-panel')).toBeVisible();
    await page.click('#close-dashboard');
    await page.waitForTimeout(300);
    await expect(page.locator('#dashboard-panel')).not.toBeVisible();
  });

  test('template panel opens and closes', async ({ page }) => {
    await page.click('#template-toggle');
    await page.waitForTimeout(300);
    await expect(page.locator('#template-panel')).toBeVisible();
    await page.click('#close-template-panel');
    await page.waitForTimeout(300);
    await expect(page.locator('#template-panel')).not.toBeVisible();
  });

  test('journal panel opens and closes', async ({ page }) => {
    await page.click('#journal-toggle');
    await page.waitForTimeout(300);
    await expect(page.locator('#journal-timeline-panel')).toBeVisible();
    await page.click('#close-journal-timeline');
    await page.waitForTimeout(300);
    await expect(page.locator('#journal-timeline-panel')).not.toBeVisible();
  });

  test('review panel opens and closes', async ({ page }) => {
    await page.click('#review-toggle');
    await page.waitForTimeout(300);
    await expect(page.locator('#review-panel')).toBeVisible();
    await page.click('#close-review');
    await page.waitForTimeout(300);
    await expect(page.locator('#review-panel')).not.toBeVisible();
  });

  test('more menu opens and closes', async ({ page }) => {
    await page.click('#more-menu-btn');
    await page.waitForTimeout(200);
    await expect(page.locator('#more-menu-dropdown')).toBeVisible();

    // Click elsewhere to close
    await page.click('h1');
    await page.waitForTimeout(200);
    await expect(page.locator('#more-menu-dropdown')).not.toBeVisible();
  });

  test('archive view opens from more menu', async ({ page }) => {
    await page.click('#more-menu-btn');
    await page.waitForTimeout(200);
    await page.click('#archive-toggle');
    await page.waitForTimeout(300);
    await expect(page.locator('#archive-view')).toBeVisible();
    await page.click('#close-archive');
    await page.waitForTimeout(300);
    await expect(page.locator('#archive-view')).not.toBeVisible();
  });

  test.skip('signifier help modal opens (no click handler wired)', async ({ page }) => {
    await page.click('#more-menu-btn');
    await page.waitForTimeout(200);
    await page.click('#signifier-help-btn');
    await page.waitForTimeout(300);
    await expect(page.locator('#signifier-help-modal')).toBeVisible({ visible: true });
    await page.click('#close-signifier-help');
    await page.waitForTimeout(300);
    const display = await page.locator('#signifier-help-modal').evaluate(el => el.style.display);
    expect(display).toBe('none');
  });

  test('weekday settings toggle', async ({ page }) => {
    await page.click('#weekday-filter-btn');
    await page.waitForTimeout(200);
    await expect(page.locator('#weekday-settings')).toBeVisible();
    await page.click('#weekday-filter-btn');
    await page.waitForTimeout(200);
    await expect(page.locator('#weekday-settings')).not.toBeVisible();
  });
});
