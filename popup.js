// DOM elements
const totalTabsElement = document.getElementById('totalTabs');
const duplicateTabsElement = document.getElementById('duplicateTabs');
const tabsListElement = document.getElementById('tabsList');
const listAllTabsBtn = document.getElementById('listAllTabs');
const listDuplicateTabsBtn = document.getElementById('listDuplicateTabs');
const closeDuplicateTabsBtn = document.getElementById('closeDuplicateTabs');
const groupTabsByDomainBtn = document.getElementById('groupTabsByDomain');
const closeTabsExceptActiveBtn = document.getElementById('closeTabsExceptActive');
const exportListBtn = document.getElementById('exportListBtn');
const toggleFullBtn = document.getElementById('toggleFullBtn');
const exportCsvCheckbox = document.getElementById('exportCsv');
const exportJsonCheckbox = document.getElementById('exportJson');
const exportScopeAllRadio = document.getElementById('exportScopeAll');
const exportScopeDuplicatesRadio = document.getElementById('exportScopeDuplicates');
const toggleSideMenuBtn = document.getElementById('toggleSideMenu');
const toggleSideMenuInlineBtn = document.getElementById('toggleSideMenuInline');

// Track which list is currently shown
var currentListMode = null;

// Compatibility exec wrapper: adapt callback-style chrome.* APIs and browser.* promises
if (typeof window.exec === 'undefined') {
  function makeCall(obj, method) {
    return function(...args) {
      // prefer chrome API if available
      try {
        if (typeof chrome !== 'undefined' && chrome[obj] && typeof chrome[obj][method] === 'function') {
          try {
            const res = chrome[obj][method](...args);
            if (res && typeof res.then === 'function') return res;
          } catch (e) {
            // fallthrough to callback adaptation
          }
          return new Promise((resolve) => {
            try {
              chrome[obj][method](...args, (r) => resolve(r));
            } catch (err) {
              resolve();
            }
          });
        }
      } catch (e) {}

      // prefer browser.* promise APIs
      try {
        if (typeof browser !== 'undefined' && browser[obj] && typeof browser[obj][method] === 'function') {
          return browser[obj][method](...args);
        }
      } catch (e) {}

      // fallback to an existing window.exec implementation (e.g. injected in tests)
      try {
        if (window.exec && window.exec[obj] && typeof window.exec[obj][method] === 'function') {
          return window.exec[obj][method](...args);
        }
      } catch (e) {}

      return Promise.resolve();
    };
  }

  window.exec = {
    tabs: {
      query: makeCall('tabs', 'query'),
      remove: makeCall('tabs', 'remove'),
      update: makeCall('tabs', 'update'),
      group: makeCall('tabs', 'group')
    },
    windows: { update: makeCall('windows', 'update') },
    runtime: { sendMessage: makeCall('runtime', 'sendMessage') },
    tabGroups: { update: makeCall('tabGroups', 'update') }
  };
}

// local reference for files that reference `exec` directly
var exec = window.exec;

// Update the stats shown in the popup (total tabs and duplicate count)
async function updateStats() {
  try {
    const tabs = await exec.tabs.query({});
    totalTabsElement.textContent = Array.isArray(tabs) ? tabs.length : 0;
    const duplicates = (typeof utils !== 'undefined' && utils.findDuplicateTabs)
      ? utils.findDuplicateTabs(tabs || [])
      : findDuplicateTabs(tabs || []);
    duplicateTabsElement.textContent = Array.isArray(duplicates) ? duplicates.length : 0;
  } catch (e) {
    console.error('updateStats error', e);
  }
}

function supportsTabGroups() {
  try {
    // Prefer explicit tabGroups API when available (e.g. Chrome),
      // Prefer explicit tabGroups API on the platform (chrome/browser).
      if (typeof chrome !== 'undefined' && chrome.tabGroups) return true;
      if (typeof browser !== 'undefined' && browser.tabGroups) return true;
      // Fall back to checking chrome.tabs.group only if the platform exposes it.
      if (typeof chrome !== 'undefined' && chrome.tabs && typeof chrome.tabs.group === 'function') return true;
      if (typeof browser !== 'undefined' && browser.tabs && typeof browser.tabs.group === 'function') return true;
      return false;
  } catch (e) {
    return false;
  }
}

