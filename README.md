# 📌 Smart Tab Manager

A powerful Chrome Extension (Manifest V3) that helps you efficiently manage open tabs, detect and handle duplicate tabs, and organize your browsing experience.

## Features

- **Tab Statistics**: View total number of open tabs and duplicate tabs at a glance
- **List All Tabs**: See all your open tabs with duplicate indicators
- **Close Duplicate Tabs**: Automatically detect and close duplicate tabs with one click
- **Group Tabs by Domain**: Organize tabs by their domain names into tab groups
- **Close Tabs Except Active**: Quickly close all tabs except the one you're currently viewing

## Installation

### Install from Source

1. Clone this repository or download the source code
   ```bash
   git clone https://github.com/ApiCartOps/chrome-duplicate-tabs.git
   cd chrome-duplicate-tabs
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" by toggling the switch in the top right corner

4. Click "Load unpacked" button

5. Select the directory containing the extension files

6. The Smart Tab Manager extension should now appear in your extensions list

## Usage

1. **Click the extension icon** in your Chrome toolbar to open the popup

2. **View Statistics**: The popup displays:
   - Total number of open tabs
   - Number of duplicate tabs detected

3. **Use the action buttons**:
   - **✅ List All Tabs**: Shows all open tabs with duplicate indicators
   - **✅ Close Duplicate Tabs**: Removes all duplicate tabs (keeps one copy of each)
   - **✅ Group Tabs by Domain**: Creates tab groups organized by domain
   - **✅ Close Tabs Except Active One**: Closes all tabs except your current tab

## Permissions

This extension requires the following permissions:
- `tabs`: To access and manage your browser tabs
- `tabGroups`: To create and manage tab groups

## Development

The extension is built with vanilla JavaScript and uses Manifest V3 for modern Chrome extension development.

### File Structure
```
chrome-duplicate-tabs/
├── manifest.json       # Extension manifest (V3)
├── popup.html         # Popup UI structure
├── popup.css          # Popup styling
├── popup.js           # Popup functionality
└── icons/             # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
