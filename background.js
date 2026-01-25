/**
 * Normalize URL by removing hash fragments
 * @param {string} url - The URL to normalize
 * @returns {string} - The normalized URL without hash
 */
function normalizeUrl(url) {
  if (!url) return '';
  
  // Remove hash fragment
  const hashIndex = url.indexOf('#');
  if (hashIndex !== -1) {
    return url.substring(0, hashIndex);
  }
  
  return url;
}

/**
 * Count duplicate tabs without closing them
 * @returns {number} - The number of duplicate tabs
 */
async function countDuplicateTabs() {
  try {
    // Get all tabs
    const tabs = await chrome.tabs.query({});
    
    // Track seen URLs (normalized)
    const seenUrls = new Map();
    let duplicateCount = 0;
    
    // Process tabs in order
    for (const tab of tabs) {
      const normalizedUrl = normalizeUrl(tab.url);
      
      if (seenUrls.has(normalizedUrl)) {
        // This is a duplicate
        duplicateCount++;
      } else {
        // First occurrence - keep it
        seenUrls.set(normalizedUrl, tab.id);
      }
    }
    
    return duplicateCount;
  } catch (error) {
    console.error('Error counting duplicate tabs:', error);
    return 0;
  }
}

/**
 * Update the extension badge with the duplicate count
 */
async function updateBadge() {
  const count = await countDuplicateTabs();
  
  if (count > 0) {
    chrome.action.setBadgeText({ text: count.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

/**
 * Find and close duplicate tabs
 * Keeps the first occurrence of each URL and closes the rest
 */
async function closeDuplicateTabs() {
  try {
    // Get all tabs
    const tabs = await chrome.tabs.query({});
    
    // Track seen URLs (normalized)
    const seenUrls = new Map();
    const tabsToClose = [];
    
    // Process tabs in order
    for (const tab of tabs) {
      const normalizedUrl = normalizeUrl(tab.url);
      
      if (seenUrls.has(normalizedUrl)) {
        // This is a duplicate - mark for closing
        tabsToClose.push(tab.id);
      } else {
        // First occurrence - keep it
        seenUrls.set(normalizedUrl, tab.id);
      }
    }
    
    // Close duplicate tabs
    if (tabsToClose.length > 0) {
      await chrome.tabs.remove(tabsToClose);
      console.log(`Closed ${tabsToClose.length} duplicate tab(s)`);
    } else {
      console.log('No duplicate tabs found');
    }
    
    // Update badge after closing duplicates
    await updateBadge();
  } catch (error) {
    console.error('Error closing duplicate tabs:', error);
  }
}

// Listen for extension icon click
chrome.action.onClicked.addListener(() => {
  closeDuplicateTabs();
});

// Listen for tab changes to update badge
chrome.tabs.onCreated.addListener(() => {
  updateBadge();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only update badge when URL changes to avoid unnecessary updates
  if (changeInfo.url) {
    updateBadge();
  }
});

chrome.tabs.onRemoved.addListener(() => {
  updateBadge();
});

// Initialize badge on startup
updateBadge();

console.log('Duplicate Tabs Manager initialized');
