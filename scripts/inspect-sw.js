const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const extensionPath = path.resolve(__dirname, '..');
  const userDataDir = path.join(__dirname, '.tmp-profile-inspect');
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  });

  let extensionId = null;
  for (let i = 0; i < 50; i++) {
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

  // open a few pages to trigger tab events
  const p1 = await context.newPage(); await p1.goto('https://example.com');
  const p2 = await context.newPage(); await p2.goto('https://example.com');
  const p3 = await context.newPage(); await p3.goto('https://example.org');

  // wait a moment
  await new Promise(r => setTimeout(r, 1500));

  const workers = context.serviceWorkers();
  let found = false;
  const out = { extensionId, attempts: [], timestamp: Date.now(), sw: null, storage: null, badge: null };
  const writeOut = () => {
    try {
      const p = require('path').join(__dirname, '..', 'tmp');
      require('fs').mkdirSync(p, { recursive: true });
      require('fs').writeFileSync(require('path').join(p, 'sw_inspect.json'), JSON.stringify(out, null, 2));
    } catch (e) {}
  };

  for (const w of workers) {
    const url = w.url();
    if (url.startsWith(`chrome-extension://${extensionId}/`)) {
      found = true;
      try {
        // Ask the SW to refresh its internal state via runtime message
        try {
          await w.evaluate(() => new Promise(res => {
            try { chrome.runtime.sendMessage({ action: 'refresh' }, (r) => res(r)); }
            catch (e) { res(null); }
          }));
          // give it time to rebuild state
          await new Promise(r => setTimeout(r, 800));
        } catch (e) { console.log('error sending refresh message', e && e.message); }

        // Try multiple ways to observe SW state
        let state = null;
        try { state = await w.evaluate(() => (typeof getDuplicateInfo === 'function' ? getDuplicateInfo() : null)); } catch (e) {}
        if (!state) {
          try { state = await w.evaluate(() => (self.__TEST_HELPERS__ ? self.__TEST_HELPERS__.getState() : null)); } catch (e) {}
        }
        // Also try reading from chrome.storage.local
        let stored = null;
        try {
          stored = await w.evaluate(() => new Promise(res => {
            try { chrome.storage.local.get(['duplicateCount','urlCounts'], (v) => res(v)); }
            catch (e) { res(null); }
          }));
        } catch (e) {}
        out.sw = state;
        out.storage = stored;
        out.attempts.push({ when: Date.now(), stateFound: !!state, storageFound: !!stored });
        writeOut();
      } catch (e) {
        out.attempts.push({ when: Date.now(), error: String(e && e.message) });
        writeOut();
      }

      try {
        const badgeText = await w.evaluate(() => new Promise((res) => {
          try { chrome.action.getBadgeText({}, (t) => res(t)); }
          catch (e) { res(null); }
        }));
        out.badge = badgeText;
        writeOut();
      } catch (e) {
        out.attempts.push({ when: Date.now(), badgeError: String(e && e.message) });
        writeOut();
      }
      break;
    }
  }
  if (!found) {
    out.note = 'No extension worker matched';
    writeOut();
    console.error('No extension worker matched');
  }

  await context.close();
  writeOut();
  process.exit(0);
})();
