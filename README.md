# Chrome Duplicate Tabs Manager

A Chrome extension that helps you organize your tabs by automatically grouping them by domain/hostname.

## Features

- **Group Tabs by Domain**: Automatically creates tab groups based on the hostname of each tab
- **Color-coded Groups**: Each domain gets a unique color for easy visual identification
- **One-click Organization**: Simple popup interface for instant tab organization

## Installation

### From Source

1. Clone this repository:
   ```bash
   git clone https://github.com/ApiCartOps/chrome-duplicate-tabs.git
   cd chrome-duplicate-tabs
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" using the toggle in the top right corner

4. Click "Load unpacked" and select the repository directory

5. The extension icon should now appear in your Chrome toolbar

## Usage

1. Click on the extension icon in your Chrome toolbar
2. Click the "Group Tabs by Domain" button
3. All tabs in the current window will be automatically grouped by their domain

### Example

If you have the following tabs open:
- youtube.com/video1
- youtube.com/video2
- github.com/repo1
- github.com/repo2
- google.com/search

After clicking "Group Tabs by Domain", they will be organized into three groups:
- **youtube.com** (containing both YouTube tabs)
- **github.com** (containing both GitHub tabs)
- **google.com** (containing the Google search tab)

## Permissions

This extension requires the following permissions:
- `tabs`: To access and manage browser tabs
- `tabGroups`: To create and manage tab groups

## Development

The extension consists of:
- `manifest.json`: Extension configuration
- `background.js`: Background service worker handling tab grouping logic
- `popup.html`: User interface HTML
- `popup.js`: Popup interaction logic
- `icons/`: Extension icons in various sizes

## License

MIT
