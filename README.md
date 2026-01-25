# Chrome Duplicate Tabs Manager

A modern Chrome extension for duplicating and managing browser tabs efficiently.

## Features

- 🔄 **Duplicate Current Tab** - Quickly duplicate the active tab
- 📑 **Duplicate All Tabs** - Duplicate all tabs in the current window at once
- 📁 **Duplicate to New Group** - Duplicate a tab and automatically organize it into a new tab group
- 📊 **Real-time Stats** - See current tab info and total tab count
- ✅ **Status Feedback** - Visual feedback for all operations

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **APIs Used**:
  - `chrome.tabs` - For tab duplication and management
  - `chrome.tabGroups` - For organizing duplicated tabs into groups
- **Code Quality**:
  - Modern ES6+ JavaScript (classes, async/await, arrow functions)
  - Concurrent operations using `Promise.allSettled()` for optimal performance
  - Clean, responsive UI with modern CSS gradients
  - No external dependencies

## Installation

### From Source

1. Clone this repository:
   ```bash
   git clone https://github.com/ApiCartOps/chrome-duplicate-tabs.git
   cd chrome-duplicate-tabs
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" using the toggle in the top right

4. Click "Load unpacked" and select the repository directory

5. The extension icon should appear in your browser toolbar

## Usage

1. Click the extension icon in your toolbar to open the popup
2. Choose from three actions:
   - **Duplicate Current Tab** - Duplicates the currently active tab
   - **Duplicate All Tabs** - Duplicates all tabs in the current window
   - **Duplicate to New Group** - Duplicates the current tab and creates a new tab group
3. Status messages will confirm successful operations

## File Structure

```
chrome-duplicate-tabs/
├── manifest.json       # Extension configuration (Manifest V3)
├── popup.html         # Extension popup UI
├── popup.css          # Styling for popup
├── popup.js           # Popup logic and tab management
├── background.js      # Background service worker
├── icons/             # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md          # This file
```

## Screenshots

![Extension UI](https://github.com/user-attachments/assets/7600684e-e66e-4db3-8314-702327be54d9)

## Development

The extension uses:
- Vanilla JavaScript (no build tools required)
- Modern ES6+ features
- Chrome Extension Manifest V3

To make changes:
1. Edit the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

## License

MIT License - feel free to use and modify as needed.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

