const { test, expect } = require('@playwright/test');
const path = require('path');

function fileUrl(p) {
  return 'file://' + path.resolve(p).replace(/\\/g, '/');
}

test.describe('Popup UI', () => {
  test('displays totals and lists tabs with duplicates', async ({ browser }) => {
    const context = await browser.newContext();

    // Provide a fake chrome API before any scripts run
    await context.addInitScript(() => {
      const tabs = [
        { id: 1, url: 'https://example.com', title: 'Example' },
        { id: 2, url: 'https://example.com', title: 'Example (copy)' },
        { id: 3, url: 'https://other.com', title: 'Other' }
      ];

      window.__TEST_API__ = { removed: null, grouped: null };

      window.chrome = {
        tabs: {
          query: (q) => Promise.resolve(tabs),
          remove: (ids) => { window.__TEST_API__.removed = ids; return Promise.resolve(); },
          update: (id, opts) => Promise.resolve(),
          group: ({ tabIds }) => { window.__TEST_API__.grouped = tabIds; return Promise.resolve(123); }
        },
        windows: { update: () => Promise.resolve() },
        tabGroups: { update: () => Promise.resolve() },
        storage: { local: { set: () => {} }, onChanged: { addListener: () => {}, removeListener: () => {} } },
        runtime: { sendMessage: () => Promise.resolve({ duplicateCount: 1, duplicates: [{ url: 'https://example.com', count: 2 }] }) }
      };

      // Avoid modal dialogs blocking tests
      window.alert = () => {};
      window.confirm = () => true;
    });

    const page = await context.newPage();
    const url = fileUrl(path.join(__dirname, '..', '..', 'popup.html'));
    await page.goto(url);

    await expect(page.locator('#totalTabs')).toHaveText('3');
    await expect(page.locator('#duplicateTabs')).toHaveText('1');

    // Click list all tabs and verify list shows
    await page.click('#listAllTabs');
    await expect(page.locator('#tabsList .tab-item')).toHaveCount(3);
    // Both duplicate tabs are labeled, so expect 2 badges
    await expect(page.locator('.duplicate-badge')).toHaveCount(2);

    await context.close();
  });

  test('close duplicates calls chrome.tabs.remove', async ({ browser }) => {
    const context = await browser.newContext();

    await context.addInitScript(() => {
      const tabs = [
        { id: 10, url: 'https://a.com' },
        { id: 11, url: 'https://a.com' }
      ];

      window.__TEST_API__ = { removed: null };

      window.chrome = {
        tabs: {
          query: () => Promise.resolve(tabs),
          remove: (ids) => { window.__TEST_API__.removed = ids; return Promise.resolve(); }
        }
      };

      window.confirm = () => true;
      window.alert = () => {};
    });

    const page = await context.newPage();
    const url = fileUrl(path.join(__dirname, '..', '..', 'popup.html'));
    await page.goto(url);

    // Click close duplicates
    await page.click('#closeDuplicateTabs');

    // Check that chrome.tabs.remove was called with duplicate id(s)
    const removed = await page.evaluate(() => window.__TEST_API__.removed);
    expect(removed).toEqual([11]);

    await context.close();
  });

  test('group by domain calls chrome.tabs.group and tabGroups.update', async ({ browser }) => {
    const context = await browser.newContext();

    await context.addInitScript(() => {
      const tabs = [
        { id: 20, url: 'https://x.com' },
        { id: 21, url: 'https://x.com' },
        { id: 22, url: 'https://y.com' }
      ];

      window.__TEST_API__ = { grouped: null };

      window.chrome = {
        tabs: {
          query: () => Promise.resolve(tabs),
          group: ({ tabIds }) => { window.__TEST_API__.grouped = tabIds; return Promise.resolve(55); }
        },
        tabGroups: { update: () => Promise.resolve() }
      };

      window.alert = () => {};
    });

    const page = await context.newPage();
    const url = fileUrl(path.join(__dirname, '..', '..', 'popup.html'));
    await page.goto(url);

    await page.click('#groupTabsByDomain');

    const grouped = await page.evaluate(() => window.__TEST_API__.grouped);
    // Expect at least one grouping call containing the two x.com tabs
    expect(grouped).toEqual(expect.arrayContaining([20, 21]));

    await context.close();
  });
});
