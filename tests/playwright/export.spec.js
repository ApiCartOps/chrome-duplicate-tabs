const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs').promises;

function fileUrl(p) {
  return 'file://' + path.resolve(p).replace(/\\/g, '/');
}

const tabs = [
  { id: 1, url: 'https://example.com', title: 'Example', windowId: 1 },
  { id: 2, url: 'https://example.com', title: 'Example Copy', windowId: 1 },
  { id: 3, url: 'https://other.com', title: 'Other', windowId: 1 }
];

test.describe('export list downloads', () => {
  test('exports CSV file', async ({ browser }) => {
    const context = await browser.newContext({ acceptDownloads: true });

    await context.addInitScript(() => {
      const tabs = [
        { id: 1, url: 'https://example.com', title: 'Example', windowId: 1 },
        { id: 2, url: 'https://example.com', title: 'Example Copy', windowId: 1 },
        { id: 3, url: 'https://other.com', title: 'Other', windowId: 1 }
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

    // Ensure CSV selected
    await page.check('#exportCsv');
    await page.uncheck('#exportJson');
    await page.check('#exportScopeAll');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#exportListBtn')
    ]);

    const pathDownloaded = await download.path();
    const content = await fs.readFile(pathDownloaded, 'utf8');

    // CSV should have header + 3 rows and include favIconUrl and status in header
    const lines = content.trim().split(/\r?\n/);
    expect(lines[0]).toContain('id,title,url,windowId,favIconUrl,status');
    expect(lines.length).toBe(4);

    await context.close();
  });

  test('exports JSON file', async ({ browser }) => {
    const context = await browser.newContext({ acceptDownloads: true });

    await context.addInitScript(() => {
      const tabs = [
        { id: 1, url: 'https://example.com', title: 'Example', windowId: 1 },
        { id: 2, url: 'https://example.com', title: 'Example Copy', windowId: 1 },
        { id: 3, url: 'https://other.com', title: 'Other', windowId: 1 }
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

    // Select JSON
    await page.uncheck('#exportCsv');
    await page.check('#exportJson');
    await page.check('#exportScopeAll');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#exportListBtn')
    ]);

    const pathDownloaded = await download.path();
    const content = await fs.readFile(pathDownloaded, 'utf8');

    const parsed = JSON.parse(content);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(3);
    // JSON objects should include the extra fields (may be empty)
    expect(parsed[0]).toHaveProperty('favIconUrl');
    expect(parsed[0]).toHaveProperty('status');

    await context.close();
  });
});
