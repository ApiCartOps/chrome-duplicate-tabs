const { test, expect } = require('@playwright/test');
const path = require('path');

const popupPath = 'file://' + path.resolve(__dirname, '..', '..', 'popup.html');

test('hamburger opens overlay on small screens and closes on ESC or backdrop click', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 700 });
  await page.goto(popupPath);

  const toggle = page.locator('#toggleSideMenu');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  // open overlay
  await toggle.click();
  const overlay = page.locator('#sideMenuOverlay');
  await expect(overlay).toBeVisible();
  // confirm the close button is visible indicating the overlay opened
  const closeBtn = page.locator('#closeOverlayBtn');
  await expect(closeBtn).toBeVisible();

  // press Escape closes
  await page.keyboard.press('Escape');
  await expect(overlay).toBeHidden();

  // open again and test backdrop click
  await toggle.click();
  await overlay.locator('.overlay-backdrop').click();
  await expect(overlay).toBeHidden();
});

test('keyboard interaction: Enter on close button closes overlay', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 700 });
  await page.goto(popupPath);
  const toggle = page.locator('#toggleSideMenu');
  await toggle.click();
  const closeBtn = page.locator('#closeOverlayBtn');
  await expect(closeBtn).toBeVisible();

  // hit Enter on close button should close overlay
  await closeBtn.press('Enter');
  await expect(page.locator('#sideMenuOverlay')).toBeHidden();
});
