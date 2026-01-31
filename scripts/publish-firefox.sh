#!/usr/bin/env bash
# Example: sign and upload to AMO using web-ext
# Expects AMO API key & secret in env vars: AMO_API_KEY, AMO_API_SECRET

set -euo pipefail

if [ -z "${AMO_API_KEY:-}" ] || [ -z "${AMO_API_SECRET:-}" ]; then
  echo "Set AMO_API_KEY and AMO_API_SECRET environment variables"
  exit 1
fi

mkdir -p web-ext-artifacts
npx web-ext sign --api-key "$AMO_API_KEY" --api-secret "$AMO_API_SECRET" --source-dir . --artifacts-dir web-ext-artifacts

echo "Artifacts in web-ext-artifacts/"