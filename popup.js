// Constants
const DUPLICATE_COUNT = 5;
const STATUS_TIMEOUT = 3000;

// Show status message
function showStatus(message, isError = false) {
  const statusElement = document.getElementById('status');
  statusElement.textContent = message;
  statusElement.className = isError ? 'status error' : 'status success';
  
  setTimeout(() => {
    statusElement.textContent = '';
    statusElement.className = 'status';
  }, STATUS_TIMEOUT);
}

// Duplicate current tab
async function duplicateCurrentTab(active = true) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      throw new Error('No active tab found');
    }
    
    await chrome.tabs.duplicate(tab.id, { active: active });
    
    const statusMessage = active 
      ? 'Tab duplicated successfully!' 
      : 'Tab duplicated in background!';
    showStatus(statusMessage);
  } catch (error) {
    showStatus('Error: ' + error.message, true);
  }
}

// Duplicate all tabs in current window
async function duplicateAllTabs() {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    
    if (!tabs || tabs.length === 0) {
      throw new Error('No tabs found');
    }
    
    // Duplicate each tab
    for (const tab of tabs) {
      await chrome.tabs.duplicate(tab.id, { active: false });
    }
    
    showStatus(`${tabs.length} tabs duplicated successfully!`);
  } catch (error) {
    showStatus('Error: ' + error.message, true);
  }
}

// Duplicate current tab multiple times
async function duplicateMultipleTimes(count = DUPLICATE_COUNT) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      throw new Error('No active tab found');
    }
    
    // Duplicate the tab multiple times
    for (let i = 0; i < count; i++) {
      await chrome.tabs.duplicate(tab.id, { active: false });
    }
    
    showStatus(`Tab duplicated ${count} times successfully!`);
  } catch (error) {
    showStatus('Error: ' + error.message, true);
  }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('duplicateCurrentTab').addEventListener('click', () => {
    duplicateCurrentTab(true);
  });
  
  document.getElementById('duplicateCurrentTabInBackground').addEventListener('click', () => {
    duplicateCurrentTab(false);
  });
  
  document.getElementById('duplicateAllTabs').addEventListener('click', () => {
    duplicateAllTabs();
  });
  
  document.getElementById('duplicateMultipleTimes').addEventListener('click', () => {
    duplicateMultipleTimes(DUPLICATE_COUNT);
  });
});
