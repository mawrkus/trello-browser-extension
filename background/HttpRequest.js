// eslint-disable-next-line no-unused-vars
class HttpRequest {
  constructor({ storage }) {
    this.storage = storage;
    console.log('HttpClient', this);
  }

  async fetch(url, options = {}) {
    const response = await fetch(url, options);

    if (response.status >= 400) {
      console.error('Fetch error!', response);
      throw new Error(`HTTP error ${response.status}!`);
    }

    const data = await response.json();

    if (!options.method || options.method === 'GET') {
      this.storage.set(url, data, 'cache data').catch(() => {}); // fire & forget
    }

    return data;
  }

  async get(url, noCache = false) {
    if (noCache) {
      return this.fetch(url);
    }

    return new Promise((resolve, reject) => {
      this.storage.get(url)
        .then((data) => {
          if (data) {
            resolve(data);
            return;
          }
          throw new Error('No data available in storage!');
        })
        .catch(() => this.fetch(url).then(resolve).catch(reject));
    });
  }

  post(url) {
    return this.fetch(url, { method: 'POST' });
  }
}
