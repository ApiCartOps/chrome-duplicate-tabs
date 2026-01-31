const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const extensionPath = path.resolve(__dirname, '..');
  const userDataDir = path.join(__dirname, '.tmp-profile-inspect-keep');
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  });

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
    // leave browser open for manual inspection
    console.log('Press Enter to close browser.');
    process.stdin.resume();
    process.stdin.on('data', async () => { await context.close(); process.exit(2); });
    return;
  }

  console.log('extensionId', extensionId);

  // open a few pages to trigger tab events
  const p1 = await context.newPage(); await p1.goto('https://example.com');
  const p2 = await context.newPage(); await p2.goto('https://example.com');
  const p3 = await context.newPage(); await p3.goto('https://example.org');

  // wait a bit for worker to process
  await new Promise(r => setTimeout(r, 2000));

  const workers = context.serviceWorkers();
  const out = { extensionId, timestamp: Date.now(), sw: null, storage: null, badge: null, attempts: [] };
  const outPath = path.join(__dirname, '..', 'tmp', 'sw_inspect.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  let matched = false;
  for (const w of workers) {
    const url = w.url();
    if (!url.startsWith(`chrome-extension://${extensionId}/`)) continue;
    matched = true;

    try {
      // ask the SW to refresh
      try {
        await w.evaluate(() => new Promise(res => {
          try { chrome.runtime.sendMessage({ action: 'refresh' }, (r) => res(r)); }
          catch (e) { res(null); }
        }));
        await new Promise(r => setTimeout(r, 800));
      } catch (e) { console.log('refresh send error', e && e.message); }

      // getDuplicateInfo()
      let state = null;
      try { state = await w.evaluate(() => (typeof getDuplicateInfo === 'function' ? getDuplicateInfo() : null)); } catch (e) {}
      if (!state) {
        try { state = await w.evaluate(() => (self.__TEST_HELPERS__ ? self.__TEST_HELPERS__.getState() : null)); } catch (e) {}
      }

      let stored = null;
      try {
        stored = await w.evaluate(() => new Promise(res => {
          try { chrome.storage.local.get(['duplicateCount','urlCounts'], (v) => res(v)); }
          catch (e) { res(null); }
        }));
      } catch (e) {}

      let badgeText = null;
      try {
        badgeText = await w.evaluate(() => new Promise(res => {
          try { chrome.action.getBadgeText({}, (t) => res(t)); }
          catch (e) { res(null); }
        }));
      } catch (e) {}

      out.sw = state;
      out.storage = stored;
      out.badge = badgeText;
      out.attempts.push({ when: Date.now(), stateFound: !!state, storageFound: !!stored, badgeFound: !!badgeText });

      fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
      console.log('Wrote', outPath);
    } catch (e) {
      out.attempts.push({ when: Date.now(), error: String(e && e.message) });
      fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
    }
  }

  if (!matched) {
    out.note = 'No extension worker matched';
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
    console.error('No extension worker matched');
  }

  const timeoutSec = parseInt(process.argv[2] || process.env.SW_INSPECT_TIMEOUT || '15', 10);
  console.log(`Inspector finished — browser will stay open for ${timeoutSec}s then close automatically.`);
  console.log('Inspect file path:', outPath);

  // Auto-close after timeoutSec seconds
  setTimeout(async () => {
    try { await context.close(); } catch (e) {}
    console.log('Inspector timeout reached; browser closed.');
    process.exit(0);
  }, timeoutSec * 1000);
})();
