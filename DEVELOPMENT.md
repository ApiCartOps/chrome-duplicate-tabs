# Development Guide

## Architecture Overview

### Background Service Worker (background.js)
The core of the extension that runs persistently in the background.

**Key Data Structures:**
- `tabRegistry`: Map<tabId, normalizedUrl> - Tracks all open tabs
- `urlCounts`: Map<normalizedUrl, count> - Counts tabs per URL
- `duplicateCount`: number - Total duplicate tabs count

**Event Listeners:**
1. `chrome.tabs.onCreated` - Fires when a new tab is created
2. `chrome.tabs.onUpdated` - Fires when a tab's properties update (including URL changes)
3. `chrome.tabs.onRemoved` - Fires when a tab is closed
4. `chrome.runtime.onMessage` - Handles messages from popup

**Key Functions:**
- `initializeTabs()` - Initializes on service worker start
- `addTab(tabId, url)` - Adds a tab to tracking
- `removeTab(tabId)` - Removes a tab from tracking
- `updateTab(tabId, url)` - Updates a tab's URL
- `normalizeUrl(url)` - Normalizes URLs for comparison
- `recalculateDuplicates()` - Recalculates duplicate count
- `updateBadge()` - Updates extension badge

### Popup Interface (popup.html, popup.js)
User interface for viewing and managing duplicates.

**Features:**
- Displays total duplicate count
- Lists URLs with duplicates
- Shows count per URL
- Provides "Close duplicates" functionality

**Communication:**
- Sends messages to background script via `chrome.runtime.sendMessage()`
- Receives duplicate information
- Triggers duplicate closure

## Key Implementation Details

### URL Normalization
URLs are normalized to ensure accurate duplicate detection:
```javascript
function normalizeUrl(url) {
  // Skip internal URLs
  // Remove hash/fragment
  // Remove trailing slash
  return normalizedUrl;
}
```

### Duplicate Counting Algorithm
For each URL that appears N times:
- Duplicates = N - 1 (keep one, rest are duplicates)

Example:
- URL1 appears 3 times → 2 duplicates
- URL2 appears 2 times → 1 duplicate
- Total duplicates = 3

### State Management
- State is maintained in memory (tabRegistry, urlCounts)
- Persisted to chrome.storage for popup access
- Recalculated on service worker restart

## Extension Lifecycle

1. **Service Worker Starts**
   - `initializeTabs()` queries all existing tabs
   - Builds initial registry and counts
   - Updates badge

2. **Tab Created**
   - Event fires with tab info
   - Tab added to registry
   - Counts updated
   - Badge refreshed

3. **Tab Updated**
   - Event fires with new URL
   - Old URL removed from counts
   - New URL added to counts
   - Badge refreshed

4. **Tab Closed**
   - Event fires with tab ID
   - Tab removed from registry
   - Counts updated
   - Badge refreshed

5. **Popup Opened**
   - Requests duplicate info from background
   - Displays results
   - User can close duplicates

## Permissions Required

### tabs
- Access to tab information
- Listen to tab events
- Query and manipulate tabs

### storage
- Store duplicate count and URL data
- Persist information for popup access

## Future Enhancements

Potential improvements:
1. Whitelist URLs to ignore
2. Group duplicates by domain
3. Auto-close duplicates on detection
4. Keyboard shortcuts
5. Statistics and history
6. Export duplicate list
7. Settings/preferences page
