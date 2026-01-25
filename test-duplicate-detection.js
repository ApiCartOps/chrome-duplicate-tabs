/**
 * Integration test for duplicate tab detection logic
 * Simulates the duplicate detection algorithm
 */

function normalizeUrl(url) {
  if (!url) return '';
  
  const hashIndex = url.indexOf('#');
  if (hashIndex !== -1) {
    return url.substring(0, hashIndex);
  }
  
  return url;
}

/**
 * Simulate finding duplicate tabs
 */
function findDuplicateTabs(tabs) {
  const seenUrls = new Map();
  const tabsToClose = [];
  
  for (const tab of tabs) {
    const normalizedUrl = normalizeUrl(tab.url);
    
    if (seenUrls.has(normalizedUrl)) {
      tabsToClose.push(tab.id);
    } else {
      seenUrls.set(normalizedUrl, tab.id);
    }
  }
  
  return tabsToClose;
}

// Test scenarios
const testScenarios = [
  {
    name: 'should keep first occurrence and close duplicates',
    tabs: [
      { id: 1, url: 'https://example.com/page' },
      { id: 2, url: 'https://example.com/page' },
      { id: 3, url: 'https://example.com/page' }
    ],
    expectedToClose: [2, 3]
  },
  {
    name: 'should treat URLs with different hashes as duplicates',
    tabs: [
      { id: 1, url: 'https://example.com/page#section1' },
      { id: 2, url: 'https://example.com/page#section2' },
      { id: 3, url: 'https://example.com/page' }
    ],
    expectedToClose: [2, 3]
  },
  {
    name: 'should not close tabs with different URLs',
    tabs: [
      { id: 1, url: 'https://example.com/page1' },
      { id: 2, url: 'https://example.com/page2' },
      { id: 3, url: 'https://example.com/page3' }
    ],
    expectedToClose: []
  },
  {
    name: 'should handle mixed scenarios',
    tabs: [
      { id: 1, url: 'https://example.com/page1' },
      { id: 2, url: 'https://example.com/page1#hash' },
      { id: 3, url: 'https://example.com/page2' },
      { id: 4, url: 'https://example.com/page1' },
      { id: 5, url: 'https://example.com/page2#section' }
    ],
    expectedToClose: [2, 4, 5]
  },
  {
    name: 'should handle single tab',
    tabs: [
      { id: 1, url: 'https://example.com/page' }
    ],
    expectedToClose: []
  },
  {
    name: 'should handle empty tabs array',
    tabs: [],
    expectedToClose: []
  }
];

// Run tests
let passed = 0;
let failed = 0;

console.log('Running duplicate detection tests...\n');

testScenarios.forEach(scenario => {
  const result = findDuplicateTabs(scenario.tabs);
  const success = JSON.stringify(result) === JSON.stringify(scenario.expectedToClose);
  
  if (success) {
    passed++;
    console.log(`✓ ${scenario.name}`);
  } else {
    failed++;
    console.log(`✗ ${scenario.name}`);
    console.log(`  Expected to close: [${scenario.expectedToClose.join(', ')}]`);
    console.log(`  Got: [${result.join(', ')}]`);
  }
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('All tests passed! ✓');
} else {
  console.error(`${failed} test(s) failed`);
  process.exit(1);
}
