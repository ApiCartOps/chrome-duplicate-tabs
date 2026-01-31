#!/usr/bin/env bash
# Helper script to rename the GitHub repository from
# ApiCartOps/chrome-duplicate-tabs -> ApiCartOps/jwd-browser-tab-manager
# Run locally as a repo admin. Requires:
# - curl and jq (or gh CLI)
# - GITHUB_TOKEN set in environment with repo scope OR gh authenticated

set -euo pipefail

NEW_NAME="jwd-browser-tab-manager"
OWNER="ApiCartOps"
OLD_NAME="chrome-duplicate-tabs"

if command -v gh >/dev/null 2>&1; then
  echo "Detected gh CLI — using it to rename repo"
  gh repo rename "$OWNER/$OLD_NAME" --new-name "$NEW_NAME"
  echo "Repository rename requested via gh CLI. Verify at: https://github.com/$OWNER/$NEW_NAME"
  exit 0
fi

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "GITHUB_TOKEN not set. Export a token with repo scope or install gh CLI and authenticate."
  exit 1
fi

API="https://api.github.com/repos/$OWNER/$OLD_NAME"

echo "Renaming $OWNER/$OLD_NAME -> $NEW_NAME using GitHub API"

resp=$(curl -s -X PATCH \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  $API \
  -d "{\"name\":\"$NEW_NAME\"}")

if echo "$resp" | grep -q 'Not Found'; then
  echo "Repository not found or token lacks permissions."
  echo "$resp" | sed -n '1,200p'
  exit 1
fi

if echo "$resp" | grep -q 'name"\s*:\s*"'$NEW_NAME'"'; then
  echo "Rename successful — verify at https://github.com/$OWNER/$NEW_NAME"
else
  echo "Unexpected response from GitHub API:"
  echo "$resp" | sed -n '1,200p'
  exit 1
fi
