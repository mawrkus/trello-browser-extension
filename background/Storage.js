// eslint-disable-next-line no-unused-vars
class Storage {
  constructor({ notifier }) {
    this.storage = chrome.storage.local;
    this.notifier = notifier;
    console.log('Storage', this);
  }

  set(key, data, meta = 'data') {
    return new Promise((resolve, reject) => {
      this.storage.set({ [key]: { data } }, () => {
        if (!chrome.runtime.lastError) {
          resolve();
          return;
        }

        console.error('LocalStorage error!', chrome.runtime.lastError);

        this.notifier.error({
          type: 'LocalStorage error!',
          message: `Error while storing ${meta}: ${chrome.runtime.lastError.message}`,
        });

        reject(chrome.runtime.lastError);
      });
    });
  }

  get(key, meta = 'data') {
    return new Promise((resolve, reject) => {
      this.storage.get(key, ({ data }) => {
        if (!chrome.runtime.lastError) {
          resolve(data);
          return;
        }

        console.error('LocalStorage error!', chrome.runtime.lastError);

        this.notifier.error({
          type: 'LocalStorage error!',
          message: `Error while retrieving ${meta}: ${chrome.runtime.lastError.message}`,
        });

        reject(chrome.runtime.lastError);
      });
    });
  }
}
