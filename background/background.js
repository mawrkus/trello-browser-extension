console.info('Initializing background script...');

const apiBaseUrl = 'https://api.trello.com';
let apiCredentials;

const notifier = new Notifier();
const storage = new Storage({ notifier });
const httpRequest = new HttpRequest({ storage });

const menus = new Menus({
  onClickRefreshAllBoards: refreshAllBoards, // eslint-disable-line no-use-before-define
  onClickRefreshBoardLists: refreshBoardLists, // eslint-disable-line no-use-before-define
  onClickList, // eslint-disable-line no-use-before-define
});

async function loadBoards(noCache = false) {
  console.log('Loading boards...');

  const { key, token } = apiCredentials;
  const url = `${apiBaseUrl}/1/members/me/boards?lists=all&key=${key}&token=${token}`;

  try {
    const boards = await httpRequest.get(url, noCache);
    console.log('%d boards loaded.', boards.length);
    return boards;
  } catch (error) {
    console.log('No boards loaded.');
    notifier.error({ type: 'Load boards error!', message: error.message });
    return null;
  }
}

async function refreshAllBoards() {
  // eslint-disable-next-line no-use-before-define
  await loadAndCreateMenus(true, false);
  notifier.success({ message: `Boards refreshed: ${boards.length} boards!` });
}

async function loadLists(board, noCache = false) {
  console.log('Loading "%s" lists...', board.name);

  const { key, token } = apiCredentials;
  const url = `${apiBaseUrl}/1/boards/${board.id}/lists?key=${key}&token=${token}`;

  try {
    const lists = await httpRequest.get(url, noCache);
    console.log('"%s": %d lists loaded.', board.name, lists.length);
    return lists;
  } catch (error) {
    console.log('No lists loaded.');
    notifier.error({ type: `Load "${board.name}" lists error!`, message: error.message });
    return null;
  }
}

async function refreshBoardLists(board) {
  const lists = await loadLists(board, true);
  if (!lists) {
    return;
  }

  await menus.remove(`board-${board.id}`);
  menus.createBoard(board);
  menus.createBoardLists(board, lists);

  notifier.success({ message: `"${board.name}" refreshed: ${lists.length} lists!` });
}

function createCard(card) {
  console.log('Creating new card...', card);

  const { key, token } = apiCredentials;
  const qs = Object.entries(card)
    .reduce((acc, [k, v]) => `${acc}&${k}=${encodeURIComponent(v)}`, '');
  const url = `${apiBaseUrl}/1/cards?key=${key}&token=${token}${qs}`;

  return httpRequest.post(url);
}

async function onClickList(info, tab, board, list) {
  const { selectionText } = info;
  const { url: pageUrl, title: pageTitle } = tab;

  const newCard = {
    idList: list.id,
    urlSource: pageUrl,
    name: selectionText || pageTitle,
    desc: 'Created via TrelloMe!',
    pos: 'top',
  };

  try {
    await createCard(newCard);
    notifier.success({ message: `New card successfully added to ${board.name} > ${list.name}!` });
  } catch (error) {
    notifier.error({
      type: 'Create card error!',
      message: `Error while creating card: ${error.message}`,
    });
  }
}

async function loadAndCreateMenus(noCache = false, storeCredentials = false) {
  const boards = await loadBoards(noCache);
  if (!boards) {
    return;
  }

  notifier.success({ message: `${boards.length} boards loaded!` });

  if (storeCredentials) {
    await storage.set('credentials', apiCredentials, 'credentials data')
      .catch(() => {}); // fire & forget;
    console.log('Credentials stored!');
    notifier.success({ message: 'Credentials successfully saved!' });
  }

  menus.createBoards(boards);

  // eslint-disable-next-line no-restricted-syntax
  for (const board of boards) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const lists = await loadLists(board);
      menus.createBoardLists(board, lists);
    } catch (error) {
      notifier.error({ type: `Load "${board.name}" lists error!`, message: error.message });
    }
  }
}

async function onStart() {
  console.log('Retrieving credentials from storage...');

  const credentials = await storage.get('credentials', 'credentials data');

  if (credentials) {
    console.log('Credentials retrieved from storage.');

    apiCredentials = credentials;
    await loadAndCreateMenus(false);
  } else {
    console.log('No credentials found.');
  }

  chrome.runtime.onMessage.addListener(async (message) => {
    console.log('Received credentials from popup.');

    apiCredentials = message.credentials;
    await loadAndCreateMenus(false, true);
  });
}

chrome.runtime.onInstalled.addListener(onStart);
chrome.runtime.onStartup.addListener(onStart);
