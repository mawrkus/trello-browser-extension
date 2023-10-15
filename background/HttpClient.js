export class HttpClient {
  constructor({ baseUrl, cacheClient }) {
    this.baseUrl = baseUrl;
    this.cacheClient = cacheClient;

    this.credentialsParams = null;
  }

  buildUrl(relativeUrl) {
    const url = new URL(relativeUrl, this.baseUrl);

    return new URL(
      `${url.origin}${url.pathname}?${new URLSearchParams([
        ...Array.from(url.searchParams.entries()),
        ...this.credentialsParams.entries(),
      ])}`
    );
  }

  setCredentials(credentials) {
    this.credentialsParams = new URLSearchParams(credentials);
  }

  async fetch(relativeUrl, options = {}) {
    const url = this.buildUrl(relativeUrl);

    // console.log("HttpClient.fetch", url, options);

    const response = await fetch(url, options);

    if (response.status >= 400) {
      console.error("Fetch error!", response);

      throw new Error(`HTTP error ${response.status}!`);
    }

    const data = await response.json();

    if (!options.method || options.method.toUpperCase() === "GET") {
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
    return this.fetch(relativeUrl, { method: "POST" });
  }
}
