export class HttpClient {
  constructor({ baseUrl, cacheClient }) {
    this.baseUrl = baseUrl;
    this.cacheClient = cacheClient;
  }

  async buildUrl(relativeUrl) {
    const credentials = await this.cacheClient.get('credentials').catch((error) => {
      console.error('Error while trying retrieving credentials!');
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

    const data = await response.json();

    if (!options.method || options.method.toUpperCase() === 'GET') {
      const cacheKey = relativeUrl;

      this.cacheClient.set(cacheKey, data).catch(() => {}); // fire & forget
    }

    return data;
  }

  async get(relativeUrl, forceCacheRefresh = false) {
    if (forceCacheRefresh) {
      return this.fetch(relativeUrl);
    }

    const cacheKey = relativeUrl;

    return this.cacheClient
      .get(cacheKey)
      .then((data) => {
        if (data) {
          // console.log(
          //   "HttpClient.get('%s') retrieved from HTTP cache.",
          //   relativeUrl
          // );

          return data;
        }

        const error = `No data found in HTTP cache for key '${cacheKey}'!`;

        console.warn(error);

        throw new Error(error);
      })
      .catch(() => this.fetch(relativeUrl));
  }

  post(relativeUrl) {
    return this.fetch(relativeUrl, { method: 'POST' });
  }
}
