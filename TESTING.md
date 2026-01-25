# Testing Guide for Chrome Duplicate Tabs Manager

## Manual Testing Steps

### Setup
1. Load the extension in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select this directory

### Test 1: Tab Creation Detection
**Objective**: Verify the service worker detects new tabs

1. Open Chrome with the extension installed
2. Open a new tab (e.g., https://www.google.com)
3. Check the extension icon - badge should show "0" or be empty (no duplicates yet)
4. Open another tab with the same URL (https://www.google.com)
5. **Expected**: Badge should show "1" (one duplicate)
6. Open a third tab with the same URL
7. **Expected**: Badge should show "2" (two duplicates)

### Test 2: Tab Update Detection
**Objective**: Verify the service worker tracks URL changes

1. Open a tab with any URL
2. Navigate to a different URL in the same tab
3. If the new URL matches an existing tab, duplicate count should increase
4. **Expected**: Badge updates correctly

### Test 3: Tab Removal Detection
**Objective**: Verify duplicate count decreases when tabs are closed

1. Create duplicate tabs (as in Test 1)
2. Close one of the duplicate tabs
3. **Expected**: Badge count decreases by 1
4. Close all tabs of a duplicate URL
5. **Expected**: Badge updates or disappears when no duplicates remain

### Test 4: Popup Display
**Objective**: Verify popup shows correct information

1. Create several duplicate tabs with different URLs
2. Click the extension icon
3. **Expected**: 
   - Popup shows total duplicate count
   - Lists URLs with duplicates
   - Shows count for each URL
   - Displays "Close duplicates" buttons

### Test 5: Close Duplicates Function
**Objective**: Verify closing duplicates works correctly

1. Open 3 tabs with the same URL
2. Click the extension icon
3. Click "Close 2 duplicates" button for that URL
4. **Expected**: 
   - 2 tabs close (keeping 1)
   - Popup refreshes
   - Badge updates

### Test 6: URL Normalization
**Objective**: Verify URLs are normalized correctly

1. Open: `https://example.com`
2. Open: `https://example.com/`
3. Open: `https://example.com#section`
4. **Expected**: All three should be detected as duplicates (badge shows "2")

### Test 7: Background Service Worker Persistence
**Objective**: Verify the service worker maintains state

1. Create duplicate tabs
2. Wait a few minutes
3. **Expected**: Badge still shows correct count
4. Close and reopen Chrome
5. **Expected**: Extension reinitializes and recalculates duplicates

## Debugging

### View Service Worker Console
1. Go to `chrome://extensions/`
2. Find "Chrome Duplicate Tabs Manager"
3. Click "service worker" link under "Inspect views"
4. Console logs will show:
   - Tab creation events
   - Tab update events
   - Tab removal events
   - Duplicate counts

### Common Issues

**Badge not showing:**
- Check service worker console for errors
- Verify permissions in manifest.json

**Duplicates not detected:**
- Check URL normalization logic
- Verify tab events are firing (check console)

**Popup not loading:**
- Check for JavaScript errors in popup console
- Verify message passing between popup and background

## Expected Behavior Summary

✅ Badge shows duplicate count in real-time
✅ Count increases when duplicate tabs are created
✅ Count decreases when duplicate tabs are closed
✅ Popup lists all URLs with duplicates
✅ "Close duplicates" keeps one tab and closes others
✅ URLs with different fragments/trailing slashes are treated as duplicates
✅ Extension works after Chrome restart
