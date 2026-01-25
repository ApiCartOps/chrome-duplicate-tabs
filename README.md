# chrome-duplicate-tabs
Duplicate tabs manager for Chrome browser

## Features

- **Duplicate Tab Detection**: Automatically identifies duplicate tabs based on URL
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

Click the extension icon in your Chrome toolbar to scan all open tabs and close duplicates. The extension will:
- Keep the first tab for each unique URL (ignoring hash fragments)
- Close all subsequent duplicates
- Log the number of tabs closed to the console

## How It Works

The extension uses the following logic:
1. Retrieves all open tabs
2. Normalizes each URL by removing hash fragments (`#section`)
3. Tracks the first occurrence of each normalized URL
4. Marks subsequent occurrences as duplicates
5. Closes all duplicate tabs in a single operation

## Development

### Running Tests

The repository includes tests for the core duplicate detection logic:

```bash
# Test URL normalization
node test.js

# Test duplicate detection algorithm
node test-duplicate-detection.js
```

### Files

- `manifest.json` - Chrome extension manifest
- `background.js` - Service worker with duplicate detection logic
- `test.js` - Tests for URL normalization
- `test-duplicate-detection.js` - Tests for duplicate detection algorithm

## License

MIT
