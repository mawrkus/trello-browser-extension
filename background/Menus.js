export class Menus {
  constructor({
    onClickRefreshAllBoards,
    onClickRefreshBoardLists,
    onClickList,
    storage,
  }) {
    this.onClickRefreshAllBoards = onClickRefreshAllBoards;
    this.onClickRefreshBoardLists = onClickRefreshBoardLists;
    this.onClickList = onClickList;
    this.storage = storage;

    this.menus = chrome.contextMenus;
    this.onClickMenuItem = this.onClickMenuItem.bind(this);

    this.menus.onClicked.addListener(this.onClickMenuItem);
  }

  onClickMenuItem(onClickData, tab) {
    // console.log('Menu item clicked', onClickData);

    const { menuItemId } = onClickData;

    if (menuItemId === 'refresh-all-boards') {
      this.onClickRefreshAllBoards();
      return;
    }

    if (menuItemId.startsWith('refresh-board-')) {
      const [, boardJson] = menuItemId.match(/^refresh-board-(.+)/);
      const board = JSON.parse(boardJson);

      this.onClickRefreshBoardLists(board);
      return;
    }

    if (menuItemId.startsWith('add-to-')) {
      const [, boardJson, listJson] = menuItemId.match(/^add-to-(.+)-(.+)/);
      const board = JSON.parse(boardJson);
      const list = JSON.parse(listJson);

      this.onClickList(onClickData, tab, board, list);
      return;
    }

    console.warn('Unknown menu item!', onClickData);
  }

  async createDefault() {
    this.menus.create({
      id: 'refresh-all-boards',
      title: '♻️ Refresh all boards',
      contexts: ['all'],
    });

    this.menus.create({
      id: 'boards-separator',
      type: 'separator',
    });
  }

  async addBoard(board, lists) {
    this.menus.create({
      id: `board-${board.id}`,
      title: board.name,
      contexts: ['all'],
    });

    this.menus.create({
      parentId: `board-${board.id}`,
      id: `refresh-board-${JSON.stringify({ id: board.id, name: board.name })}`,
      title: '♻️ Refresh all lists',
      contexts: ['all'],
    });

    this.menus.create({
      parentId: `board-${board.id}`,
      id: `board-${board.id}-lists-separator`,
      type: 'separator',
    });

    await this.addBoardLists(board, lists);
  }

  async addBoardLists(board, lists) {
    const parentId = `board-${board.id}`;

    const idPrefix = `add-to-${JSON.stringify({
      id: board.id,
      name: board.name,
    })}`;

    const listMenuItemIds = lists.map(({ id, name }) => {
      const menuItemId = `${idPrefix}-${JSON.stringify({ id, name })}`;

      this.menus.create({
        parentId,
        id: menuItemId,
        title: name,
        contexts: ['all'],
      });

      return menuItemId;
    });

    await this.storage.set(parentId, listMenuItemIds).catch((error) => {
      console.error('Error while storing menu items for board "%s"!', board.name);
      console.error(error);
    });
  }

  async updateBoard(board, lists) {
    const parentMenuId = `board-${board.id}`;

    try {
      const listMenuItemIds = await this.storage.get(parentMenuId);

      for (const id of listMenuItemIds) {
        await this.removeById(id);
      }
    } catch (error) {
      console.error('Error while removing menu items for board "%s"!', board.name);
      console.error(error);

      await this.removeBoard(board.id);
    }

    await this.addBoardLists(board, lists);
  }

  removeBoard(boardId) {
    return this.removeById(`board-${boardId}`);
  }

  removeById(id) {
    return new Promise((resolve) => { this.menus.remove(id, resolve); });
  }

  removeAll() {
    return new Promise((resolve) => { this.menus.removeAll(resolve); });
  }
}
