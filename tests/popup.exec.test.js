const fs = require('fs');
const path = require('path');

beforeEach(() => {
  // Ensure a minimal DOM expected by popup.js
  document.body.innerHTML = `
      <div>
      <span id="totalTabs"></span>
      <span id="duplicateTabs"></span>
      <div id="tabsList"></div>
      <aside class="side-menu">
        <div class="actions">
          <button id="listAllTabs"></button>
          <button id="listDuplicateTabs"></button>
        </div>
        <div class="side-menu-footer">
          <button id="toggleSideMenu"></button>
        </div>
      </aside>
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

test('toggleSideMenu toggles class and persists', () => {
  // start with no persisted state
  localStorage.removeItem('sideMenuExpanded');

  // Mock minimal chrome API expected by init
  global.chrome = {
    tabs: { query: () => Promise.resolve([]) },
    windows: { update: () => Promise.resolve() },
    runtime: { sendMessage: () => Promise.resolve() }
  };

  const popup = require('../popup.js');

  // Ensure side menu exists
  const sideMenu = document.querySelector('.side-menu');
  expect(sideMenu).toBeTruthy();

  // Toggle once -> expanded
  popup.toggleSideMenu();
  expect(sideMenu.classList.contains('expanded')).toBe(true);
  expect(localStorage.getItem('sideMenuExpanded')).toBe('1');

  // Toggle again -> collapsed
  popup.toggleSideMenu();
  expect(sideMenu.classList.contains('expanded')).toBe(false);
  expect(localStorage.getItem('sideMenuExpanded')).toBe('0');
});
