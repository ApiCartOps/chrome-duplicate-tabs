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

// Handle tab group events for debugging/logging
chrome.tabGroups.onCreated.addListener((group) => {
  console.log('Tab group created:', group);
});

chrome.tabGroups.onUpdated.addListener((group) => {
  console.log('Tab group updated:', group);
});

chrome.tabGroups.onRemoved.addListener((group) => {
  console.log('Tab group removed:', group);
});

console.log('Background service worker loaded');
