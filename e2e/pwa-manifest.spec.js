import { test, expect } from '@playwright/test';

test.describe('PWA manifest', () => {
  test('manifest link resolves and every manifest icon is fetchable', async ({ page }) => {
    await page.goto('/');

    // index.html の manifest リンク先を取得する
    const manifestHref = await page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]');
      return link ? link.getAttribute('href') : null;
    });
    expect(manifestHref).not.toBeNull();

    // manifest を取得し、アイコンsrcを「manifestのURL」を基準に解決して存在確認する
    const manifest = await page.evaluate(async (href) => {
      const res = await fetch(href);
      return { ok: res.ok, url: res.url, body: await res.json() };
    }, manifestHref);
    expect(manifest.ok).toBe(true);
    expect(Array.isArray(manifest.body.icons)).toBe(true);
    expect(manifest.body.icons.length).toBeGreaterThan(0);

    for (const icon of manifest.body.icons) {
      const iconUrl = new URL(icon.src, manifest.url).toString();
      const status = await page.evaluate(async (u) => (await fetch(u)).status, iconUrl);
      expect(status, `${icon.src} should resolve to ${iconUrl}`).toBe(200);
    }
  });
});
