// eslint-disable-next-line no-unused-vars
class Menus {
  constructor({
    onClickRefreshAllBoards,
    onClickRefreshBoardLists,
    onClickList,
  }) {
    this.menus = chrome.contextMenus;
    this.onClickRefreshAllBoards = onClickRefreshAllBoards;
    this.onClickRefreshBoardLists = onClickRefreshBoardLists;
    this.onClickList = onClickList;
    console.log('Menus', this);
  }

  removeAll() {
    return new Promise((resolve) => this.menus.removeAll(resolve));
  }

  remove(id) {
    return new Promise((resolve) => this.menus.remove(id, resolve));
  }

  async createBoards(boards) {
    console.log('Creating contextual menus...');

    this.menus.create({
      id: 'board-refresh-all',
      title: '📥 Refresh all boards',
      contexts: ['all'],
      onclick: this.onClickRefreshAllBoards,
    });

    this.menus.create({
      id: 'board-sep',
      type: 'separator',
    });

    boards.forEach((board) => this.createBoard(board));
  }

  createBoard(board) {
    this.menus.create({
      id: `board-${board.id}`,
      title: board.name,
      contexts: ['all'],
    });

    this.menus.create({
      parentId: `board-${board.id}`,
      id: `board-refresh-${board.id}`,
      title: `📥 Refresh ${board.name} lists`,
      contexts: ['all'],
      onclick: () => this.onClickRefreshBoardLists(board),
    });

    this.menus.create({
      parentId: `board-${board.id}`,
      id: `board-${board.id}-list-sep`,
      type: 'separator',
    });
  }

  createBoardLists(board, lists) {
    lists.forEach((list) => {
      this.menus.create({
        parentId: `board-${board.id}`,
        id: `board-${board.id}-list-${list.id}`,
        title: list.name,
        contexts: ['all'],
        onclick: (info, tab) => this.onClickList(info, tab, board, list),
      });
    });
  }
}
