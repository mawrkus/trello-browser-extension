export class Scripting {
  constructor() {
    this.scripting = chrome.scripting;
  }

  async executeScript(tabId, file) {
    const [{ result }] = await this.scripting.executeScript({
      target: { tabId },
      files: [file],
    });

    return result;
  }
}
