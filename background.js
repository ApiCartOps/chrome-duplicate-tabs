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
  } catch (error) {
    console.error('Error closing duplicate tabs:', error);
  }
}

// Listen for extension icon click
chrome.action.onClicked.addListener(() => {
  closeDuplicateTabs();
});

console.log('Duplicate Tabs Manager initialized');
