# Publishing / Packaging Guides

This document describes how to package and publish the extension to the Chrome Web Store and Mozilla Add-ons (AMO).

## Chrome Web Store (CWS)

Prerequisites:
- A Chrome Web Store developer account
- OAuth2 client ID/secret and a refresh token or CWS API access

Suggested workflow:
1. Build a ZIP of the extension (exclude dev files):
   ```bash
   mkdir -p build
   zip -r build/jwd-browser-tab-manager.zip . -x "node_modules/*" ".git/*" "tests/*" "coverage/*" "docs/*" "scripts/*"
   ```
2. Upload and publish using a tool (examples):
   - `chrome-webstore-upload` or `webstore-upload` npm packages
   - Or use a small Node script to authenticate with OAuth and upload via the Chrome Web Store API

Example script placeholder (see `scripts/publish-chrome.sh`): contains an outline and where to add your credentials.

## Mozilla Add-ons (AMO)

Prerequisites:
- AMO API key & secret (JWT)

Basic approach:
1. Use `web-ext` to build and optionally upload/sign the extension:
   ```bash
   # build xpi locally
   npx web-ext build --source-dir . --artifacts-dir web-ext-artifacts

   # sign and upload to AMO (requires AMO credentials)
   npx web-ext sign --api-key $AMO_API_KEY --api-secret $AMO_API_SECRET --source-dir . --artifacts-dir web-ext-artifacts
   ```

**Note:** The repository contains `scripts/rename-repo.sh` to help rename the GitHub repo (if needed) and `scripts/publish-firefox.sh` and `scripts/publish-chrome.sh` example scripts for guidance.

---

If you want, I can also implement a full `publish` workflow script that uses your stored secrets and can be run locally or as a GitHub Actions workflow (requires storing secrets in the repo settings). Which would you prefer:

- Add GitHub Actions workflow for publish (requires secrets)?
- Add a Node-based publish script using `chrome-webstore-upload` and `web-ext` to fully automate?

Reply with which automation you'd like and I will implement it.