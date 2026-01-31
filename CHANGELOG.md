# Changelog

## v1.0.0 - 2026-01-26

- Fix popup rendering by adding an `exec` compatibility wrapper and `updateStats` helper.
- Attach popup event listeners during initialization so buttons respond.
- Include original + duplicate tabs when rendering duplicate groups (fixes E2E expectations).
- Add `scripts/debug-popup-playwright.js` to aid Playwright debug runs.
- Improve popup styles to match design screenshots (card layout, stat tiles, badges).
