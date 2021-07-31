console.info('Initializing popup script...');

const notifier = {
  success() {},
  error() {},
};

const storage = new Storage({ notifier });

async function onClickSave(event) {
  event.preventDefault();

  const credentials = ['key', 'token'].reduce((acc, k) => {
    const value = document.getElementById(`js-api-${k}`).value.trim();

    if (value) {
      document.getElementById(`js-api-${k}-field`).setAttribute('class', 'field');
    } else {
      document.getElementById(`js-api-${k}-field`).setAttribute('class', 'field error');
    }

    return {
      ...acc,
      [k]: value,
    };
  }, {});

  if (!credentials.key || !credentials.token) {
    return;
  }

  console.log('Storing & sending credentials to background script...');

  await storage.set('credentials', credentials, 'credentials data');
  console.log('Credentials stored!');

  chrome.runtime.sendMessage({
    type: 'credentials',
    data: credentials,
  });

  window.close();
}

document.body.onload = async () => {
  console.log('Retrieving credentials from storage...');

  const credentials = await storage.get('credentials', 'credentials data');

  if (credentials) {
    console.log('Credentials retrieved from storage!');

    ['key', 'token'].forEach((k) => {
      document.getElementById(`js-api-${k}`).value = credentials[k];
    });
  } else {
    console.log('No credentials found.');
  }

  Array.from(document.querySelectorAll('.input')).forEach((inputElement) => {
    inputElement.addEventListener('keydown', (event) => {
      event.target.closest('.field').setAttribute('class', 'field');
    });
  });

  document.getElementById('js-save-settings').addEventListener('click', onClickSave);
};
