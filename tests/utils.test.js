const utils = require('../utils');

describe('utils', () => {
  test('findDuplicateTabs identifies duplicates by URL', () => {
    const tabs = [
      { id: 1, url: 'https://example.com' },
      { id: 2, url: 'https://example.com' },
      { id: 3, url: 'https://other.com' }
    ];
    const duplicates = utils.findDuplicateTabs(tabs);
    expect(Array.isArray(duplicates)).toBe(true);
    expect(duplicates.length).toBe(1);
    expect(duplicates[0].id).toBe(2);
  });

  test('getDomainFromUrl returns hostname or Unknown', () => {
    expect(utils.getDomainFromUrl('https://example.com/path')).toBe('example.com');
    expect(utils.getDomainFromUrl('not-a-url')).toBe('Unknown');
  });

  test('getRandomColor returns one of the allowed colors', () => {
    const color = utils.getRandomColor();
    const allowed = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
    expect(allowed).toContain(color);
  });
});
