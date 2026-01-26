const fs = require('fs');
const path = require('path');

beforeEach(() => {
  // Ensure a minimal DOM expected by popup.js
  document.body.innerHTML = `
      <div>
      <span id="totalTabs"></span>
      <span id="duplicateTabs"></span>
      <div id="tabsList"></div>
      <button id="listAllTabs"></button>
      <button id="listDuplicateTabs"></button>
      <button id="exportListBtn"></button>
      <input type="checkbox" id="exportCsv" checked />
      <input type="checkbox" id="exportJson" />
      <input type="radio" name="exportScope" id="exportScopeAll" value="all" checked />
      <input type="radio" name="exportScope" id="exportScopeDuplicates" value="duplicates" />
      <button id="closeDuplicateTabs"></button>
      <button id="groupTabsByDomain"></button>
      <button id="closeTabsExceptActive"></button>
    </div>
  `;

  // Clear cached module so tests can set different globals and re-require
  jest.resetModules();
});

test('exec handles promise-returning chrome.tabs.query', async () => {
  const tabs = [{ id: 1, url: 'https://a' }];

  global.chrome = {
    tabs: {
      query: () => Promise.resolve(tabs)
    },
    windows: { update: () => Promise.resolve() },
    runtime: { sendMessage: () => Promise.resolve() }
  };

  const popup = require('../popup.js');
  const res = await popup.exec.tabs.query({});
  expect(res).toBe(tabs);
});

test('exec handles callback-style chrome.tabs.query', async () => {
  const tabs = [{ id: 2, url: 'https://b' }];

  global.chrome = {
    tabs: {
      query: (q, cb) => cb(tabs)
    },
    windows: { update: () => {} },
    runtime: { sendMessage: () => {} }
  };

  const popup = require('../popup.js');
  const res = await popup.exec.tabs.query({});
  expect(res).toBe(tabs);
});
