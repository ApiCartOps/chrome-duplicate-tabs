// Store the duplicate tabs data
let duplicateTabs = [];

// Get DOM elements
const scanButton = document.getElementById('scanButton');
const downloadCsvButton = document.getElementById('downloadCsvButton');
const statusDiv = document.getElementById('status');
const duplicatesList = document.getElementById('duplicatesList');

// Event listeners
scanButton.addEventListener('click', scanForDuplicates);
downloadCsvButton.addEventListener('click', downloadCsv);

// Scan for duplicate tabs
async function scanForDuplicates() {
  try {
    statusDiv.className = 'status info';
    statusDiv.textContent = 'Scanning for duplicate tabs...';
    duplicatesList.innerHTML = '';
    duplicateTabs = [];
    downloadCsvButton.disabled = true;

    // Get all tabs
    const tabs = await chrome.tabs.query({});
    
    // Group tabs by URL
    const tabsByUrl = new Map();
    tabs.forEach(tab => {
      if (!tabsByUrl.has(tab.url)) {
        tabsByUrl.set(tab.url, []);
      }
      tabsByUrl.get(tab.url).push(tab);
    });

    // Filter only duplicates (URLs with more than one tab)
    const duplicates = Array.from(tabsByUrl.entries())
      .filter(([url, tabs]) => tabs.length > 1)
      .map(([url, tabs]) => ({ url, tabs }));

    if (duplicates.length === 0) {
      statusDiv.className = 'status success';
      statusDiv.textContent = 'No duplicate tabs found!';
      return;
    }

    // Store duplicates for CSV export
    duplicateTabs = duplicates;

    // Display duplicates
    displayDuplicates(duplicates);

    // Enable CSV download button
    downloadCsvButton.disabled = false;

    statusDiv.className = 'status warning';
    statusDiv.textContent = `Found ${duplicates.length} set(s) of duplicate tabs`;
  } catch (error) {
    statusDiv.className = 'status warning';
    statusDiv.textContent = `Error: ${error.message}`;
  }
}

// Display duplicate tabs in the UI
function displayDuplicates(duplicates) {
  duplicatesList.innerHTML = '';

  duplicates.forEach(({ url, tabs }) => {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'duplicate-group';

    const header = document.createElement('h3');
    header.innerHTML = `Duplicate URL <span class="duplicate-count">${tabs.length} tabs</span>`;
    groupDiv.appendChild(header);

    const urlInfo = document.createElement('div');
    urlInfo.className = 'url-info';
    urlInfo.textContent = url;
    groupDiv.appendChild(urlInfo);

    tabs.forEach(tab => {
      const tabItem = document.createElement('div');
      tabItem.className = 'tab-item';
      
      const tabTitle = document.createElement('span');
      tabTitle.className = 'tab-title';
      tabTitle.textContent = tab.title || 'Untitled';
      
      const tabId = document.createElement('span');
      tabId.className = 'tab-id';
      tabId.textContent = `(Tab ID: ${tab.id})`;
      
      tabItem.appendChild(tabTitle);
      tabItem.appendChild(tabId);
      groupDiv.appendChild(tabItem);
    });

    duplicatesList.appendChild(groupDiv);
  });
}

// Download duplicate tabs as CSV
function downloadCsv() {
  if (duplicateTabs.length === 0) {
    return;
  }

  // Create CSV content
  const csvRows = [];
  
  // Add header row
  csvRows.push('URL,Title,Tab ID,Window ID,Duplicate Count');

  // Add data rows
  duplicateTabs.forEach(({ url, tabs }) => {
    const duplicateCount = tabs.length;
    tabs.forEach(tab => {
      const row = [
        escapeCSV(url),
        escapeCSV(tab.title || 'Untitled'),
        tab.id,
        tab.windowId,
        duplicateCount
      ];
      csvRows.push(row.join(','));
    });
  });

  const csvContent = csvRows.join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `duplicate-tabs-${timestamp}.csv`;
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);

  // Update status
  statusDiv.className = 'status success';
  statusDiv.textContent = `CSV file "${filename}" downloaded successfully!`;
}

// Escape CSV fields to handle commas, quotes, and newlines
function escapeCSV(field) {
  if (field == null) {
    return '';
  }
  
  const stringField = String(field);
  
  // If field contains comma, quote, or newline, wrap in quotes and escape existing quotes
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  
  return stringField;
}

// Run initial scan when popup opens
scanForDuplicates();
