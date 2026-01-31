#!/usr/bin/env bash
# Example placeholder for Chrome Web Store publishing
# You can use 'chrome-webstore-upload' npm package or any custom script.
# Expects CHROME_CLIENT_ID, CHROME_CLIENT_SECRET and CHROME_REFRESH_TOKEN environment variables.

set -euo pipefail

if [ -z "${CHROME_REFRESH_TOKEN:-}" ] || [ -z "${CHROME_CLIENT_ID:-}" ] || [ -z "${CHROME_CLIENT_SECRET:-}" ]; then
  echo "Set CHROME_CLIENT_ID, CHROME_CLIENT_SECRET and CHROME_REFRESH_TOKEN"
  exit 1
fi

mkdir -p build
zip -r build/jwd-browser-tab-manager.zip . -x "node_modules/*" ".git/*" "tests/*" "coverage/*" "docs/*" "scripts/*"

echo "Created build/jwd-browser-tab-manager.zip — now upload using your preferred tool or the Chrome Web Store API"

# Example: use node module 'chrome-webstore-upload' (not installed by default)
# npx chrome-webstore-upload upload --file build/jwd-browser-tab-manager.zip --token "$CHROME_REFRESH_TOKEN" --client-id "$CHROME_CLIENT_ID" --client-secret "$CHROME_CLIENT_SECRET"

