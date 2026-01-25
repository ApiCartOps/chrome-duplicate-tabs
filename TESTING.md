# Testing Guide for Duplicate Tabs Manager Extension

## Prerequisites
- Google Chrome browser (or any Chromium-based browser like Edge, Brave, etc.)
- The extension loaded via `chrome://extensions` → Developer Mode → Load Unpacked

## Test Cases

### Test 1: Duplicate Current Tab (Active)
1. Open any website (e.g., https://example.com)
2. Click the extension icon
3. Click "Duplicate Current Tab" button
4. **Expected**: A new tab opens with the same URL and becomes active
5. **Expected**: Status message shows "Tab duplicated successfully!"

### Test 2: Duplicate in Background
1. Open any website
2. Click the extension icon
3. Click "Duplicate in Background" button
4. **Expected**: A new tab is created but you stay on the current tab
5. **Expected**: Status message shows "Tab duplicated in background!"

### Test 3: Duplicate All Tabs
1. Open multiple tabs (e.g., 3-5 different websites)
2. Click the extension icon
3. Click "Duplicate All Tabs" button
4. **Expected**: All tabs are duplicated in the same order
5. **Expected**: Status message shows "X tabs duplicated successfully!" where X is the number of tabs

### Test 4: Duplicate Current 5 Times
1. Open any website
2. Click the extension icon
3. Click "Duplicate Current 5 Times" button
4. **Expected**: 5 new tabs are created with the same URL
5. **Expected**: All new tabs open in the background
6. **Expected**: Status message shows "Tab duplicated 5 times successfully!"

### Test 5: UI/UX Testing
1. Click the extension icon
2. **Expected**: Popup opens with a beautiful gradient purple background
3. **Expected**: Four buttons are visible with appropriate icons
4. **Expected**: All buttons are clickable and show hover effects
5. Hover over each button
6. **Expected**: Buttons animate upward slightly and show enhanced shadow

### Test 6: Error Handling
1. Try to use the extension when no tabs are open (edge case)
2. **Expected**: Appropriate error message is displayed

## Visual Verification

### Extension Icon
- Icon should appear in the Chrome toolbar
- Icon should show overlapping documents (representing duplication)
- Icon should have a purple gradient background

### Popup Interface
- Width: 320-400px
- Background: Purple gradient (from #667eea to #764ba2)
- Buttons: 4 distinct buttons with different gradient colors
- Typography: Clean, modern sans-serif font
- Status messages: Appear below buttons with green (success) or red (error) background

## Manual Testing Checklist

- [ ] Extension loads without errors
- [ ] Extension icon appears in toolbar
- [ ] Popup opens when clicking icon
- [ ] "Duplicate Current Tab" creates active duplicate
- [ ] "Duplicate in Background" creates inactive duplicate
- [ ] "Duplicate All Tabs" duplicates all tabs
- [ ] "Duplicate Current 5 Times" creates 5 duplicates
- [ ] Status messages appear and disappear after 3 seconds
- [ ] Hover effects work on all buttons
- [ ] No console errors appear (check DevTools)
- [ ] Works on different websites (http, https, chrome://)
- [ ] Extension permissions are minimal (only "tabs")

## Performance Testing

1. Test with many tabs open (20+)
   - "Duplicate All Tabs" should complete without freezing
   - All tabs should be duplicated correctly

2. Test rapid clicking
   - Click "Duplicate Current Tab" multiple times quickly
   - Each click should create a new tab

## Browser Compatibility

This extension should work on:
- ✅ Google Chrome (v88+)
- ✅ Microsoft Edge (v88+)
- ✅ Brave Browser
- ✅ Opera
- ✅ Any Chromium-based browser supporting Manifest V3

## Troubleshooting

If the extension doesn't work:
1. Check `chrome://extensions` for error messages
2. Ensure Developer Mode is enabled
3. Try reloading the extension
4. Check browser console for errors (F12)
5. Verify all files are present in the extension directory

## Security Notes

- Extension only requests "tabs" permission
- No data is collected or transmitted
- No external network requests are made
- All code runs locally in the browser