// Initialize the popup
async function init() {
  await updateStats();
  // wire up button handlers
  try { setupEventListeners(); } catch (e) {}
  // Enable/disable Group button based on feature detection
  try {
    if (groupTabsByDomainBtn) groupTabsByDomainBtn.disabled = !supportsTabGroups();
  } catch (e) {}

  // Apply persisted side-menu state (remember expand/collapse between popups)
  try {
    const sideMenu = document.querySelector('.side-menu');
    const stored = (localStorage && localStorage.getItem && localStorage.getItem('sideMenuExpanded')) || '0';
    if (sideMenu && stored === '1') sideMenu.classList.add('expanded');
    // Update toggle button icon/title
    updateSideMenuToggleUi();
  } catch (e) {}

  const allTabs = await exec.tabs.query({});
  // Build map of url -> all tabs with that url
  const urlMap = new Map();
  allTabs.forEach(t => {
    const key = t && t.url ? t.url : 'Unknown';
    if (!urlMap.has(key)) urlMap.set(key, []);
    urlMap.get(key).push(t);
  });

  tabsListElement.innerHTML = '';
  tabsListElement.classList.add('show');

  // Filter to only groups with more than one tab
  const groups = Array.from(urlMap.entries()).filter(([url, arr]) => arr.length > 1);
  if (groups.length === 0) {
    tabsListElement.innerHTML = '<p style="text-align: center; color: #999;">No duplicate tabs found</p>';
    return;
  }

  for (const [url, groupTabs] of groups) {
    const groupEl = document.createElement('div');
    groupEl.className = 'duplicate-group';
    groupEl.innerHTML = `
      <div class="group-header">
        <strong>${url}</strong> <span class="group-count">(${groupTabs.length})</span>
        <button class="btn-close-group" title="Close duplicates for this URL">Close duplicates</button>
      </div>
      <div class="group-items"></div>
    `;

    const itemsEl = groupEl.querySelector('.group-items');

    groupTabs.forEach((tab, idx) => {
      const item = document.createElement('div');
      item.className = 'tab-item';
      const faviconHtml = tab.favIconUrl ? `<img class="tab-favicon" src="${tab.favIconUrl}" alt="favicon">` : '';
      const statusHtml = tab.status ? `<span class="status-badge">${tab.status}</span>` : '';
      item.innerHTML = `
        <div class="tab-row">
          ${faviconHtml}
          <div class="tab-content">
            <div class="tab-title">${tab.title || 'Untitled'} ${statusHtml}</div>
            <div class="tab-url">${tab.url || ''}</div>
          </div>
          <div class="tab-actions"><button class="btn-close">x</button></div>
        </div>
      `;

      // Individual close
      const btn = item.querySelector('.btn-close');
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          exec.tabs.remove([tab.id]).then(() => {
            updateStats();
            listDuplicates();
          }).catch(() => {});
        });
      }

      // Click to activate
      item.addEventListener('click', () => {
        exec.tabs.update(tab.id, { active: true }).catch(() => {});
        exec.windows.update(tab.windowId, { focused: true }).catch(() => {});
      });

      itemsEl.appendChild(item);
    });

    // Close duplicates for group (keep first tab)
    const closeGroupBtn = groupEl.querySelector('.btn-close-group');
    if (closeGroupBtn) {
      closeGroupBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // keep first tab in group, close the rest
        const toClose = groupTabs.slice(1).map(t => t.id);
        if (toClose.length === 0) return;
        if (!confirm || confirm(`Close ${toClose.length} duplicate tabs for ${url}?`)) {
          exec.tabs.remove(toClose).then(() => {
            updateStats();
            listDuplicates();
          }).catch(() => {});
        }
      });
    }

    tabsListElement.appendChild(groupEl);
  }

  // Update stats: total tabs and number of duplicate tabs (excluding first of each group)
  totalTabsElement.textContent = allTabs.length;
  const duplicateCount = groups.reduce((acc, [, arr]) => acc + Math.max(0, arr.length - 1), 0);
  duplicateTabsElement.textContent = duplicateCount;
}

// Find duplicate tabs by URL
// Use shared implementations from utils when available
function findDuplicateTabs(tabs) {
  if (typeof utils !== 'undefined' && utils.findDuplicateTabs) {
    return utils.findDuplicateTabs(tabs);
  }
  const urlMap = new Map();
  const duplicates = [];
  tabs.forEach(tab => {
    if (tab && tab.url) {
      if (urlMap.has(tab.url)) {
        duplicates.push(tab);
      } else {
        urlMap.set(tab.url, tab);
      }
    }
  });
  return duplicates;
}

