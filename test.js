/**
 * Test suite for duplicate tab detection
 * These tests verify the URL normalization and duplicate detection logic
 */

// Import the function we want to test
// Note: In a real Chrome extension, we'd need to structure this differently
// For testing purposes, we'll duplicate the function here

function normalizeUrl(url) {
  if (!url) return '';
  
  const hashIndex = url.indexOf('#');
  if (hashIndex !== -1) {
    return url.substring(0, hashIndex);
  }
  
  return url;
}

// Test cases for normalizeUrl
const tests = [
  {
    name: 'should remove hash fragment',
    url: 'https://example.com/page#section',
    expected: 'https://example.com/page'
  },
  {
    name: 'should handle URL without hash',
    url: 'https://example.com/page',
    expected: 'https://example.com/page'
  },
  {
    name: 'should handle URL with query params and hash',
    url: 'https://example.com/page?param=value#section',
    expected: 'https://example.com/page?param=value'
  },
  {
    name: 'should handle URL with multiple hashes (only first)',
    url: 'https://example.com/page#section#subsection',
    expected: 'https://example.com/page'
  },
  {
    name: 'should handle empty hash',
    url: 'https://example.com/page#',
    expected: 'https://example.com/page'
  },
  {
    name: 'should handle empty string',
    url: '',
    expected: ''
  },
  {
    name: 'should handle null/undefined',
    url: null,
    expected: ''
  }
];

// Run tests
let passed = 0;
let failed = 0;

console.log('Running normalizeUrl tests...\n');

tests.forEach(test => {
  const result = normalizeUrl(test.url);
  const success = result === test.expected;
  
  if (success) {
    passed++;
    console.log(`✓ ${test.name}`);
  } else {
    failed++;
    console.log(`✗ ${test.name}`);
    console.log(`  Expected: "${test.expected}"`);
    console.log(`  Got: "${result}"`);
  }
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('All tests passed! ✓');
} else {
  console.error(`${failed} test(s) failed`);
  process.exit(1);
}
