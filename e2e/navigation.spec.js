import { test, expect } from '@playwright/test';

test.describe('Week Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);
  });

  test('initial week title contains current year', async ({ page }) => {
    const year = new Date().getFullYear().toString();
    await expect(page.locator('#week-title')).toContainText(year);
  });

  test('next week button advances week', async ({ page }) => {
    const before = await page.locator('#week-title').textContent();
    await page.click('#next-week');
    await page.waitForTimeout(300);
    const after = await page.locator('#week-title').textContent();
    expect(before).not.toBe(after);
  });

  test('prev week button goes back', async ({ page }) => {
    const before = await page.locator('#week-title').textContent();
    await page.click('#prev-week');
    await page.waitForTimeout(300);
    const after = await page.locator('#week-title').textContent();
    expect(before).not.toBe(after);
  });

  test('today button returns to current week', async ({ page }) => {
    const original = await page.locator('#week-title').textContent();
    await page.click('#next-week');
    await page.waitForTimeout(300);
    await page.click('#next-week');
    await page.waitForTimeout(300);

    await page.click('#today');
    await page.waitForTimeout(300);
    const current = await page.locator('#week-title').textContent();
    expect(current).toBe(original);
  });

  test('navigation round-trip preserves week', async ({ page }) => {
    const original = await page.locator('#week-title').textContent();
    await page.click('#next-week');
    await page.waitForTimeout(300);
    await page.click('#prev-week');
    await page.waitForTimeout(300);
    const back = await page.locator('#week-title').textContent();
    expect(back).toBe(original);
  });

  test('date picker shows current week date', async ({ page }) => {
    const value = await page.locator('#date-picker').inputValue();
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
