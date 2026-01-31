const { test, expect } = require('@playwright/test');
const path = require('path');

test('side menu expands to show labels when toggled', async ({ page }) => {
  const popupPath = 'file://' + path.resolve(__dirname, '..', '..', 'popup.html');
  await page.goto(popupPath);

  // By default labels should be visually hidden (opacity 0)
  const listLabel = page.locator('#listAllTabs .btn-label');
  await expect(listLabel).toHaveCSS('opacity', '0');

  // Click footer toggle -> labels appear
  await page.click('#toggleSideMenu');
  await expect(listLabel).toHaveCSS('opacity', '1');
  await expect(page.locator('#toggleSideMenu')).toHaveAttribute('aria-expanded', 'true');

  // Collapse again -> labels hidden
  await page.click('#toggleSideMenu');
  await expect(listLabel).toHaveCSS('opacity', '0');
  await expect(page.locator('#toggleSideMenu')).toHaveAttribute('aria-expanded', 'false');
});
