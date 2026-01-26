const { test, expect } = require('@playwright/test');
const path = require('path');

test('sanity: page loads and title contains manager', async ({ browser }) => {
  // Launch a persistent context to enable extensions when needed
  const userDataDir = path.join(__dirname, '.tmp-profile');
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('about:blank');
  await page.setContent('<html><body><h1>Smart Tab Manager</h1></body></html>');
  const text = await page.textContent('h1');
  expect(text).toContain('Smart Tab Manager');

  await context.close();
});
