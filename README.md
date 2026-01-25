# Chrome Duplicate Tabs Manager

A Chrome extension for viewing and managing all your browser tabs.

## Features

- **Tab Listing View**: Display all open tabs with their title, favicon, and URL
- **Quick Navigation**: Click any tab to instantly focus and switch to it
- **Clean Interface**: Modern, user-friendly design with hover effects

## Installation

1. Clone this repository or download the files
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the directory containing the extension files
6. The extension icon will appear in your toolbar

## Usage

1. Click the extension icon in your Chrome toolbar
2. A popup will display all your open tabs across all windows
3. Each tab shows:
   - Favicon (website icon)
   - Page title
   - Full URL
4. Click any tab in the list to switch to it immediately

## Files

- `manifest.json` - Extension configuration and permissions
- `popup.html` - Main UI structure
- `popup.css` - Styling for the tab list
- `popup.js` - Tab querying and click handling logic
- `background.js` - Service worker (minimal for now)

## Development

This extension uses Chrome Extension Manifest V3.

Required permissions:
- `tabs` - To query and switch between tabs

## License

MIT
