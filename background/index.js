import { HttpClient } from './HttpClient.js';
import { Menus } from './Menus.js';
import { Notifier } from './Notifier.js';
import { Scripting } from './Scripting.js';
import { Storage } from './Storage.js';
import { TrelloHttpRepository } from './TrelloHttpRepository.js';

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
  let boards = null;

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
  let lists = null;

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
  console.log('Creating menus...');

  const boards = await loadBoards();

  if (!boards) {
    return;
  }

  await menus.removeAll();

  menus.create();

  for (const board of boards) {
    await createBoardMenu(board);
  }

  await storage.set('hasMenus', true).catch((error) => {
    console.error('Error while storing the "hasMenus" flag!');
    console.error(error);
  });
}

async function createBoardMenu(board, forceRefresh = false) {
  const lists = await loadBoardLists(board, forceRefresh);

  if (!lists) {
    return;
  }

  menus.addBoard(board, lists);
}

async function recreateAllMenus() {
  console.log('Recreating menus...');

  const boards = await loadBoards(true);

  if (!boards) {
    return;
  }

  await menus.removeAll();

  menus.create();

  for (const board of boards) {
    await createBoardMenu(board, true);
  }

  notifier.success({
    message: `${boards.length} boards successfully loaded!`,
  });

  await storage.set('hasMenus', true).catch((error) => {
    console.error('Error while storing the "hasMenus" flag!');
    console.error(error);
  });
}

async function recreateBoardMenu(board) {
  const lists = await loadBoardLists(board, true);

  if (!lists) {
    return;
  }

  await menus.removeBoard(board.id);

  menus.addBoard(board, lists);

  notifier.success({
    message: `"${board.name}" → ${lists.length} lists successfully loaded!`,
  });
}

async function createMinimalMenu() {
  await menus.create();
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

chrome.runtime.onInstalled.addListener(async () => {
  console.log('Extension installed.');

  await createMinimalMenu();
});

async function init() {
  console.log('Initializing background script...');

  const credentials = await storage.get('credentials');

  if (!credentials) {
    console.warn('No credentials!');
    return;
  }

  const hasMenus = await storage.get('hasMenus').catch((error) => {
    console.error('Error while getting the "hasMenus" flag from storage!');
    console.error(error);
    return false;
  });

  if (!hasMenus) {
    await recreateAllMenus();
  } else {
    await createAllMenus();
  }
}

init().then(() => console.log('Background script initialized.'));
