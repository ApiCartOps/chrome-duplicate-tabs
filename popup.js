// DOM elements
const totalTabsElement = document.getElementById('totalTabs');
const duplicateTabsElement = document.getElementById('duplicateTabs');
const tabsListElement = document.getElementById('tabsList');
const listAllTabsBtn = document.getElementById('listAllTabs');
const listDuplicateTabsBtn = document.getElementById('listDuplicateTabs');
const closeDuplicateTabsBtn = document.getElementById('closeDuplicateTabs');
const groupTabsByDomainBtn = document.getElementById('groupTabsByDomain');
const closeTabsExceptActiveBtn = document.getElementById('closeTabsExceptActive');

// Initialize the popup
async function init() {
  await updateStats();
  setupEventListeners();
  // Disable group-by-domain if tabGroups API is not supported
  if (!supportsTabGroups()) {
    groupTabsByDomainBtn.disabled = true;
    groupTabsByDomainBtn.title = 'Tab groups not supported in this browser';
  } else {
    groupTabsByDomainBtn.disabled = false;
    groupTabsByDomainBtn.title = '';
  }
}

function supportsTabGroups() {
  if (typeof browser !== 'undefined' && browser.tabGroups && browser.tabGroups.update) return true;
  if (typeof chrome !== 'undefined' && chrome.tabGroups && chrome.tabGroups.update) return true;
  return false;
}

// Compatibility wrapper: prefer `browser` (polyfill) but fall back to promisified `chrome` APIs
const exec = {
  tabs: {
    query: (q) => {
      if (typeof browser !== 'undefined') return browser.tabs.query(q);
      if (typeof chrome !== 'undefined' && typeof chrome.tabs.query === 'function' && chrome.tabs.query.length >= 2) {
        return new Promise((res) => chrome.tabs.query(q, res));
      }
      const maybe = chrome.tabs.query(q);
      if (maybe && typeof maybe.then === 'function') return maybe;
      return new Promise((res) => chrome.tabs.query(q, res));
    },
    update: (id, opts) => {
      if (typeof browser !== 'undefined') return browser.tabs.update(id, opts);
      const maybe = chrome.tabs.update(id, opts);
      if (maybe && typeof maybe.then === 'function') return maybe;
      return new Promise((res) => chrome.tabs.update(id, opts, res));
    },
    remove: (ids) => {
      if (typeof browser !== 'undefined') return browser.tabs.remove(ids);
      const maybe = chrome.tabs.remove(ids);
      if (maybe && typeof maybe.then === 'function') return maybe;
      return new Promise((res) => chrome.tabs.remove(ids, res));
    },
    group: (opts) => {
      if (typeof browser !== 'undefined') return browser.tabs.group(opts);
      const maybe = chrome.tabs.group(opts);
      if (maybe && typeof maybe.then === 'function') return maybe;
      return new Promise((res) => chrome.tabs.group(opts, res));
    }
  },
  windows: {
    update: (id, opts) => {
      if (typeof browser !== 'undefined') return browser.windows.update(id, opts);
      const maybe = chrome.windows.update(id, opts);
      if (maybe && typeof maybe.then === 'function') return maybe;
      return new Promise((res) => chrome.windows.update(id, opts, res));
    }
  },
  runtime: {
    sendMessage: (msg) => {
      if (typeof browser !== 'undefined') return browser.runtime.sendMessage(msg);
      const maybe = chrome.runtime.sendMessage(msg);
      if (maybe && typeof maybe.then === 'function') return maybe;
      return new Promise((res) => chrome.runtime.sendMessage(msg, res));
    }
  },
  tabGroups: {
    update: (groupId, opts) => {
      if (typeof browser !== 'undefined' && browser.tabGroups && browser.tabGroups.update) return browser.tabGroups.update(groupId, opts);
      if (typeof chrome !== 'undefined' && chrome.tabGroups && chrome.tabGroups.update) {
        const maybe = chrome.tabGroups.update(groupId, opts);
        if (maybe && typeof maybe.then === 'function') return maybe;
        return new Promise((res) => chrome.tabGroups.update(groupId, opts, res));
      }
      return Promise.reject(new Error('tabGroups API not supported'));
    }
  }
};

// Track which list is currently shown: 'all', 'duplicates', or null
let currentListMode = null;

// Update tab statistics
async function updateStats() {
  const tabs = await exec.tabs.query({});
  const duplicates = (typeof utils !== 'undefined' && utils.findDuplicateTabs)
    ? utils.findDuplicateTabs(tabs)
    : findDuplicateTabs(tabs);

  totalTabsElement.textContent = tabs.length;
  duplicateTabsElement.textContent = duplicates.length;
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
  listAllTabsBtn.addEventListener('click', listAllTabs);
  listDuplicateTabsBtn.addEventListener('click', listDuplicates);
  closeDuplicateTabsBtn.addEventListener('click', closeDuplicateTabs);
  groupTabsByDomainBtn.addEventListener('click', groupTabsByDomain);
  closeTabsExceptActiveBtn.addEventListener('click', closeTabsExceptActive);
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
    tabItem.className = 'tab-item';

    const isDuplicate = duplicateUrls.has(tab.url);

    tabItem.innerHTML = `
      <div class="tab-title">
        ${tab.title || 'Untitled'}
        ${isDuplicate ? '<span class="duplicate-badge">DUPLICATE</span>' : ''}
      </div>
      <div class="tab-url">${tab.url || ''}</div>
    `;

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
  const duplicates = (typeof utils !== 'undefined' && utils.findDuplicateTabs)
    ? utils.findDuplicateTabs(tabs)
    : findDuplicateTabs(tabs);

  tabsListElement.innerHTML = '';
  tabsListElement.classList.add('show');

  if (duplicates.length === 0) {
    tabsListElement.innerHTML = '<p style="text-align: center; color: #999;">No duplicate tabs found</p>';
    return;
  }

  duplicates.forEach(tab => {
    const tabItem = document.createElement('div');
    tabItem.className = 'tab-item';

    tabItem.innerHTML = `
      <div class="tab-title">
        ${tab.title || 'Untitled'}
        <span class="duplicate-badge">DUPLICATE</span>
      </div>
      <div class="tab-url">${tab.url || ''}</div>
    `;

    tabItem.addEventListener('click', () => {
      exec.tabs.update(tab.id, { active: true }).catch(() => {});
      exec.windows.update(tab.windowId, { focused: true }).catch(() => {});
    });

    tabsListElement.appendChild(tabItem);
  });
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

  // Create groups for domains with multiple tabs
  let groupsCreated = 0;
  for (const [domain, domainTabs] of domainMap.entries()) {
    if (domainTabs.length > 1) {
      try {
        // Create a new group
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

        groupsCreated++;
      } catch (error) {
        console.error(`Error grouping tabs for ${domain}:`, error);
      }
    }
  }

  if (groupsCreated > 0) {
    alert(`Successfully created ${groupsCreated} tab group(s)!`);
  } else {
    alert('No domains with multiple tabs found to group.');
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
}
