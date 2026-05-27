const { test, expect } = require('@playwright/test');

test('debug task creation', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors = [];
  const consoleLogs = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
    if (msg.type() === 'log') consoleLogs.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  await page.goto('/');
  await page.waitForTimeout(1500);

  // Open modal
  await page.click('#add-task-btn');
  await page.waitForTimeout(200);
  const modalVisible = await page.locator('#task-modal').isVisible();
  console.log('Modal visible:', modalVisible);

  // Fill form
  await page.fill('#task-name', 'Test');
  await page.fill('#estimated-time', '1');
  await page.click('#task-form button[type="submit"]');
  await page.waitForTimeout(500);

  // Check result
  const taskCount = await page.locator('.task').count();
  console.log('Task count:', taskCount);

  // Check localStorage
  const stored = await page.evaluate(() => localStorage.getItem('weekly-task-board.tasks'));
  console.log('Stored tasks:', stored ? stored.substring(0, 200) : 'null');

  console.log('\n=== Console Errors ===');
  consoleErrors.forEach(e => console.log(e));
  console.log('\n=== Console Logs (first 20) ===');
  consoleLogs.slice(0, 20).forEach(l => console.log(l));

  await context.close();
});
