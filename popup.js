// ES6 Modern JavaScript for Popup
class TabManager {
  constructor() {
    this.currentTab = null;
    this.init();
  }

  async init() {
    await this.loadCurrentTabInfo();
    this.attachEventListeners();
  }

  attachEventListeners() {
    document.getElementById('duplicateCurrentTab').addEventListener('click', () => {
      this.duplicateCurrentTab();
    });

    document.getElementById('duplicateAllTabs').addEventListener('click', () => {
      this.duplicateAllTabs();
    });

    document.getElementById('duplicateToGroup').addEventListener('click', () => {
      this.duplicateToGroup();
    });
  }

  async loadCurrentTabInfo() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;
      
      // Update UI with current tab info
      document.getElementById('currentTabInfo').textContent = tab.title || 'No title';
      
      // Get total tabs count
      const allTabs = await chrome.tabs.query({ currentWindow: true });
      document.getElementById('totalTabs').textContent = allTabs.length;
    } catch (error) {
      this.showStatus('Error loading tab info', 'error');
      console.error('Error loading tab info:', error);
    }
  }

  async duplicateCurrentTab() {
    try {
      if (!this.currentTab) {
        await this.loadCurrentTabInfo();
      }

      const duplicatedTab = await chrome.tabs.duplicate(this.currentTab.id);
      this.showStatus(`✓ Tab duplicated successfully!`, 'success');
      
      // Update tab count
      await this.loadCurrentTabInfo();
    } catch (error) {
      this.showStatus('Failed to duplicate tab', 'error');
      console.error('Error duplicating tab:', error);
    }
  }

  async duplicateAllTabs() {
    try {
      const allTabs = await chrome.tabs.query({ currentWindow: true });
      let duplicatedCount = 0;

      for (const tab of allTabs) {
        try {
          await chrome.tabs.duplicate(tab.id);
          duplicatedCount++;
        } catch (error) {
          console.error(`Error duplicating tab ${tab.id}:`, error);
        }
      }

      this.showStatus(`✓ Duplicated ${duplicatedCount} tab(s)!`, 'success');
      await this.loadCurrentTabInfo();
    } catch (error) {
      this.showStatus('Failed to duplicate tabs', 'error');
      console.error('Error duplicating all tabs:', error);
    }
  }

  async duplicateToGroup() {
    try {
      if (!this.currentTab) {
        await this.loadCurrentTabInfo();
      }

      // Duplicate the current tab
      const duplicatedTab = await chrome.tabs.duplicate(this.currentTab.id);
      
      // Create a new tab group
      const groupId = await chrome.tabs.group({
        tabIds: [duplicatedTab.id]
      });

      // Update the group with a title and color
      await chrome.tabGroups.update(groupId, {
        title: 'Duplicated Tabs',
        color: 'blue'
      });

      this.showStatus('✓ Tab duplicated to new group!', 'success');
      await this.loadCurrentTabInfo();
    } catch (error) {
      this.showStatus('Failed to create group', 'error');
      console.error('Error duplicating to group:', error);
    }
  }

  showStatus(message, type) {
    const statusElement = document.getElementById('statusMessage');
    statusElement.textContent = message;
    statusElement.className = `status-message ${type}`;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      statusElement.textContent = '';
      statusElement.className = 'status-message';
    }, 3000);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new TabManager();
});
