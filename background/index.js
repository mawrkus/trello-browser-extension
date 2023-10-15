import { HttpClient } from "./HttpClient.js";
import { Menus } from "./Menus.js";
import { Notifier } from "./Notifier.js";
import { Scripting } from "./Scripting.js";
import { Storage } from "./Storage.js";
import { TrelloHttpRepository } from "./TrelloHttpRepository.js";

console.info("Initializing service worker...");

const storage = new Storage();
const notifier = new Notifier();
const scripting = new Scripting();

export const httpClient = new HttpClient({
  baseUrl: "https://api.trello.com",
  cacheClient: storage,
});

const trelloRepository = new TrelloHttpRepository({ httpClient });

const menus = new Menus({
  onClickRefreshAllBoards: refreshAllBoards, // eslint-disable-line no-use-before-define
  onClickRefreshBoardLists: refreshBoardLists, // eslint-disable-line no-use-before-define
  onClickList, // eslint-disable-line no-use-before-define
});

async function createAllMenus(forceCacheRefresh = false) {
  const boards = await loadBoards(forceCacheRefresh);

  if (!boards.length) {
    return [];
  }

  await menus.removeAll(); // We do this in case we've received new credentials

  menus.createBoards(boards);

  // eslint-disable-next-line no-restricted-syntax
  for (const board of boards) {
    // eslint-disable-next-line no-await-in-loop
    const lists = await loadLists(board, forceCacheRefresh);
    if (lists) {
      menus.createBoardLists(board, lists);
    }
  }

  return boards;
}

async function loadBoards(forceCacheRefresh) {
  try {
    return trelloRepository.getBoards(forceCacheRefresh);
  } catch (error) {
    notifier.error({
      type: "Load Error",
      type: `Error loading boards: ${error.message}!`,
    });

    return [];
  }
}

async function loadLists(board, forceCacheRefresh = false) {
  try {
    return trelloRepository.getBoardLists(board, forceCacheRefresh);
  } catch (error) {
    notifier.error({
      type: "Load Error",
      message: `Error loading "${board.name}" lists: ${error.message}`,
    });

    return [];
  }
}

async function refreshAllBoards() {
  const boards = await loadBoards(true);

  if (!boards.length) {
    return;
  }

  await menus.removeAll();

  menus.createBoards(boards);

  // eslint-disable-next-line no-restricted-syntax
  for (const board of boards) {
    // eslint-disable-next-line no-await-in-loop
    const lists = await loadLists(board, true);

    if (lists.length) {
      menus.createBoardLists(board, lists);
    }
  }

  notifier.success({
    message: `${boards.length} board(s) successfully refreshed!`,
  });
}

async function refreshBoardLists(board) {
  const lists = await loadLists(board, true);
  if (!lists) {
    return;
  }

  await menus.remove(`board-${board.id}`);
  menus.createBoard(board);
  menus.createBoardLists(board, lists);

  notifier.success({
    type: board.name,
    message: `"${board.name}" → ${lists.length} list(s) successfully refreshed!`,
  });
}

async function buildCardAndCoverData(info, tab, list) {
  const { selectionText } = info;
  const { id: tabId, url: pageUrl, title: pageTitle } = tab;

  const htmlMetas = await scripting
    .executeScript(tabId, "./background/injection-scripts/getHtmlMetas.js")
    .catch(() => ({ description: "", imageUrl: null }));

  const desc = htmlMetas.description
    ? `${htmlMetas.description} (...)`
    : `No description available.`;

  return {
    card: {
      idList: list.id,
      urlSource: pageUrl,
      name: selectionText || pageTitle,
      desc: `${desc}\n\n🔗 Source: ${pageUrl}`,
      pos: "top",
    },
    cover: htmlMetas.imageUrl
      ? {
          name: "Cover",
          url: htmlMetas.imageUrl,
          setCover: true,
        }
      : null,
  };
}

async function onClickList(info, tab, board, list) {
  const { card, cover } = await buildCardAndCoverData(info, tab, list);

  try {
    const newCard = await trelloRepository.createCard(card, cover);

    notifier.success({
      message: `New card successfully added to ${board.name} → ${list.name}!`,
      clickUrl: newCard.url,
    });
  } catch (error) {
    notifier.error({
      type: "Create Card Error",
      message: `Error while creating new card: ${error.message}!`,
    });
  }
}

async function onReceivePopupMessage({ type, data }) {
  if (type !== "credentials") {
    return;
  }

  try {
    await storage.set("credentials", data);
  } catch (error) {
    notifier.error({
      type: "Storing Credentials Error",
      message: `Error while storing credentials: ${error.message}!`,
    });

    return;
  }

  httpClient.setCredentials(data);

  notifier.success({ message: "Credentials successfully saved!" });

  const boards = await createAllMenus(true);

  if (boards.length) {
    notifier.success({
      message: `${boards.length} boards successfully loaded!`,
    });
  }
}

async function onStart() {
  const credentials = await storage.get("credentials");

  if (credentials) {
    httpClient.setCredentials(credentials);

    await createAllMenus();
  } else {
    console.warn("No credentials found!");
  }

  chrome.runtime.onMessage.addListener(onReceivePopupMessage);
}

chrome.runtime.onInstalled.addListener(onStart);
chrome.runtime.onStartup.addListener(onStart);
