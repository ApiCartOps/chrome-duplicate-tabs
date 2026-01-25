/**
 * Test suite for countDuplicateTabs function
 * This duplicates the normalizeUrl function for testing purposes
 */

// Duplicate of normalizeUrl from background.js for testing
function normalizeUrl(url) {
  if (!url) return '';
  
  const hashIndex = url.indexOf('#');
  if (hashIndex !== -1) {
    return url.substring(0, hashIndex);
  }
  
  return url;
}

// Duplicate of countDuplicateTabs logic for testing
function countDuplicates(tabs) {
  const seenUrls = new Map();
  let duplicateCount = 0;
  
  for (const tab of tabs) {
    const normalizedUrl = normalizeUrl(tab.url);
    
    if (seenUrls.has(normalizedUrl)) {
      duplicateCount++;
    } else {
      seenUrls.set(normalizedUrl, tab.id);
    }
  }
  
  return duplicateCount;
}

// Test cases
const tests = [
  {
    name: 'No duplicates',
    tabs: [
      { id: 1, url: 'https://example.com' },
      { id: 2, url: 'https://google.com' },
      { id: 3, url: 'https://github.com' }
    ],
    expected: 0
  },
  {
    name: 'One duplicate',
    tabs: [
      { id: 1, url: 'https://example.com' },
      { id: 2, url: 'https://google.com' },
      { id: 3, url: 'https://example.com' }
    ],
    expected: 1
  },
  {
    name: 'Multiple duplicates',
    tabs: [
      { id: 1, url: 'https://example.com' },
      { id: 2, url: 'https://example.com' },
      { id: 3, url: 'https://google.com' },
      { id: 4, url: 'https://example.com' },
      { id: 5, url: 'https://google.com' }
    ],
    expected: 3
  },
  {
    name: 'Hash fragments treated as duplicates',
    tabs: [
      { id: 1, url: 'https://example.com#section1' },
      { id: 2, url: 'https://example.com#section2' },
      { id: 3, url: 'https://example.com' }
    ],
    expected: 2
  },
  {
    name: 'Empty tabs array',
    tabs: [],
    expected: 0
  },
  {
    name: 'All duplicates',
    tabs: [
      { id: 1, url: 'https://example.com' },
      { id: 2, url: 'https://example.com' },
      { id: 3, url: 'https://example.com' }
    ],
    expected: 2
  }
];

// Run tests
console.log('Running countDuplicateTabs tests...\n');
let passed = 0;
let failed = 0;

for (const test of tests) {
  const result = countDuplicates(test.tabs);
  const success = result === test.expected;
  
  if (success) {
    console.log(`✓ ${test.name}: PASSED`);
    passed++;
  } else {
    console.log(`✗ ${test.name}: FAILED`);
    console.log(`  Expected: ${test.expected}, Got: ${result}`);
    failed++;
  }
}

console.log(`\nTest Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
