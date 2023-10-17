console.log('Popup → opening...');

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
    console.log('Popup → missing key and/or token!');
    return;
  }

  // we store them for the service worker, once it's active
  await chrome.storage.local.set({ credentials }).catch((error) => {
    console.error('Error while saving credentials!');
    console.error(error);
  });

  console.log('Popup → credentials saved.');

  window.close();
}

document.body.onload = async () => {
  const { credentials } = await chrome.storage.local.get('credentials');

  if (credentials) {
    console.log('Popup → credentials found.');

    ['key', 'token'].forEach((k) => {
      document.getElementById(`js-api-${k}`).value = credentials[k];
    });
  } else {
    console.log('Popup → no credentials!');
  }

  Array.from(document.querySelectorAll('.input')).forEach((inputElement) => {
    inputElement.addEventListener('keydown', (event) => {
      event.target.closest('.field').setAttribute('class', 'field');
    });
  });

  document
    .getElementById('js-save-settings')
    .addEventListener('click', onClickSave);

  console.log('Popup → opened.');
};
