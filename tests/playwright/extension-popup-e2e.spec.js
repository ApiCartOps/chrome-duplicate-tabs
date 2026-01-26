const { test, expect, chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test('load extension and open real popup', async () => {
  const extensionPath = path.resolve(__dirname, '..', '..');
  const userDataDir = path.join(__dirname, '.tmp-profile-ext');

  // Clean previous profile
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  });

  // Wait for service worker belonging to the extension to appear
  let extensionId = null;
  for (let i = 0; i < 50; i++) {
    const workers = context.serviceWorkers();
    for (const w of workers) {
      const url = w.url();
      const m = url.match(/^chrome-extension:\/\/([a-p0-9]{32})\//i);
      if (m) {
        extensionId = m[1];
        break;
      }
    }
    if (extensionId) break;
    await new Promise(r => setTimeout(r, 200));
  }

  expect(extensionId, 'extension id discovered').toBeTruthy();

  const popupUrl = `chrome-extension://${extensionId}/popup.html`;
  const page = await context.newPage();
  await page.goto(popupUrl);

  // Basic checks: totalTabs and duplicateTabs elements exist
  await expect(page.locator('#totalTabs')).toBeVisible();
  await expect(page.locator('#duplicateTabs')).toBeVisible();

  await context.close();
});
