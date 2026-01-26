const { test, expect } = require('@playwright/test');
const path = require('path');

function fileUrl(p) {
  return 'file://' + path.resolve(p).replace(/\\/g, '/');
}

test('toggle list buttons collapse when clicked again', async ({ browser }) => {
  const context = await browser.newContext();

  await context.addInitScript(() => {
    const tabs = [
      { id: 1, url: 'https://example.com', title: 'Example' },
      { id: 2, url: 'https://example.com', title: 'Example Copy' },
      { id: 3, url: 'https://other.com', title: 'Other' }
    ];

    window.chrome = {
      tabs: {
        query: () => Promise.resolve(tabs),
        update: () => Promise.resolve(),
        remove: () => Promise.resolve(),
        group: () => Promise.resolve()
      },
      windows: { update: () => Promise.resolve() },
      tabGroups: { update: () => Promise.resolve() },
      runtime: { sendMessage: () => Promise.resolve() }
    };

    window.alert = () => {};
    window.confirm = () => true;
  });

  const page = await context.newPage();
  const url = fileUrl(path.join(__dirname, '..', '..', 'popup.html'));
  await page.goto(url);

  // Click List All Tabs -> shows 3 items
  await page.click('#listAllTabs');
  await page.waitForSelector('#tabsList .tab-item');
  await expect(page.locator('#tabsList .tab-item')).toHaveCount(3);
  // Each item should have a close button
  await expect(page.locator('#tabsList .tab-item .btn-close')).toHaveCount(3);

  // Click again -> collapses
  await page.click('#listAllTabs');
  await expect(page.locator('#tabsList .tab-item')).toHaveCount(0);

  // Click List Duplicates -> shows grouped duplicates
  await page.click('#listDuplicateTabs');
  // One duplicate group
  await expect(page.locator('#tabsList .duplicate-group')).toHaveCount(1);
  // The group should contain two tab items (original + duplicate)
  await expect(page.locator('#tabsList .duplicate-group .tab-item')).toHaveCount(2);

  // Click again -> collapses
  await page.click('#listDuplicateTabs');
  await expect(page.locator('#tabsList .tab-item')).toHaveCount(0);

  await context.close();
});
