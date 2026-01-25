// Background service worker for tab grouping functionality

// Extract hostname from URL
function getHostname(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return null;
  }
}

// Group all tabs by domain
async function groupTabsByDomain() {
  try {
    // Get all tabs in the current window
    const tabs = await chrome.tabs.query({ currentWindow: true });
    
    // Group tabs by hostname
    const tabsByHostname = {};
    
    for (const tab of tabs) {
      const hostname = getHostname(tab.url);
      if (!hostname) continue; // Skip invalid URLs
      
      if (!tabsByHostname[hostname]) {
        tabsByHostname[hostname] = [];
      }
      tabsByHostname[hostname].push(tab.id);
    }
    
    // Create tab groups for each hostname
    for (const [hostname, tabIds] of Object.entries(tabsByHostname)) {
      // Only group if there are tabs for this hostname
      if (tabIds.length > 0) {
        try {
          // Check if tabs are already in a group
          const firstTab = tabs.find(t => t.id === tabIds[0]);
          
          // Ungroup tabs if they're in different groups
          for (const tabId of tabIds) {
            const tab = tabs.find(t => t.id === tabId);
            if (tab.groupId !== -1) {
              await chrome.tabs.ungroup(tabId);
            }
          }
          
          // Create a new group for these tabs
          const groupId = await chrome.tabs.group({ tabIds });
          
          // Generate a color for the group (cycle through available colors)
          const colors = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
          const colorIndex = Object.keys(tabsByHostname).indexOf(hostname) % colors.length;
          
          // Update the group with hostname as title and a color
          await chrome.tabGroups.update(groupId, {
            title: hostname,
            color: colors[colorIndex],
            collapsed: false
          });
        } catch (error) {
          console.error(`Error grouping tabs for ${hostname}:`, error);
        }
      }
    }
    
    return { success: true, groupCount: Object.keys(tabsByHostname).length };
  } catch (error) {
    console.error('Error in groupTabsByDomain:', error);
    return { success: false, error: error.message };
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'groupByDomain') {
    groupTabsByDomain().then(sendResponse);
    return true; // Keep the message channel open for async response
  }
});
