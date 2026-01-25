// Background Service Worker for Chrome Duplicate Tabs Manager
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
  }
}

/**
 * Add a tab to the registry
 */
function addTab(tabId, url) {
  // Normalize URL (remove trailing slashes, fragments)
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
  
  // Update duplicate count
  recalculateDuplicates();
}

/**
 * Update a tab's URL in the registry
 */
function updateTab(tabId, newUrl) {
  // First remove the old URL
  removeTab(tabId);
  
  // Then add with new URL
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
        url.startsWith('about:') ||
        url.startsWith('edge://')) {
      return url;
    }
    
    // Parse and normalize the URL
    const urlObj = new URL(url);
    
    // Remove hash/fragment
    urlObj.hash = '';
    
    // Remove trailing slash from pathname
    if (urlObj.pathname.endsWith('/') && urlObj.pathname.length > 1) {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }
    
    return urlObj.toString();
  } catch (error) {
    // If URL parsing fails, return as-is
    return url;
  }
}

/**
 * Recalculate the total number of duplicate tabs
 */
function recalculateDuplicates() {
  duplicateCount = 0;
  
  // For each URL that appears more than once, count the extras as duplicates
  for (const [url, count] of urlCounts.entries()) {
    if (count > 1) {
      duplicateCount += (count - 1);
    }
  }
  
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
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

/**
 * Get duplicate information for the popup
 */
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
    return false; // Synchronous response
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
