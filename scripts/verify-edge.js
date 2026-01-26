const { chromium } = require('playwright');
const path = require('path');

function fileUrl(p) {
  return 'file://' + path.resolve(p).replace(/\\/g, '/');
}

(async () => {
  console.log('Launching Edge (msedge) to verify popup interactions...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext();

  // Provide fake chrome API and avoid modal dialogs
  await context.addInitScript(() => {
    const tabs = [
      { id: 101, url: 'https://example.com', title: 'Example' },
      { id: 102, url: 'https://example.com', title: 'Example (copy)' },
      { id: 103, url: 'https://other.com', title: 'Other' }
    ];

    window.__TEST_API__ = { removed: null, grouped: null };

    window.chrome = {
      tabs: {
        query: () => Promise.resolve(tabs),
        remove: (ids) => { window.__TEST_API__.removed = ids; return Promise.resolve(); },
        update: (id, opts) => Promise.resolve(),
        group: ({ tabIds }) => { window.__TEST_API__.grouped = tabIds; return Promise.resolve(999); }
      },
      windows: { update: () => Promise.resolve() },
      tabGroups: { update: () => Promise.resolve() },
      storage: { local: { set: () => {} }, onChanged: { addListener: () => {}, removeListener: () => {} } },
      runtime: { sendMessage: () => Promise.resolve({}) }
    };

    window.alert = () => {};
    window.confirm = () => true;
  });

  const page = await context.newPage();
  const url = fileUrl(path.join(__dirname, '..', 'popup.html'));
  await page.goto(url);

  // List all tabs
  await page.click('#listAllTabs');
  const allCount = await page.locator('#tabsList .tab-item').count();
  console.log('All tabs listed:', allCount);

  // Close duplicates
  await page.click('#closeDuplicateTabs');
  const removed = await page.evaluate(() => window.__TEST_API__.removed);
  console.log('Removed duplicates:', removed);

  // Group by domain
  await page.click('#groupTabsByDomain');
  const grouped = await page.evaluate(() => window.__TEST_API__.grouped);
  console.log('Grouped tab ids:', grouped);

  await browser.close();
  console.log('Done.');
})();
