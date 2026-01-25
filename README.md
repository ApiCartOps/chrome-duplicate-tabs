# Chrome Duplicate Tabs Manager

A simple and elegant Chrome extension for duplicating and managing your browser tabs. No external dependencies required!

## Features

- 📋 **Duplicate Current Tab** - Clone the active tab instantly
- 🔇 **Duplicate in Background** - Create a duplicate without switching to it
- 📚 **Duplicate All Tabs** - Clone all tabs in the current window
- ✖️ **Duplicate Multiple Times** - Create multiple copies of the current tab at once

## Installation Instructions

### Load Extension Manually in Chrome

1. **Download or Clone** this repository to your local machine

2. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions` in your Chrome browser
   - Or click the three-dot menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load Unpacked Extension**
   - Click the "Load unpacked" button
   - Navigate to the directory containing this extension
   - Select the folder and click "Select Folder" (or "Open" on Mac)

5. **Pin the Extension** (Optional)
   - Click the puzzle piece icon in Chrome's toolbar
   - Find "Duplicate Tabs Manager" and click the pin icon

## Usage

1. Click the extension icon in your Chrome toolbar
2. Choose one of the available options:
   - **Duplicate Current Tab** - Creates an active duplicate of your current tab
   - **Duplicate in Background** - Creates a duplicate without switching to it
   - **Duplicate All Tabs** - Duplicates all tabs in the current window
   - **Duplicate Current 5 Times** - Creates 5 copies of the current tab

## Files Structure

```
chrome-duplicate-tabs/
├── manifest.json       # Extension configuration
├── popup.html          # Extension popup UI
├── popup.css           # Styling for the popup
├── popup.js            # Tab duplication logic
├── icon48.png          # 48x48 extension icon
├── icon128.png         # 128x128 extension icon
└── README.md           # This file
```

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Permissions**: Only requires `tabs` permission
- **No External Dependencies**: Pure HTML, CSS, and JavaScript
- **Browser Support**: Chrome, Edge, and other Chromium-based browsers

## Development

This extension uses vanilla JavaScript and requires no build process. To modify:

1. Edit the source files directly
2. Go to `chrome://extensions`
3. Click the refresh icon on the extension card to reload changes

## License

MIT License - Feel free to use and modify as needed!