function getDomainFromUrl(url) {
  if (typeof utils !== 'undefined' && utils.getDomainFromUrl) {
    return utils.getDomainFromUrl(url);
  }
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return 'Unknown';
  }
}

// Setup event listeners
function setupEventListeners() {
  if (listAllTabsBtn) listAllTabsBtn.addEventListener('click', listAllTabs);
  if (listDuplicateTabsBtn) listDuplicateTabsBtn.addEventListener('click', listDuplicates);
  if (exportListBtn) exportListBtn.addEventListener('click', exportList);
  if (toggleFullBtn) toggleFullBtn.addEventListener('click', toggleFullView);
  if (closeDuplicateTabsBtn) closeDuplicateTabsBtn.addEventListener('click', closeDuplicateTabs);
  if (groupTabsByDomainBtn) groupTabsByDomainBtn.addEventListener('click', groupTabsByDomain);
  if (closeTabsExceptActiveBtn) closeTabsExceptActiveBtn.addEventListener('click', closeTabsExceptActive);
  if (toggleSideMenuBtn) toggleSideMenuBtn.addEventListener('click', toggleSideMenu);
  if (toggleSideMenuInlineBtn) toggleSideMenuInlineBtn.addEventListener('click', toggleSideMenu);

  // Overlay controls for small screens
  const closeOverlayBtn = document.getElementById('closeOverlayBtn');
  if (closeOverlayBtn) closeOverlayBtn.addEventListener('click', closeOverlay);
  const overlay = document.getElementById('sideMenuOverlay');
  if (overlay) {
    // clicking backdrop closes overlay
    const backdrop = overlay.querySelector('.overlay-backdrop');
    if (backdrop) backdrop.addEventListener('click', () => closeOverlay());

    // overlay menu items trigger existing actions
    const overlayListAll = document.getElementById('overlayListAll');
    if (overlayListAll) overlayListAll.addEventListener('click', (e) => { e.stopPropagation(); listAllTabs(); closeOverlay(); });
    const overlayListDuplicates = document.getElementById('overlayListDuplicates');
    if (overlayListDuplicates) overlayListDuplicates.addEventListener('click', (e) => { e.stopPropagation(); listDuplicates(); closeOverlay(); });
  }
}

// Toggle full view: if opened as a normal tab (full=1) toggle CSS fullscreen class;
// otherwise open a new tab with the full view parameter.
function toggleFullView() {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get('full') === '1') {
      // toggle class to allow expansion in-page
      const container = document.querySelector('.container');
      if (container) container.classList.toggle('fullscreen');
      return;
    }
    // open a new popup window positioned at the top-right of the screen
    const fullUrl = (typeof chrome !== 'undefined' && chrome.runtime) ? chrome.runtime.getURL('popup.html') + '?full=1' : window.location.href + '?full=1';
    try {
      const availW = window.screen && window.screen.availWidth ? window.screen.availWidth : window.innerWidth;
      const availH = window.screen && window.screen.availHeight ? window.screen.availHeight : window.innerHeight;
      const w = Math.min(1000, Math.max(600, Math.floor(availW * 0.6)));
      const h = Math.min(900, Math.max(480, Math.floor(availH * 0.8)));
      const left = Math.max(0, Math.floor(availW - w - 12));
      const top = 0;
      if (typeof chrome !== 'undefined' && chrome.windows && typeof chrome.windows.create === 'function') {
        try {
          chrome.windows.create({ url: fullUrl, type: 'popup', left: left, top: top, width: w, height: h }, () => {});
        } catch (err) {
          // fallback to window.open
          window.open(fullUrl, '_blank', `width=${w},height=${h},left=${left},top=${top}`);
        }
      } else {
        window.open(fullUrl, '_blank', `width=${w},height=${h},left=${left},top=${top}`);
      }
    } catch (err) {
      // fallback simple open
      window.open(fullUrl, '_blank');
    }
    // close current popup to avoid duplicate windows
    try { window.close(); } catch (e) {}
  } catch (e) { console.error('toggleFullView error', e); }
}

// Keyboard shortcut handler: toggle full view with `f` (when not typing in inputs)
function handleKeydown(e) {
  try {
    if (!e || !e.key) return;
    if (e.key.toLowerCase() === 'f') {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
      toggleFullView();
    }
  } catch (err) { console.error('handleKeydown error', err); }
}

