console.info('Initializing popup...');

async function onClickSave(event) {
  event.preventDefault();

  const credentials = ['key', 'token'].reduce((acc, k) => {
    const value = document.getElementById(`js-api-${k}`).value.trim();

    if (value) {
      document
        .getElementById(`js-api-${k}-field`)
        .setAttribute('class', 'field');
    } else {
      document
        .getElementById(`js-api-${k}-field`)
        .setAttribute('class', 'field error');
    }

    return {
      ...acc,
      [k]: value,
    };
  }, {});

  if (!credentials.key || !credentials.token) {
    return;
  }

  chrome.runtime.sendMessage({
    type: 'credentials',
    data: credentials,
  });

  window.close();
}

document.body.onload = async () => {
  console.info('Popup created.');

  const credentials = await chrome.storage.local.get('credentials');

  if (credentials) {
    ['key', 'token'].forEach((k) => {
      document.getElementById(`js-api-${k}`).value = credentials[k];
    });
  } else {
    console.warn('No credentials found!');
  }

  Array.from(document.querySelectorAll('.input')).forEach((inputElement) => {
    inputElement.addEventListener('keydown', (event) => {
      event.target.closest('.field').setAttribute('class', 'field');
    });
  });

  document
    .getElementById('js-save-settings')
    .addEventListener('click', onClickSave);
};
