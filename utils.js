;(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.utils = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  function findDuplicateTabs(tabs) {
    const urlMap = new Map();
    const duplicates = [];
    tabs.forEach(tab => {
      if (tab && tab.url) {
        /* istanbul ignore next */
        if (urlMap.has(tab.url)) {
          duplicates.push(tab);
        } else {
          urlMap.set(tab.url, tab);
        }
      }
    });
    return duplicates;
  }

  function getDomainFromUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return 'Unknown';
    }
  }

  function getRandomColor() {
    const colors = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  return {
    findDuplicateTabs,
    getDomainFromUrl,
    getRandomColor
  };
});