// Toggle side menu expand/collapse and remember the preference in localStorage
function isSmallScreen() {
  try {
    return window.matchMedia && window.matchMedia('(max-width: 767px)').matches;
  } catch (e) { return false; }
}

function updateSideMenuToggleUi() {
  try {
    const sideMenu = document.querySelector('.side-menu');
    if (!sideMenu) return;
    const btn = document.getElementById('toggleSideMenu');
    const inlineBtn = document.getElementById('toggleSideMenuInline');
    const icon = btn && btn.querySelector('.btn-icon');
    if (sideMenu.classList.contains('expanded')) {
      icon && (icon.textContent = '✖');
      if (btn) { btn.title = 'Collapse side menu'; btn.setAttribute('aria-expanded', 'true'); }
      if (inlineBtn) inlineBtn.setAttribute('aria-expanded', 'true');
    } else {
      icon && (icon.textContent = '☰');
      if (btn) { btn.title = 'Expand side menu'; btn.setAttribute('aria-expanded', 'false'); }
      if (inlineBtn) inlineBtn.setAttribute('aria-expanded', 'false');
    }
  } catch (e) { }
}

function openOverlay() {
  try {
    const overlay = document.getElementById('sideMenuOverlay');
    if (!overlay) return;
    overlay.classList.remove('hidden');
    // also make overlay focusable and add handler so key events are reliably captured
    const overlay = document.getElementById('sideMenuOverlay');
    if (overlay) {
      overlay.tabIndex = -1;
      overlay.addEventListener('keydown', overlayEscapeHandler, true);
    }
    // focus management: move focus to close button (last to retain focus)
    const closeBtn = document.getElementById('closeOverlayBtn');
    closeBtn && closeBtn.focus();
    // set aria-expanded on toggle buttons
    const btn = document.getElementById('toggleSideMenu');
    const inlineBtn = document.getElementById('toggleSideMenuInline');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    if (inlineBtn) inlineBtn.setAttribute('aria-expanded', 'true');
    // trap Escape to close overlay (attach to window for reliability)
    window.addEventListener('keydown', overlayEscapeHandler);
  } catch (e) { console.error('openOverlay error', e); }
}

function closeOverlay() {
  try {
    const overlay = document.getElementById('sideMenuOverlay');
    if (!overlay) return;
    overlay.classList.add('hidden');
    // restore aria-expanded
    const btn = document.getElementById('toggleSideMenu');
    const inlineBtn = document.getElementById('toggleSideMenuInline');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    if (inlineBtn) inlineBtn.setAttribute('aria-expanded', 'false');
    // return focus to hamburger
    const btnEl = document.getElementById('toggleSideMenu');
    btnEl && btnEl.focus();
    window.removeEventListener('keydown', overlayEscapeHandler);
    const overlay = document.getElementById('sideMenuOverlay');
    if (overlay) {
      try { overlay.removeEventListener('keydown', overlayEscapeHandler, true); } catch (e) {}
      try { overlay.tabIndex = -1; } catch (e) {}
    }
  } catch (e) { console.error('closeOverlay error', e); }
}

function overlayEscapeHandler(e) {
  if (e && e.key && e.key === 'Escape') closeOverlay();
}

function toggleSideMenu() {
  try {
    if (isSmallScreen()) {
      // show overlay on small screens
      const overlay = document.getElementById('sideMenuOverlay');
      if (overlay && overlay.classList.contains('hidden')) openOverlay();
      else closeOverlay();
      return;
    }

    const sideMenu = document.querySelector('.side-menu');
    if (!sideMenu) return;
    sideMenu.classList.toggle('expanded');
    const expanded = sideMenu.classList.contains('expanded');
    try { localStorage.setItem('sideMenuExpanded', expanded ? '1' : '0'); } catch (e) {}
    updateSideMenuToggleUi();
  } catch (e) { console.error('toggleSideMenu error', e); }
}

// Attach keyboard listener during init
try {
  if (typeof document !== 'undefined') document.addEventListener('keydown', handleKeydown);
} catch (e) {}

