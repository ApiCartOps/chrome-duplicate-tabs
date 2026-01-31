const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const extensionPath = path.resolve(__dirname, '..');
  const userDataDir = path.join(__dirname, '.tmp-profile-popup');
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  });

  // find extension id
  let extensionId = null;
  for (let i = 0; i < 80; i++) {
    const workers = context.serviceWorkers();
    for (const w of workers) {
      const url = w.url();
      const m = url.match(/^chrome-extension:\/\/([a-p0-9]{32})\//i);
      if (m) { extensionId = m[1]; break; }
    }
    if (extensionId) break;
    await new Promise(r => setTimeout(r, 200));
  }

  if (!extensionId) {
    console.error('Extension service worker not found');
    await context.close();
    process.exit(2);
  }

  console.log('extensionId', extensionId);
  const popupUrl = `chrome-extension://${extensionId}/popup.html`;

  const page = await context.newPage();
  try {
    await page.goto(popupUrl, { waitUntil: 'load', timeout: 15000 });
  } catch (e) {
    console.warn('popup load warning:', e && e.message);
  }

  // allow rendering
  await page.waitForTimeout(800);

  const outDir = path.join(__dirname, '..', 'tmp');
  fs.mkdirSync(outDir, { recursive: true });
  const screenshotPath = path.join(outDir, 'popup_screenshot.png');
  const domPath = path.join(outDir, 'popup_dom_snapshot.html');

  await page.screenshot({ path: screenshotPath, fullPage: true });
  const html = await page.content();
  fs.writeFileSync(domPath, html, 'utf8');

  console.log('Wrote', screenshotPath);
  console.log('Wrote', domPath);

  await context.close();
})();
