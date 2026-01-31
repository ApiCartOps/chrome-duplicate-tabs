const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Responsive layout', () => {
  const popupPath = 'file://' + path.resolve(__dirname, '..', '..', 'popup.html');

  test('small viewport -> vertical layout (side menu on top)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 700 });
    await page.goto(popupPath);
    const container = page.locator('.container');
    // small screens should be column (flex-direction: column)
    await expect(container).toHaveCSS('flex-direction', 'column');
  });

  test('large viewport -> two-column layout (side menu left)', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto(popupPath);
    const container = page.locator('.container');
    // large screens should be row (flex-direction: row)
    await expect(container).toHaveCSS('flex-direction', 'row');
  });
});