// Export currently shown list as CSV/JSON
async function exportList() {
  // decide scope: 'duplicates' or 'all'
  const scope = (exportScopeDuplicatesRadio && exportScopeDuplicatesRadio.checked) ? 'duplicates' : 'all';
  let tabs = [];
  if (scope === 'duplicates') {
    const allTabs = await exec.tabs.query({});
    tabs = (typeof utils !== 'undefined' && utils.findDuplicateTabs) ? utils.findDuplicateTabs(allTabs) : findDuplicateTabs(allTabs);
  } else {
    tabs = await exec.tabs.query({});
  }

  if (!tabs || tabs.length === 0) {
    alert('No tabs to export');
    return;
  }

  // Normalize tabs to include extra fields so JSON always has same shape
  const normalized = tabs.map(t => ({
    id: t.id,
    title: t.title || '',
    url: t.url || '',
    windowId: t.windowId || '',
    favIconUrl: t.favIconUrl || '',
    status: t.status || ''
  }));

  const shouldCsv = exportCsvCheckbox && exportCsvCheckbox.checked;
  const shouldJson = exportJsonCheckbox && exportJsonCheckbox.checked;
  const timestamp = getTimestamp();

  if (!shouldCsv && !shouldJson) {
    alert('Please select at least one export format (CSV or JSON)');
    return;
  }

  // Trigger downloads for selected formats
  if (shouldCsv) {
    const csv = tabsToCsv(normalized);
    triggerDownload(csv, `tabs-export-${scope}-${timestamp}.csv`, 'text/csv');
  }
  if (shouldJson) {
    const content = JSON.stringify(normalized, null, 2);
    triggerDownload(content, `tabs-export-${scope}-${timestamp}.json`, 'application/json');
  }
}

