import { HttpClient } from './HttpClient.js';
import { Menus } from './Menus.js';
import { Notifier } from './Notifier.js';
import { Scripting } from './Scripting.js';
import { Storage } from './Storage.js';
import { TrelloHttpRepository } from './TrelloHttpRepository.js';

console.info('Initializing background script...');

let initialized = false;

const storage = new Storage();
const notifier = new Notifier();
const scripting = new Scripting();

export const httpClient = new HttpClient({
  baseUrl: 'https://api.trello.com',
  cacheClient: storage,
});

const trelloRepository = new TrelloHttpRepository({ httpClient });

const menus = new Menus({
  onClickRefreshAllBoards: recreateAllMenus,
  onClickRefreshBoardLists: recreateBoardMenu,
  onClickList: addCardToList,
});

async function loadBoards(forceRefresh = false) {
  let boards = [];

  try {
    boards = await trelloRepository.getBoards(forceRefresh);
  } catch (error) {
    notifier.error({
      type: 'Load Error',
      message: `Error loading boards: ${error.message}!`,
    });
  }

  return boards;
}

async function loadBoardLists(board, forceRefresh = false) {
  let lists = [];

  try {
    lists = await trelloRepository.getBoardLists(board, forceRefresh);
  } catch (error) {
    notifier.error({
      type: 'Load Error',
      message: `Error loading "${board.name}" lists: ${error.message}`,
    });
  }

  return lists;
}

async function createAllMenus() {
  const boards = await loadBoards();

  await menus.removeAll();

  menus.create();

  for (const board of boards) {
    await createBoardMenu(board);
  }
}

async function createBoardMenu(board, forceRefresh = false) {
  const lists = await loadBoardLists(board, forceRefresh);

  menus.addBoard(board, lists);
}

async function recreateAllMenus() {
  const boards = await loadBoards(true);

  await menus.removeAll();

  menus.create();

  for (const board of boards) {
    await createBoardMenu(board, true);
  }

  notifier.success({
    message: `${boards.length} boards successfully loaded!`,
  });
}

async function recreateBoardMenu(board) {
  const lists = await loadBoardLists(board, true);

  await menus.removeBoard(board.id);

  menus.addBoard(board, lists);

  notifier.success({
    message: `"${board.name}" → ${lists.length} lists successfully loaded!`,
  });
}

async function buildCardAndCoverData(onClickData, tab, list) {
  const { selectionText } = onClickData;
  const { id: tabId, url: pageUrl, title: pageTitle } = tab;

  const htmlMetas = await scripting
    .executeScript(tabId, './background/injection-scripts/getHtmlMetas.js')
    .catch(() => ({ description: '', imageUrl: null }));

  const desc = htmlMetas.description
    ? `${htmlMetas.description} (...)`
    : 'No description available.';

  return {
    card: {
      idList: list.id,
      urlSource: pageUrl,
      name: selectionText || pageTitle,
      desc: `${desc}\n\n🔗 Source: ${pageUrl}`,
      pos: 'top',
    },
    cover: htmlMetas.imageUrl
      ? {
        name: 'Cover',
        url: htmlMetas.imageUrl,
        setCover: true,
      }
      : null,
  };
}

async function addCardToList(onClickData, tab, board, list) {
  const { card, cover } = await buildCardAndCoverData(onClickData, tab, list);

  try {
    const newCard = await trelloRepository.createCard(card, cover);

    notifier.success({
      message: `New card successfully added to ${board.name} → ${list.name}!`,
      clickUrl: newCard.url,
    });
  } catch (error) {
    notifier.error({
      type: 'Create Card Error',
      message: `Error while creating new card: ${error.message}!`,
    });
  }
}

async function onReceivePopupMessage({ type, data }) {
  if (type !== 'credentials') {
    return;
  }

  console.info('Credentials received from popup.');

  try {
    await storage.set('credentials', data);
  } catch (error) {
    notifier.error({
      type: 'Storing Credentials Error',
      message: `Error while storing credentials: ${error.message}!`,
    });

    return;
  }

  httpClient.setCredentials(data);

  notifier.success({ message: 'Credentials successfully saved!' });

  await recreateAllMenus();
}

async function init() {
  if (initialized) {
    return;
  }

  initialized = true;

  const credentials = await storage.get('credentials');

  if (credentials) {
    httpClient.setCredentials(credentials);

    await createAllMenus();
  } else {
    console.warn('No credentials found!');
  }

  chrome.runtime.onMessage.addListener(onReceivePopupMessage);

  console.log('Background script initialized!');
}

chrome.runtime.onStartup.addListener(async () => {
  console.info('Extension started.');
  await init();
});

// eslint-disable-next-line no-undef, no-restricted-globals
self.addEventListener('activate', async () => {
  console.info('Service worker activated.');
  await init();
});
