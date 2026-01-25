# Installation and Testing Guide

## How to Load the Extension in Chrome

### Step 1: Prepare the Extension
The extension files are ready to use as-is. No build process is required.

### Step 2: Load in Chrome
1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top-right corner
4. Click the "Load unpacked" button
5. Navigate to and select the `chrome-duplicate-tabs` directory
6. The extension should now appear in your extensions list and the icon should be visible in the toolbar

## How to Test the Extension

### Method 1: Using the Test Page
1. Open the `test.html` file in Chrome
2. Click one of the test buttons to open multiple tabs
3. Click the extension icon in your Chrome toolbar
4. Click "Group Tabs by Domain" in the popup
5. Observe that tabs are automatically grouped by their domain

### Method 2: Manual Testing
1. Open several tabs from different websites, for example:
   - Open 2-3 YouTube tabs (youtube.com)
   - Open 2-3 GitHub tabs (github.com)
   - Open 2-3 Google tabs (google.com)
2. Click the extension icon in your Chrome toolbar
3. Click "Group Tabs by Domain" button
4. Verify that:
   - All YouTube tabs are grouped together under "youtube.com"
   - All GitHub tabs are grouped together under "github.com"
   - All Google tabs are grouped together under "google.com"
   - Each group has a different color
   - Each group shows the hostname as its title

## Expected Behavior

When you click "Group Tabs by Domain":
- All tabs in the current window are analyzed
- Tabs with the same hostname are grouped together
- Each group is assigned a unique color (cycling through: grey, blue, red, yellow, green, pink, purple, cyan, orange)
- The group title is set to the hostname (e.g., "youtube.com", "github.com")
- Groups remain expanded (not collapsed) for easy access
- If tabs were already in groups, they are ungrouped first and then regrouped by domain
- A success message shows how many domain groups were created

## Troubleshooting

### Extension doesn't load
- Make sure you've enabled "Developer mode" in chrome://extensions/
- Verify that all required files are present (manifest.json, background.js, popup.html, popup.js, icons/)
- Check the Chrome console for any error messages

### Tabs don't group
- Make sure you're clicking the extension icon and then the "Group Tabs by Domain" button
- Check that the tabs you're trying to group have valid URLs (chrome:// URLs cannot be grouped)
- Open the extension's service worker console in chrome://extensions/ to see any error messages

### Permissions issues
- The extension requires "tabs" and "tabGroups" permissions
- These are declared in manifest.json and should be granted automatically when loading the extension

## Features Demonstrated

✅ Automatic grouping of tabs by hostname
✅ Color-coded tab groups for visual organization
✅ Clean, simple UI with one-click operation
✅ Support for multiple tabs from the same domain
✅ Proper handling of tabs already in groups
✅ Error handling and user feedback
