// Background service worker for Smart Tab Manager
// Tracks tabs and their URLs and updates the extension badge

const tabRegistry = new Map(); // tabId -> normalized URL
const urlCounts = new Map();   // normalized URL -> count
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

  // Also set per-tab badge text for environments that require it
  try {
    chrome.tabs.query({}, (tabs) => {
      for (const t of (tabs || [])) {
        try {
          if (duplicateCount > 0) chrome.action.setBadgeText({ tabId: t.id, text: String(duplicateCount) });
          else chrome.action.setBadgeText({ tabId: t.id, text: '' });
        } catch (e) {}
      }
    });
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
  return new Promise((resolve) => {
    try {
      chrome.tabs.query({}, (tabs) => {
        try {
          tabRegistry.clear();
          urlCounts.clear();
          duplicateCount = 0;
          for (const t of (tabs || [])) if (t && t.url) addTab(t.id, t.url);
          resolve({ ok: true, count: duplicateCount });
        } catch (inner) {
          console.error('initializeTabs inner error', inner);
          resolve({ ok: false, error: String(inner) });
        }
      });
    } catch (e) {
      console.error('initializeTabs failed', e);
      resolve({ ok: false, error: String(e) });
    }
  });
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
    initializeTabs().then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
    return true;
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

// Initialize on startup and retry shortly after to handle service-worker start races
initializeTabs().then(() => console.log('Background initialized (first run)')).catch(() => {});
setTimeout(() => { initializeTabs().then(() => console.log('Background initialized (retry)')).catch(() => {}); }, 1500);

// Also attempt to reinitialize on lifecycle events
try { chrome.runtime.onInstalled.addListener(() => { initializeTabs().catch(() => {}); }); } catch (e) {}
try { chrome.runtime.onStartup.addListener(() => { initializeTabs().catch(() => {}); }); } catch (e) {}

console.log('Background service worker initialized');

// Background service worker for Smart Tab Manager
// Consolidated, single implementation that tracks tabs and updates the extension badge

const tabRegistry = new Map(); // tabId -> normalized URL
const urlCounts = new Map();   // normalized URL -> count
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

  // Also set per-tab badge text for environments that require it
  try {
    chrome.tabs.query({}, (tabs) => {
      for (const t of (tabs || [])) {
        try {
          if (duplicateCount > 0) chrome.action.setBadgeText({ tabId: t.id, text: String(duplicateCount) });
          else chrome.action.setBadgeText({ tabId: t.id, text: '' });
        } catch (e) {}
      }
    });
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
  return new Promise((resolve) => {
    try {
      chrome.tabs.query({}, (tabs) => {
        try {
          tabRegistry.clear();
          urlCounts.clear();
          duplicateCount = 0;
          for (const t of (tabs || [])) if (t && t.url) addTab(t.id, t.url);
          resolve({ ok: true, count: duplicateCount });
        } catch (inner) {
          console.error('initializeTabs inner error', inner);
          resolve({ ok: false, error: String(inner) });
        }
      });
    } catch (e) {
      console.error('initializeTabs failed', e);
      resolve({ ok: false, error: String(e) });
    }
  });
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
    initializeTabs().then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
    return true;
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

// Initialize on startup and retry shortly after to handle service-worker start races
initializeTabs().then(() => console.log('Background initialized (first run)')).catch(() => {});
setTimeout(() => { initializeTabs().then(() => console.log('Background initialized (retry)')).catch(() => {}); }, 1500);

// Also attempt to reinitialize on lifecycle events
try { chrome.runtime.onInstalled.addListener(() => { initializeTabs().catch(() => {}); }); } catch (e) {}
try { chrome.runtime.onStartup.addListener(() => { initializeTabs().catch(() => {}); }); } catch (e) {}

console.log('Background service worker initialized');
// Listens for tab creation/update events and maintains a live duplicate count

// Track all tabs and their URLs
let tabRegistry = new Map(); // Map of tabId -> URL
let urlCounts = new Map();   // Map of URL -> count
let duplicateCount = 0;      // Total number of duplicate tabs

/**
 * Initialize the extension by loading all existing tabs
 */
async function initializeTabs() {
  try {
    const tabs = await chrome.tabs.query({});
    console.log(`Initializing with ${tabs.length} existing tabs`);
    
    tabRegistry.clear();
    urlCounts.clear();
    duplicateCount = 0;
    
    // Process each existing tab
    for (const tab of tabs) {
      if (tab.url) {
        addTab(tab.id, tab.url);
      }
    }
    
    updateBadge();
    console.log(`Initialized: ${duplicateCount} duplicate tabs found`);
  } catch (error) {
    console.error('Error initializing tabs:', error);
    // Load webextension polyfill to provide `browser` API in all browsers
    try {
      importScripts('vendor/browser-polyfill.js');
    } catch (e) {
      // importScripts may not be available in some test runners
    }

  }
}

/**
 * Add a tab to the registry
 */
function addTab(tabId, url) {
        const tabs = await browser.tabs.query({});
  const normalizedUrl = normalizeUrl(url);
  
  // Update tab registry
  tabRegistry.set(tabId, normalizedUrl);
  
  // Update URL counts
  const currentCount = urlCounts.get(normalizedUrl) || 0;
  urlCounts.set(normalizedUrl, currentCount + 1);
  
  // Update duplicate count
  recalculateDuplicates();
}

/**
 * Remove a tab from the registry
 */
function removeTab(tabId) {
  const url = tabRegistry.get(tabId);
  if (!url) return;
  
  // Remove from tab registry
  tabRegistry.delete(tabId);
  
  // Update URL counts
  const currentCount = urlCounts.get(url) || 0;
  if (currentCount <= 1) {
    urlCounts.delete(url);
  } else {
    urlCounts.set(url, currentCount - 1);
  }
      browser.storage.local.set({
  // Update duplicate count
  recalculateDuplicates();
}

/**
 * Update a tab's URL in the registry
 */
function updateTab(tabId, newUrl) {
        browser.action.setBadgeText({ text: duplicateCount.toString() }).catch(() => {});
        browser.action.setBadgeBackgroundColor({ color: '#FF0000' }).catch(() => {});
  
        browser.action.setBadgeText({ text: '' }).catch(() => {});
  if (newUrl) {
    addTab(tabId, newUrl);
  }
}

/**
 * Normalize URL for comparison
 */
function normalizeUrl(url) {
  if (!url) return '';
  
  try {
    // Skip chrome:// and other internal URLs
    if (url.startsWith('chrome://') || 
        url.startsWith('chrome-extension://') ||
        url.startsWith('about:')) {
      return url;
    }
    
    browser.tabs.onCreated.addListener((tab) => {
    const urlObj = new URL(url);
    
    // Remove hash/fragment
    urlObj.hash = '';
    
    // Remove trailing slash from pathname
    if (urlObj.pathname.endsWith('/') && urlObj.pathname.length > 1) {
    browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    }
    
    return urlObj.toString();
  } catch (error) {
    // If URL parsing fails, return as-is
    return url;
  }
    browser.tabs.onRemoved.addListener((tabId, removeInfo) => {

/**
 * Recalculate the total number of duplicate tabs
 */
function recalculateDuplicates() {
    browser.runtime.onMessage.addListener((request, sender) => {
  
        return getDuplicateInfo();
    if (count > 1) {
      duplicateCount += (count - 1);
    }
        return initializeTabs().then(() => ({ ok: true })).catch(err => ({ ok: false, error: err && err.message }));
  updateBadge();
  
  // Store the count for popup access
  chrome.storage.local.set({
    duplicateCount: duplicateCount,
    urlCounts: Array.from(urlCounts.entries()),
    lastUpdated: Date.now()
  });
}

/**
 * Update the extension badge with duplicate count
 */
function updateBadge() {
  if (duplicateCount > 0) {
    chrome.action.setBadgeText({ text: duplicateCount.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
          return browser.tabs.remove(tabsToClose).then(() => ({ closed: tabsToClose.length })).catch(err => ({ closed: 0, error: err && err.message }));
function getDuplicateInfo() {
  const duplicates = [];
  
  for (const [url, count] of urlCounts.entries()) {
    if (count > 1) {
      duplicates.push({ url, count });
    }
  }
  
  return {
    duplicateCount,
    duplicates: duplicates.sort((a, b) => b.count - a.count)
  };
}

// Event Listeners

// Listen for tab creation
chrome.tabs.onCreated.addListener((tab) => {
  console.log('Tab created:', tab.id, tab.url);
  if (tab.url) {
    addTab(tab.id, tab.url);
  }
});

// Listen for tab updates (URL changes, loading states, etc.)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only process when URL changes
  if (changeInfo.url) {
    console.log('Tab updated:', tabId, changeInfo.url);
    updateTab(tabId, changeInfo.url);
  }
});

// Listen for tab removal
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log('Tab removed:', tabId);
  removeTab(tabId);
});

// Listen for messages from popup or other parts of the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getDuplicateInfo') {
    sendResponse(getDuplicateInfo());
    return false; // No async response needed
  } else if (request.action === 'refresh') {
    // Rebuild internal state from current tabs and update badge/storage
    initializeTabs().then(() => sendResponse({ ok: true })).catch(err => sendResponse({ ok: false, error: err && err.message }));
    return true; // async response
  } else if (request.action === 'closeDuplicates') {
    // Close all duplicate tabs for a specific URL
    const urlToClose = request.url;
    const tabsToClose = [];
    
    // Find all tabs with this URL (keep the first one)
    let keepFirst = true;
    for (const [tabId, url] of tabRegistry.entries()) {
      if (url === urlToClose) {
        if (keepFirst) {
          keepFirst = false;
        } else {
          tabsToClose.push(tabId);
        }
      }
    }
    
    // Close the duplicate tabs
    if (tabsToClose.length > 0) {
      chrome.tabs.remove(tabsToClose, () => {
        if (chrome.runtime.lastError) {
          console.error('Error closing tabs:', chrome.runtime.lastError);
          sendResponse({ closed: 0, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ closed: tabsToClose.length });
        }
      });
    } else {
      sendResponse({ closed: 0 });
    }
    return true; // Keep channel open for async response
  }
  
  return false; // Default: no async response needed
});

// Initialize when the service worker starts
initializeTabs();

console.log('Background service worker initialized');
