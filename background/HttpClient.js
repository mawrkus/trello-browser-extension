export class HttpClient {
  constructor({ baseUrl, storage }) {
    this.baseUrl = baseUrl;
    this.storage = storage;
  }

  async buildUrl(relativeUrl) {
    const credentials = await this.storage.get('credentials').catch((error) => {
      console.error('Error while retrieving credentials!');
      console.error(error);
      return null;
    });

    if (!credentials) {
      console.error('No credentials found!');
      throw new Error('No API key/token!');
    }

    const credentialsParams = new URLSearchParams(credentials);

    const url = new URL(relativeUrl, this.baseUrl);

    return new URL(
      `${url.origin}${url.pathname}?${new URLSearchParams([
        ...Array.from(url.searchParams.entries()),
        ...credentialsParams.entries(),
      ])}`,
    );
  }

  async fetch(relativeUrl, options = {}) {
    const url = await this.buildUrl(relativeUrl);

    // console.log('HttpClient.fetch', url, options);

    const response = await fetch(url, options);

    if (response.status >= 400) {
      console.error('Fetch error!', response);

      throw new Error(`HTTP error ${response.status}!`);
    }

    return response.json();
  }

  async get(relativeUrl) {
    return this.fetch(relativeUrl);
  }

  post(relativeUrl) {
    return this.fetch(relativeUrl, { method: 'POST' });
  }
}
