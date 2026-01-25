// Popup script for user interaction

function showStatus(message, isSuccess) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = 'status visible ' + (isSuccess ? 'success' : 'error');
  
  // Hide status after 3 seconds
  setTimeout(() => {
    statusEl.classList.remove('visible');
  }, 3000);
}

// Group tabs by domain button handler
document.getElementById('groupByDomain').addEventListener('click', async () => {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'groupByDomain' });
    
    if (response.success) {
      showStatus(`Successfully grouped tabs into ${response.groupCount} domain groups!`, true);
    } else {
      showStatus(`Error: ${response.error}`, false);
    }
  } catch (error) {
    showStatus(`Error: ${error.message}`, false);
  }
});
