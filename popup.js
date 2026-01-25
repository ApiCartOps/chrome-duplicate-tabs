// Popup script for Chrome Duplicate Tabs Manager

/**
 * Load and display duplicate information
 */
async function loadDuplicateInfo() {
  try {
    // Request duplicate info from background script
    const response = await chrome.runtime.sendMessage({ action: 'getDuplicateInfo' });
    
    // Update stats
    document.getElementById('totalDuplicates').textContent = response.duplicateCount;
    document.getElementById('uniqueUrls').textContent = response.duplicates.length;
    
    // Display duplicate list
    displayDuplicates(response.duplicates);
  } catch (error) {
    console.error('Error loading duplicate info:', error);
    document.getElementById('content').innerHTML = 
      '<div class="loading">Error loading data</div>';
  }
}

/**
 * Display the list of duplicate URLs
 */
function displayDuplicates(duplicates) {
  const contentDiv = document.getElementById('content');
  
  if (duplicates.length === 0) {
    contentDiv.innerHTML = '<div class="no-duplicates">✓ No duplicate tabs found!</div>';
    return;
  }
  
  // Create list of duplicates
  const listDiv = document.createElement('div');
  listDiv.className = 'duplicate-list';
  
  duplicates.forEach(({ url, count }) => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'duplicate-item';
    
    // URL display
    const urlDiv = document.createElement('div');
    urlDiv.className = 'duplicate-url';
    urlDiv.textContent = url;
    
    // Info and action section
    const infoDiv = document.createElement('div');
    infoDiv.className = 'duplicate-info';
    
    const countSpan = document.createElement('span');
    countSpan.className = 'duplicate-count';
    countSpan.textContent = `${count} tabs`;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = `Close ${count - 1} duplicate${count - 1 > 1 ? 's' : ''}`;
    closeBtn.addEventListener('click', () => closeDuplicates(url));
    
    infoDiv.appendChild(countSpan);
    infoDiv.appendChild(closeBtn);
    
    itemDiv.appendChild(urlDiv);
    itemDiv.appendChild(infoDiv);
    
    listDiv.appendChild(itemDiv);
  });
  
  contentDiv.innerHTML = '';
  contentDiv.appendChild(listDiv);
}

/**
 * Close duplicate tabs for a specific URL
 */
async function closeDuplicates(url) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'closeDuplicates',
      url: url
    });
    
    console.log(`Closed ${response.closed} duplicate tabs for ${url}`);
    
    // Reload the duplicate info
    setTimeout(loadDuplicateInfo, 500);
  } catch (error) {
    console.error('Error closing duplicates:', error);
  }
}

// Load duplicate info when popup opens
document.addEventListener('DOMContentLoaded', loadDuplicateInfo);
