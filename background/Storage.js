export class Storage {
  constructor() {
    this.storage = chrome.storage.local;
  }

  async set(key, data) {
    // console.log("storage.set('%s', data)...", key);

    try {
      await this.storage.set({ [key]: data });
    } catch (error) {
      console.error("Storage.set('%s', data) error!", key, data);
      console.error(error);

      throw error;
    }
  }

  async get(key) {
    // console.log("storage.get('%s')...", key);

    try {
      const dataObject = await this.storage.get(key);

      return dataObject[key]; // storage always returns an object, even if not found
    } catch (error) {
      console.error("Storage.get('%s') error!", key);
      console.error(error);

      throw error;
    }
  }
}
