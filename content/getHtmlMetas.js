function findMetaValue(selectors) {
  let metaValue = '';

  selectors.some(([selector, attribute]) => {
    const element = document.querySelector(selector);
    metaValue = (element && element.getAttribute(attribute)) || '';
    return Boolean(metaValue);
  });

  return metaValue;
}

function getHtmlMetas() {
  return {
    description: findMetaValue([
      ['meta[property="og:description"]', 'content'],
      ['meta[name="twitter:description"]', 'content'],
      ['meta[property="twitter:description"]', 'content'],
      ['meta[itemprop="description"]', 'content'],
      ['meta[name="description"]', 'content'],
    ]),
    imageUrl: findMetaValue([
      ['meta[property="og:image:secure_url"]', 'content'],
      ['meta[property="og:image:url"]', 'content'],
      ['meta[property="og:image"]', 'content'],
      ['meta[name="twitter:image:src"]', 'content'],
      ['meta[property="twitter:image:src"]', 'content'],
      ['meta[name="twitter:image"]', 'content'],
      ['meta[property="twitter:image"]', 'content'],
      ['meta[itemprop="image"]', 'content'],
      ['article img[src]', 'src'],
      ['#content img[src]', 'src'],
      ['img[alt*="author" i]', 'src'],
      ['img[src]:not([aria-hidden="true"])', 'src'],
    ]),
  };
}

getHtmlMetas();
