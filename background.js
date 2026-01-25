// Background Service Worker for Manifest V3
// This runs in the background and handles extension lifecycle events

// Log when extension is installed or updated
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed or updated:', details.reason);
  
  if (details.reason === 'install') {
    console.log('Thank you for installing Chrome Duplicate Tabs Manager!');
  } else if (details.reason === 'update') {
    console.log('Extension updated to version:', chrome.runtime.getManifest().version);
  }
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in background:', message);
  
  // Handle different message types
  if (message.action === 'duplicateTab') {
    handleDuplicateTab(message.tabId)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
  
  if (message.action === 'duplicateToGroup') {
    handleDuplicateToGroup(message.tabId)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Function to handle tab duplication
async function handleDuplicateTab(tabId) {
  try {
    const duplicatedTab = await chrome.tabs.duplicate(tabId);
    console.log('Tab duplicated:', duplicatedTab);
    return duplicatedTab;
  } catch (error) {
    console.error('Error duplicating tab:', error);
    throw error;
  }
}

// Function to duplicate tab and add to a group
async function handleDuplicateToGroup(tabId) {
  try {
    // Duplicate the tab
    const duplicatedTab = await chrome.tabs.duplicate(tabId);
    
    // Create a new group with the duplicated tab
    const groupId = await chrome.tabs.group({
      tabIds: [duplicatedTab.id]
    });
    
    // Update group properties
    await chrome.tabGroups.update(groupId, {
      title: 'Duplicated Tabs',
      color: 'blue'
    });
    
    console.log('Tab duplicated to group:', { duplicatedTab, groupId });
    return { duplicatedTab, groupId };
  } catch (error) {
    console.error('Error duplicating to group:', error);
    throw error;
  }
}

// Handle tab group events
chrome.tabGroups.onCreated.addListener((group) => {
  console.log('Tab group created:', group);
});

chrome.tabGroups.onUpdated.addListener((group) => {
  console.log('Tab group updated:', group);
});

chrome.tabGroups.onRemoved.addListener((group) => {
  console.log('Tab group removed:', group);
});

// Keep service worker alive (optional, for debugging)
console.log('Background service worker loaded');
