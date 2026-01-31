// Playwright configuration for jwd-browser-tab-manager
const { defineConfig } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: path.join(__dirname, 'tests', 'playwright'),
  timeout: 30_000,
  expect: { timeout: 5000 },
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 }
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'edge', use: { browserName: 'chromium', channel: 'msedge' } },
    { name: 'firefox', use: { browserName: 'firefox' } }
  ],
  reporter: [['list']]
});
