const { test, expect } = require('@playwright/test');
const path = require('path');

function fileUrl(p) {
  return 'file://' + path.resolve(p).replace(/\\/g, '/');
}

test.describe('TabGroups feature detection', () => {
  test('disables Group button when tabGroups unsupported (simulated Firefox)', async ({ browser }) => {
    const context = await browser.newContext();

    await context.addInitScript(() => {
      // Simulate an environment where tabGroups is not available
      window.chrome = {
        tabs: {
          query: () => Promise.resolve([])
        },
        runtime: { sendMessage: () => Promise.resolve() }
        // no tabGroups property
      };
      window.alert = () => {};
    });

    const page = await context.newPage();
    const url = fileUrl(path.join(__dirname, '..', '..', 'popup.html'));
    await page.goto(url);

    await expect(page.locator('#groupTabsByDomain')).toBeDisabled();

    await context.close();
  });

  test('enables Group button when tabGroups supported', async ({ browser }) => {
    const context = await browser.newContext();

    await context.addInitScript(() => {
      // Simulate an environment where tabGroups is available
      window.chrome = {
        tabs: {
          query: () => Promise.resolve([])
        },
        tabGroups: {
          update: () => Promise.resolve()
        },
        runtime: { sendMessage: () => Promise.resolve() }
      };
      window.alert = () => {};
    });

    const page = await context.newPage();
    const url = fileUrl(path.join(__dirname, '..', '..', 'popup.html'));
    await page.goto(url);

    await expect(page.locator('#groupTabsByDomain')).toBeEnabled();

    await context.close();
  });
});
