# Chrome Duplicate Tabs Manager

A Chrome extension to detect, manage, and export duplicate tabs to CSV format.

## Features

- 🔍 **Automatic Duplicate Detection**: Scans all open tabs and identifies duplicates based on URL
- 📊 **Visual Display**: Shows duplicate tabs grouped by URL with tab details
- 💾 **CSV Export**: Download a comprehensive list of duplicate tabs in CSV format
- 🎨 **Clean UI**: Simple and intuitive popup interface

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right corner)
4. Click "Load unpacked"
5. Select the extension directory

## Usage

1. Click the extension icon in your Chrome toolbar
2. The extension will automatically scan for duplicate tabs when opened
3. View the list of duplicate tabs grouped by URL
4. Click "Download CSV" to export the duplicate tabs list

## CSV Export Format

The exported CSV file includes the following columns:
- **URL**: The web address of the tab
- **Title**: The page title
- **Tab ID**: Chrome's internal tab identifier
- **Window ID**: Chrome's internal window identifier  
- **Duplicate Count**: Number of tabs with the same URL

## Development

The extension consists of:
- `manifest.json`: Extension configuration
- `popup.html`: Popup UI structure
- `popup.css`: Popup styling
- `popup.js`: Main logic for duplicate detection and CSV export
- `icons/`: Extension icons (16x16, 48x48, 128x128)

## License

MIT
