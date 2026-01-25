// Default favicon for tabs without a favicon
const DEFAULT_FAVICON = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" fill="%23e0e0e0"/></svg>';

document.addEventListener('DOMContentLoaded', async () => {
  const tabsList = document.getElementById('tabs-list');
  
  try {
    // Query all tabs across all windows
    const tabs = await chrome.tabs.query({});
    
    if (tabs.length === 0) {
      tabsList.innerHTML = '<div class="no-tabs">No tabs found</div>';
      return;
    }
    
    // Create a tab item for each tab
    tabs.forEach(tab => {
      const tabItem = document.createElement('div');
      tabItem.className = 'tab-item';
      
      // Create favicon image
      const favicon = document.createElement('img');
      // Use tab's favicon or a default icon if not available
      favicon.src = tab.favIconUrl || DEFAULT_FAVICON;
      favicon.alt = `Favicon for ${tab.title || 'Untitled'}`;
      // Fallback to default icon if favicon fails to load
      favicon.onerror = () => {
        favicon.src = DEFAULT_FAVICON;
      };
      
      // Create tab info container
      const tabInfo = document.createElement('div');
      tabInfo.className = 'tab-info';
      
      // Create title element
      const title = document.createElement('p');
      title.className = 'tab-title';
      title.textContent = tab.title || 'Untitled';
      title.title = tab.title || 'Untitled'; // Tooltip for full title
      
      // Create URL element
      const url = document.createElement('p');
      url.className = 'tab-url';
      url.textContent = tab.url || '';
      url.title = tab.url || ''; // Tooltip for full URL
      
      // Assemble the tab item
      tabInfo.appendChild(title);
      tabInfo.appendChild(url);
      tabItem.appendChild(favicon);
      tabItem.appendChild(tabInfo);
      
      // Add click handler to focus the tab
      tabItem.addEventListener('click', async () => {
        try {
          // First, update the tab to make it active
          await chrome.tabs.update(tab.id, { active: true });
          // Then, focus the window containing the tab
          await chrome.windows.update(tab.windowId, { focused: true });
          // Close the popup (it will close automatically on focus change)
        } catch (error) {
          console.error('Error focusing tab:', error);
        }
      });
      
      tabsList.appendChild(tabItem);
    });
  } catch (error) {
    console.error('Error loading tabs:', error);
    tabsList.innerHTML = '<div class="no-tabs">Error loading tabs</div>';
  }
});