function tabsToCsv(tabs) {
  const header = ['id', 'title', 'url', 'windowId', 'favIconUrl', 'status'];
  const rows = tabs.map(t => {
    const fields = [
      t.id,
      (t.title || '').replace(/"/g, '""'),
      t.url || '',
      t.windowId || '',
      t.favIconUrl || '',
      t.status || ''
    ];
    return fields.map(field => `"${String(field)}"`).join(',');
  });
  return `${header.join(',')}\n${rows.join('\n')}`;
}

function getTimestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const YYYY = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const DD = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${YYYY}${MM}${DD}_${hh}${mm}${ss}`;
}

function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'download.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// List all tabs
async function listAllTabs() {
  // Toggle: collapse if we're already showing the full list
  if (currentListMode === 'all' && tabsListElement.classList.contains('show')) {
    tabsListElement.innerHTML = '';
    tabsListElement.classList.remove('show');
    currentListMode = null;
    return;
  }

  const tabs = await exec.tabs.query({});
  const duplicateUrls = new Set();

  // Find duplicate URLs
  const urlMap = new Map();
  tabs.forEach(tab => {
    if (tab.url) {
      if (urlMap.has(tab.url)) {
        duplicateUrls.add(tab.url);
      } else {
        urlMap.set(tab.url, tab);
      }
    }
  });

  // Clear existing list
  tabsListElement.innerHTML = '';
  tabsListElement.classList.add('show');
  currentListMode = 'all';

  if (tabs.length === 0) {
    tabsListElement.innerHTML = '<p style="text-align: center; color: #999;">No tabs found</p>';
    return;
  }

  // Create tab items
  tabs.forEach(tab => {
    const tabItem = document.createElement('div');
    tabItem.className = 'tab-item bg-white rounded-md p-3 mb-2 flex items-center gap-3 border border-gray-100 hover:bg-gray-50';

    const isDuplicate = duplicateUrls.has(tab.url);

    const faviconHtml = tab.favIconUrl ? `<img class="tab-favicon" src="${tab.favIconUrl}" alt="favicon">` : '';
    const statusHtml = tab.status ? `<span class="status-badge">${tab.status}</span>` : '';

    tabItem.innerHTML = `
      <div class="tab-row flex items-center gap-3 w-full">
        ${faviconHtml}
        <div class="tab-content flex-1 min-w-0">
          <div class="tab-title text-sm font-semibold text-gray-900">
            ${tab.title || 'Untitled'}
            ${isDuplicate ? '<span class="duplicate-badge bg-red-500 text-white rounded px-2 text-xs ml-2">DUPLICATE</span>' : ''}
            ${statusHtml}
          </div>
          <div class="tab-url text-xs text-gray-500 truncate">${tab.url || ''}</div>
        </div>
        <div class="tab-actions flex items-center gap-2">
          <button class="btn-close w-8 h-8 rounded border text-red-600" title="Close tab">✖</button>
        </div>
      </div>
    `;

    // Close button
    const closeBtn = tabItem.querySelector('.btn-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        exec.tabs.remove([tab.id]).then(() => {
          updateStats();
          if (currentListMode === 'all') listAllTabs();
          else if (currentListMode === 'duplicates') listDuplicates();
        }).catch(() => {});
      });
    }

    // Make tab clickable to switch to it
    tabItem.addEventListener('click', () => {
      exec.tabs.update(tab.id, { active: true }).catch(() => {});
      exec.windows.update(tab.windowId, { focused: true }).catch(() => {});
    });

    tabsListElement.appendChild(tabItem);
  });
}

// List only duplicate tabs
async function listDuplicates() {
  // Toggle: collapse if we're already showing duplicates
  if (currentListMode === 'duplicates' && tabsListElement.classList.contains('show')) {
    tabsListElement.innerHTML = '';
    tabsListElement.classList.remove('show');
    currentListMode = null;
    return;
  }

  const tabs = await exec.tabs.query({});

  tabsListElement.innerHTML = '';
  tabsListElement.classList.add('show');

  if (!tabs || tabs.length === 0) {
    tabsListElement.innerHTML = '<p style="text-align: center; color: #999;">No duplicate tabs found</p>';
    return;
  }

  // Build groups by URL including the original tab and duplicates
  const urlMap = new Map();
  tabs.forEach(tab => {
    const key = tab.url || 'Unknown';
    if (!urlMap.has(key)) urlMap.set(key, []);
    urlMap.get(key).push(tab);
  });

  // Filter to only groups with more than one tab
  const groups = Array.from(urlMap.entries()).filter(([url, arr]) => arr.length > 1);
  if (groups.length === 0) {
    tabsListElement.innerHTML = '<p style="text-align: center; color: #999;">No duplicate tabs found</p>';
    return;
  }

  for (const [url, groupTabs] of groups) {
    const groupEl = document.createElement('div');
    groupEl.className = 'duplicate-group bg-white rounded-md p-3 border border-gray-100 mb-3';
    groupEl.innerHTML = `
      <div class="group-header flex items-center justify-between gap-2 mb-2">
        <strong class="text-sm font-semibold text-gray-900">${url}</strong> <span class="group-count text-xs text-gray-500">(${groupTabs.length})</span>
        <button class="btn-close-group bg-red-500 text-white px-3 py-1 rounded" title="Close duplicates for this URL">Close duplicates</button>
      </div>
      <div class="group-items"></div>
    `;

    const itemsEl = groupEl.querySelector('.group-items');

    groupTabs.forEach(tab => {
      const item = document.createElement('div');
      item.className = 'tab-item bg-white rounded-md p-3 mb-2 flex items-center gap-3 border border-gray-100 hover:bg-gray-50';
      const faviconHtml = tab.favIconUrl ? `<img class="tab-favicon" src="${tab.favIconUrl}" alt="favicon">` : '';
      const statusHtml = tab.status ? `<span class="status-badge">${tab.status}</span>` : '';
      item.innerHTML = `
        <div class="tab-row flex items-center gap-3 w-full">
          ${faviconHtml}
          <div class="tab-content flex-1 min-w-0">
            <div class="tab-title text-sm font-semibold text-gray-900">${tab.title || 'Untitled'} ${statusHtml}</div>
            <div class="tab-url text-xs text-gray-500 truncate">${tab.url || ''}</div>
          </div>
          <div class="tab-actions"><button class="btn-close w-8 h-8 rounded border">x</button></div>
        </div>
      `;

      // Individual close
      const btn = item.querySelector('.btn-close');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        exec.tabs.remove([tab.id]).then(() => {
          updateStats();
          listDuplicates();
        }).catch(() => {});
      });

      // Click to activate
      item.addEventListener('click', () => {
        exec.tabs.update(tab.id, { active: true }).catch(() => {});
        exec.windows.update(tab.windowId, { focused: true }).catch(() => {});
      });

      itemsEl.appendChild(item);
    });

    // Close duplicates for group (keep one)
    const closeGroupBtn = groupEl.querySelector('.btn-close-group');
    closeGroupBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // keep first tab in group, close the rest
      const toClose = groupTabs.slice(1).map(t => t.id);
      if (toClose.length === 0) return;
      if (!confirm || confirm(`Close ${toClose.length} duplicate tabs for ${url}?`)) {
        exec.tabs.remove(toClose).then(() => {
          updateStats();
          listDuplicates();
        }).catch(() => {});
      }
    });

    tabsListElement.appendChild(groupEl);
  }
  currentListMode = 'duplicates';
}

// Close duplicate tabs
async function closeDuplicateTabs() {
  const tabs = await exec.tabs.query({});
  const duplicates = findDuplicateTabs(tabs);

  if (duplicates.length === 0) {
    alert('No duplicate tabs found!');
    return;
  }

  const confirmMsg = `Are you sure you want to close ${duplicates.length} duplicate tab(s)?`;
  if (confirm(confirmMsg)) {
    const tabIds = duplicates.map(tab => tab.id);
    await exec.tabs.remove(tabIds).catch(() => {});
    await updateStats();

    // Tell background to refresh its state so the badge updates reliably
    try {
      await exec.runtime.sendMessage({ action: 'refresh' }).catch(() => {});
    } catch (e) {}

    // Update the list if it's shown
    if (tabsListElement.classList.contains('show')) {
      await listAllTabs();
    }
  }
}

// Group tabs by domain
async function groupTabsByDomain() {
  if (!supportsTabGroups()) {
    alert('Tab groups are not supported in this browser.');
    return;
  }
  const tabs = await exec.tabs.query({ currentWindow: true });

  // Group tabs by domain
  const domainMap = new Map();
  tabs.forEach(tab => {
    const domain = getDomainFromUrl(tab.url);
    if (!domainMap.has(domain)) {
      domainMap.set(domain, []);
    }
    domainMap.get(domain).push(tab);
  });
  // Determine how many groups would be created (domains with >1 tab)
  let groupsToCreate = 0;
  for (const domainTabs of domainMap.values()) {
    if (domainTabs.length > 1) groupsToCreate++;
  }

  if (groupsToCreate === 0) {
    alert('No domains with multiple tabs found to group.');
    return;
  }

  // Confirm with user before creating groups
  const confirmMsg = `This will create ${groupsToCreate} tab group(s). Proceed?`;
  if (!confirm(confirmMsg)) return;

  // Create groups for domains with multiple tabs
  let groupsCreated = 0;
  for (const [domain, domainTabs] of domainMap.entries()) {
    if (domainTabs.length <= 1) continue;
    try {
      const tabIds = domainTabs.map(tab => tab.id);
      let groupId;
      try {
        groupId = await exec.tabs.group({ tabIds });
        await exec.tabGroups.update(groupId, {
          title: domain,
          color: (typeof utils !== 'undefined' && utils.getRandomColor) ? utils.getRandomColor() : getRandomColor()
        }).catch(() => {});
        groupsCreated++;
      } catch (error) {
        console.error(`Error grouping tabs for ${domain}:`, error);
      }
    } catch (error) {
      console.error(`Error grouping tabs for ${domain}:`, error);
    }
  }

  if (groupsCreated > 0) {
    alert(`Successfully created ${groupsCreated} tab group(s)!`);
  } else {
    alert('No groups were created due to errors.');
  }
}

// Get random color for tab groups
function getRandomColor() {
  if (typeof utils !== 'undefined' && utils.getRandomColor) {
    return utils.getRandomColor();
  }
  const colors = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Close all tabs except the active one
async function closeTabsExceptActive() {
  const tabs = await exec.tabs.query({ currentWindow: true });
  const activeTabs = await exec.tabs.query({ active: true, currentWindow: true });

  if (activeTabs.length === 0) {
    alert('No active tab found!');
    return;
  }

  const activeTabId = activeTabs[0].id;
  const tabsToClose = tabs.filter(tab => tab.id !== activeTabId);

  if (tabsToClose.length === 0) {
    alert('Only one tab is open!');
    return;
  }

  const confirmMsg = `Are you sure you want to close ${tabsToClose.length} tab(s)?`;
  if (confirm(confirmMsg)) {
    const tabIds = tabsToClose.map(tab => tab.id);
    await exec.tabs.remove(tabIds).catch(() => {});
    await updateStats();

      try {
        await exec.runtime.sendMessage({ action: 'refresh' }).catch(() => {});
      } catch (e) {}

    // Clear the list since most tabs are gone
    if (tabsListElement.classList.contains('show')) {
      tabsListElement.innerHTML = '';
      tabsListElement.classList.remove('show');
    }
  }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export internals for unit tests (CommonJS)
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = module.exports || {};
  module.exports.exec = exec;
  module.exports.supportsTabGroups = supportsTabGroups;
  module.exports.toggleSideMenu = toggleSideMenu;
}
