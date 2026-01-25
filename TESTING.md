# Testing Instructions

## How to Load and Test the Extension

1. **Load the Extension in Chrome:**
   ```
   - Open Chrome
   - Navigate to chrome://extensions/
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the chrome-duplicate-tabs directory
   ```

2. **Test the Tab Listing:**
   ```
   - Open several tabs with different websites
   - Click the extension icon in the toolbar
   - Verify all tabs are listed with:
     * Favicon
     * Title
     * URL
   ```

3. **Test Tab Focusing:**
   ```
   - Click on any tab in the list
   - The extension should:
     * Switch to that tab
     * Bring the window to focus
     * Close the popup automatically
   ```

## Expected Behavior

- **Popup displays:** All open tabs across all Chrome windows
- **Tab items show:** Favicon (16x16), title (bold), and URL (gray)
- **Hover effect:** Light gray background on hover
- **Click action:** Focuses the clicked tab and its window
- **Fallback:** Default gray icon if favicon is missing or fails to load
- **Accessibility:** Screen readers can identify favicons with descriptive alt text

## File Structure

```
chrome-duplicate-tabs/
├── manifest.json       # Extension configuration
├── popup.html          # Popup UI structure
├── popup.css           # Styling
├── popup.js            # Tab listing logic
├── background.js       # Service worker
└── README.md           # Documentation
```

## Troubleshooting

**Q: Extension icon doesn't appear**
- Make sure developer mode is enabled
- Check that manifest.json is valid JSON

**Q: No tabs showing**
- Check browser console for errors
- Ensure tabs permission is granted

**Q: Favicons not loading**
- Normal - some sites don't have favicons
- Default gray icon will be used as fallback
