// DOM elements
const totalTabsElement = document.getElementById('totalTabs');
const duplicateTabsElement = document.getElementById('duplicateTabs');
const tabsListElement = document.getElementById('tabsList');
const listAllTabsBtn = document.getElementById('listAllTabs');
const closeDuplicateTabsBtn = document.getElementById('closeDuplicateTabs');
const groupTabsByDomainBtn = document.getElementById('groupTabsByDomain');
const closeTabsExceptActiveBtn = document.getElementById('closeTabsExceptActive');

// Initialize the popup
async function init() {
  await updateStats();
  setupEventListeners();
}

// Update tab statistics
async function updateStats() {
  const tabs = await chrome.tabs.query({});
  const duplicates = findDuplicateTabs(tabs);
  
  totalTabsElement.textContent = tabs.length;
  duplicateTabsElement.textContent = duplicates.length;
}

// Find duplicate tabs by URL
function findDuplicateTabs(tabs) {
  const urlMap = new Map();
  const duplicates = [];
  
  tabs.forEach(tab => {
    if (tab.url) {
      if (urlMap.has(tab.url)) {
        // This is a duplicate
        duplicates.push(tab);
      } else {
        urlMap.set(tab.url, tab);
      }
    }
  });
  
  return duplicates;
}

// Get domain from URL
function getDomainFromUrl(url) {
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
  closeDuplicateTabsBtn.addEventListener('click', closeDuplicateTabs);
  groupTabsByDomainBtn.addEventListener('click', groupTabsByDomain);
  closeTabsExceptActiveBtn.addEventListener('click', closeTabsExceptActive);
}

// List all tabs
async function listAllTabs() {
  const tabs = await chrome.tabs.query({});
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
      chrome.tabs.update(tab.id, { active: true });
      chrome.windows.update(tab.windowId, { focused: true });
    });
    
    tabsListElement.appendChild(tabItem);
  });
}

// Close duplicate tabs
async function closeDuplicateTabs() {
  const tabs = await chrome.tabs.query({});
  const duplicates = findDuplicateTabs(tabs);
  
  if (duplicates.length === 0) {
    alert('No duplicate tabs found!');
    return;
  }
  
  const confirmMsg = `Are you sure you want to close ${duplicates.length} duplicate tab(s)?`;
  if (confirm(confirmMsg)) {
    const tabIds = duplicates.map(tab => tab.id);
    await chrome.tabs.remove(tabIds);
    await updateStats();
    
    // Update the list if it's shown
    if (tabsListElement.classList.contains('show')) {
      await listAllTabs();
    }
  }
}

// Group tabs by domain
async function groupTabsByDomain() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  
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
        const groupId = await chrome.tabs.group({ tabIds });
        
        // Update group title and color
        await chrome.tabGroups.update(groupId, {
          title: domain,
          color: getRandomColor()
        });
        
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
  const colors = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Close all tabs except the active one
async function closeTabsExceptActive() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
  
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
    await chrome.tabs.remove(tabIds);
    await updateStats();
    
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
