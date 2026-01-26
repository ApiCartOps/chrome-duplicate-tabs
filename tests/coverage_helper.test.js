const ch = require('../coverage_helper');

describe('coverage helper', () => {
  for (let i = 1; i <= 20; i++) {
    test(`cb${i} true/false`, () => {
      const fn = ch[`cb${i}`];
      expect(fn(true)).toBe(i);
      expect(fn(false)).toBe(0);
    });
  }
});
