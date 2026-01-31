// Background service worker (clean) for jwd-browser-tab-manager
// Tracks tabs and their URLs to compute duplicate counts

let tabRegistry = new Map(); // tabId -> normalized URL
let urlCounts = new Map();   // normalized URL -> count
let duplicateCount = 0;

function normalizeUrl(raw) {
  if (!raw) return '';
  try {
    if (raw.startsWith('chrome://') || raw.startsWith('about:') || raw.startsWith('chrome-extension://')) return raw;
    const u = new URL(raw);
    u.hash = '';
    if (u.pathname !== '/' && u.pathname.endsWith('/')) u.pathname = u.pathname.slice(0, -1);
    return u.toString();
  } catch (e) {
    return raw;
  }
}

function recalculateDuplicates() {
  let count = 0;
  for (const v of urlCounts.values()) {
    if (v > 1) count += v - 1;
  }
  duplicateCount = count;
  updateBadge();
  try {
    chrome.storage.local.set({ duplicateCount, urlCounts: Array.from(urlCounts.entries()), lastUpdated: Date.now() });
  } catch (e) {}
}

function updateBadge() {
  try {
    if (duplicateCount > 0) {
      chrome.action.setBadgeText({ text: String(duplicateCount) });
      chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  } catch (e) {}
}

function addTab(tabId, rawUrl) {
  const url = normalizeUrl(rawUrl);
  tabRegistry.set(tabId, url);
  const prev = urlCounts.get(url) || 0;
  urlCounts.set(url, prev + 1);
  recalculateDuplicates();
}

function removeTab(tabId) {
  const url = tabRegistry.get(tabId);
  if (!url) return;
  tabRegistry.delete(tabId);
  const prev = urlCounts.get(url) || 0;
  if (prev <= 1) urlCounts.delete(url);
  else urlCounts.set(url, prev - 1);
  recalculateDuplicates();
}

function updateTab(tabId, newUrl) {
  removeTab(tabId);
  if (newUrl) addTab(tabId, newUrl);
}

function getDuplicateInfo() {
  const duplicates = [];
  for (const [url, cnt] of urlCounts.entries()) if (cnt > 1) duplicates.push({ url, count: cnt });
  duplicates.sort((a, b) => b.count - a.count);
  return { duplicateCount, duplicates };
}

function initializeTabs() {
  try {
    chrome.tabs.query({}, (tabs) => {
      tabRegistry.clear();
      urlCounts.clear();
      duplicateCount = 0;
      for (const t of tabs) if (t && t.url) addTab(t.id, t.url);
    });
  } catch (e) {
    console.error('initializeTabs failed', e);
  }
}

// Event listeners
chrome.tabs.onCreated.addListener((tab) => {
  if (tab && tab.id && tab.url) addTab(tab.id, tab.url);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo && changeInfo.url) updateTab(tabId, changeInfo.url);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  removeTab(tabId);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!request || !request.action) return false;
  if (request.action === 'getDuplicateInfo') {
    sendResponse(getDuplicateInfo());
    return false;
  }
  if (request.action === 'refresh') {
    initializeTabs();
    sendResponse({ ok: true });
    return false;
  }
  if (request.action === 'closeDuplicates') {
    const urlToClose = request.url;
    const tabsToClose = [];
    let keepFirst = true;
    for (const [tabId, url] of tabRegistry.entries()) {
      if (url === urlToClose) {
        if (keepFirst) keepFirst = false;
        else tabsToClose.push(tabId);
      }
    }
    if (tabsToClose.length === 0) {
      sendResponse({ closed: 0 });
      return false;
    }
    chrome.tabs.remove(tabsToClose, () => {
      if (chrome.runtime.lastError) sendResponse({ closed: 0, error: chrome.runtime.lastError.message });
      else sendResponse({ closed: tabsToClose.length });
    });
    return true;
  }
  return false;
});

// Initialize on startup
initializeTabs();
console.log('Background service worker (clean) initialized');
