#!/usr/bin/env bash
# Scan the repository for class-like tokens used in HTML/JS that are not present in dist/tailwind.css
# This helps identify legacy selectors that might need migration or removal.

set -euo pipefail

OUT=tmp/legacy-css-report.txt
rm -f "$OUT"
mkdir -p tmp

# Extract class tokens from HTML/JS (elements like class="..." and usage in JS templates)
# Collect class="..." attributes
grep -rho --exclude-dir=node_modules 'class="[^\"]*"' . | sed -E 's/class="(.*)"/\1/' > tmp/class-attr.txt || true
# Collect className='...' or className="..."
grep -rho --exclude-dir=node_modules -E "className='[^']*'|className=\"[^\"]*\"" . | sed -E "s/className='([^']*)'/\\1/; s/className=\"([^\"]*)\"/\\1/" >> tmp/class-attr.txt || true
# Collect className using backticks (template literals)
grep -rho --exclude-dir=node_modules -E 'className=`[^`]*`' . | sed -E 's/className=`([^`]*)`/\1/' >> tmp/class-attr.txt || true
# Split tokens by whitespace and commas into individual class names
cat tmp/class-attr.txt | tr '\t' ' ' | tr ',' '\n' | tr ' ' '\n' | grep -v '^$' | sed 's/^\.//' | sort -u > tmp/all-classes.txt || true

# Extract classes/selectors from dist/tailwind.css
grep -oP "\.[A-Za-z0-9_-]+" dist/tailwind.css | sed 's/^\.//' | sort -u > tmp/dist-classes.txt || true

# Show classes used but not present in dist
comm -23 tmp/all-classes.txt tmp/dist-classes.txt > "$OUT" || true

if [ -s "$OUT" ]; then
  echo "Found potential legacy or missing classes (see $OUT):"
  sed -n '1,200p' "$OUT"
  echo "\nLegend: These tokens appear as classes in source but are not found in dist/tailwind.css. Consider migrating or removing them."
  exit 0
else
  echo "No missing classes detected relative to dist/tailwind.css."
fi
