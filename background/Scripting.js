// eslint-disable-next-line no-unused-vars
class Scripting {
  constructor() {
    // manifest v2, changes in v3
    // See https://developer.chrome.com/blog/crx-scripting-api/
    this.scripting = chrome.tabs;
    console.log('Scripting', this);
  }

  executeScript(tabId, options) {
    return new Promise((resolve) => {
      this.scripting.executeScript(tabId, options, (results) => {
        resolve(results);
      });
    });
  }
}
