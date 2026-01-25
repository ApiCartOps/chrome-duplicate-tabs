# chrome-duplicate-tabs
Duplicate tabs manager for Chrome browser

## Features

- **Duplicate Tab Detection**: Automatically identifies duplicate tabs based on URL
- **Live Duplicate Count Badge**: Shows the number of duplicate tabs on the extension icon in real-time
- **Hash Fragment Handling**: Treats URLs with different hash fragments as duplicates (e.g., `example.com#section1` and `example.com#section2` are considered the same)
- **Smart Closing**: Keeps the first occurrence of each URL and closes all duplicates
- **Manual Trigger**: Click the extension icon to scan and close duplicate tabs

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the repository folder
5. The extension is now installed and ready to use

## Usage

The extension continuously monitors your tabs and displays a red badge on the extension icon showing the count of duplicate tabs found.

Click the extension icon in your Chrome toolbar to scan all open tabs and close duplicates. The extension will:
- Show the count of duplicate tabs on the extension icon badge
- Keep the first tab for each unique URL (ignoring hash fragments)
- Close all subsequent duplicates when you click the icon
- Log the number of tabs closed to the console
- Update the badge count automatically after closing duplicates

## How It Works

The extension uses the following logic:
1. Continuously monitors tab creation, updates, and removal
2. Counts duplicate tabs and displays the count on the extension icon badge
3. When you click the icon:
   - Retrieves all open tabs
   - Normalizes each URL by removing hash fragments (`#section`)
   - Tracks the first occurrence of each normalized URL
   - Marks subsequent occurrences as duplicates
   - Closes all duplicate tabs in a single operation
   - Updates the badge to reflect the new count

## Development

### Running Tests

The repository includes tests for the core duplicate detection logic:

```bash
# Test URL normalization
node test.js

# Test duplicate detection algorithm
node test-duplicate-detection.js

# Test duplicate counting logic
node test-count-duplicates.js
```

### Files

- `manifest.json` - Chrome extension manifest
- `background.js` - Service worker with duplicate detection logic and badge management
- `test.js` - Tests for URL normalization
- `test-duplicate-detection.js` - Tests for duplicate detection algorithm
- `test-count-duplicates.js` - Tests for duplicate counting logic

## License

MIT
