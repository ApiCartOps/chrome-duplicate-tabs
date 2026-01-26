const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function main() {
  const root = path.resolve(__dirname, '..');
  const popupHtml = fs.readFileSync(path.join(root, 'popup.html'), 'utf8');
  const utilsJs = fs.readFileSync(path.join(root, 'utils.js'), 'utf8');
  const popupJs = fs.readFileSync(path.join(root, 'popup.js'), 'utf8');

  // Sample tabs: 3 tabs, two duplicates on https://example.com
  const sampleTabs = [
    { id: 1, windowId: 1, title: 'Example A', url: 'https://example.com', favIconUrl: '', status: 'complete' },
    { id: 2, windowId: 1, title: 'Example B', url: 'https://example.com', favIconUrl: '', status: 'complete' },
    { id: 3, windowId: 1, title: 'Other', url: 'https://other.test', favIconUrl: '', status: 'complete' }
  ];

  // Inject a mocked exec that the popup script expects
  const mockExec = `
    window.exec = {
      tabs: {
        query: (q) => Promise.resolve(${JSON.stringify(sampleTabs)}),
        remove: (ids) => Promise.resolve(ids),
        update: (id, opts) => Promise.resolve(Object.assign({id}, opts)),
        group: (opts) => Promise.resolve(123)
      },
      windows: { update: () => Promise.resolve() },
      runtime: { sendMessage: () => Promise.resolve() },
      tabGroups: { update: () => Promise.resolve() }
    };
  `;

  // Build an HTML page by inlining scripts so Playwright can load from memory
  const inlined = popupHtml
    .replace('<script src="utils.js"></script>', `<script>${utilsJs}</script>`)
    .replace('<script src="popup.js"></script>', `<script>${mockExec}\n${popupJs}</script>`);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('[PAGE]', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('[PAGE ERROR]', err.message));

  await page.setContent(inlined, { waitUntil: 'domcontentloaded' });

  // Wait a bit for scripts to run
  await page.waitForTimeout(500);

  // Dump some debug info
  const total = await page.$eval('#totalTabs', el => el.textContent);
  const duplicate = await page.$eval('#duplicateTabs', el => el.textContent);
  const listHtml = await page.$eval('#tabsList', el => el.innerHTML);

  console.log('=== DEBUG OUTPUT ===');
  console.log('totalTabs:', total);
  console.log('duplicateTabs:', duplicate);
  console.log('tabsList HTML length:', listHtml.length);
  // write snapshot
  fs.writeFileSync(path.join(root, 'tmp', 'popup_dom_snapshot.html'), listHtml);
  console.log('Wrote tmp/popup_dom_snapshot.html');

  // Interact: click list buttons to simulate the test flow
  try {
    await page.click('#listAllTabs');
    await page.waitForTimeout(200);
    const afterAllCount = await page.$$eval('#tabsList .tab-item', els => els.length);
    console.log('After listAllTabs, .tab-item count =', afterAllCount);

    await page.click('#listAllTabs');
    await page.waitForTimeout(200);
    const afterCollapse = await page.$$eval('#tabsList .tab-item', els => els.length);
    console.log('After collapsing again, .tab-item count =', afterCollapse);

    await page.click('#listDuplicateTabs');
    await page.waitForTimeout(200);
    const dupCount = await page.$$eval('#tabsList .tab-item', els => els.length);
    console.log('After listDuplicateTabs, .tab-item count =', dupCount);
  } catch (e) {
    console.log('Interaction error:', e.message);
  }

  await page.screenshot({ path: path.join(root, 'tmp', 'popup_debug.png') });
  console.log('Wrote tmp/popup_debug.png');

  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
