# Chrome Duplicate Tabs Manager

A Chrome extension that tracks and manages duplicate tabs in your browser.

## Features

- **Background Service Worker**: Continuously monitors tab creation and updates
- **Live Duplicate Count**: Real-time tracking of duplicate tabs
- **Badge Notification**: Shows the number of duplicate tabs on the extension icon
- **Popup Interface**: View all duplicate URLs and close duplicates with one click
- **Smart URL Matching**: Normalizes URLs to detect duplicates accurately

## Installation

### Load Unpacked Extension (for development/testing)

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right)
4. Click "Load unpacked"
5. Select the `chrome-duplicate-tabs` directory
6. The extension is now active!

## How It Works

### Background Service Worker (`background.js`)

The background service worker listens for:
- **Tab creation events** (`chrome.tabs.onCreated`): Tracks new tabs as they are opened
- **Tab update events** (`chrome.tabs.onUpdated`): Monitors URL changes in existing tabs
- **Tab removal events** (`chrome.tabs.onRemoved`): Updates the count when tabs are closed

The service worker maintains:
- A registry of all open tabs and their URLs
- A count of how many tabs share each URL
- A live duplicate count displayed on the extension badge

### Duplicate Detection

URLs are normalized before comparison to ensure accurate duplicate detection:
- Removes URL fragments (hash)
- Removes trailing slashes
- Handles standard protocols (http, https)
- Skips internal URLs (chrome://, about:, etc.)

### Popup Interface

Click the extension icon to:
- View total duplicate count
- See a list of URLs with duplicates
- Close duplicate tabs (keeps one copy)

## File Structure

```
chrome-duplicate-tabs/
├── manifest.json       # Extension configuration
├── background.js       # Background service worker
├── popup.html         # Popup UI
├── popup.js           # Popup logic
├── icons/             # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md          # This file
```

## Testing

1. Load the extension as described above
2. Open multiple tabs with the same URL (e.g., open google.com twice)
3. Check the extension badge - it should show the duplicate count
4. Click the extension icon to see the popup
5. Use the "Close duplicates" button to close extra tabs

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Permissions**: 
  - `tabs`: Access to tab information and events
  - `storage`: Store duplicate count data
- **Service Worker**: Persistent background script for event handling
- **APIs Used**: 
  - `chrome.tabs.*`: Tab management
  - `chrome.action.*`: Badge and icon management
  - `chrome.storage.*`: Data persistence
  - `chrome.runtime.*`: Message passing

## License

MIT
