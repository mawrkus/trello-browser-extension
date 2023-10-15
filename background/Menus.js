export class Menus {
  constructor({
    onClickRefreshAllBoards,
    onClickRefreshBoardLists,
    onClickList,
  }) {
    this.menus = chrome.contextMenus;
    this.onClickMenuItem = this.onClickMenuItem.bind(this);

    this.onClickRefreshAllBoards = onClickRefreshAllBoards;
    this.onClickRefreshBoardLists = onClickRefreshBoardLists;
    this.onClickList = onClickList;
  }

  removeAll() {
    this.menus.onClicked.removeListener(this.onClickMenuItem);

    return new Promise((resolve) => this.menus.removeAll(resolve));
  }

  remove(id) {
    return new Promise((resolve) => this.menus.remove(id, resolve));
  }

  onClickMenuItem(onClickData, tab) {
    // console.log("Menu item clicked", onClickData);

    const { menuItemId } = onClickData;

    if (menuItemId === "refresh-all-board") {
      return this.onClickRefreshAllBoards();
    }

    if (menuItemId.startsWith("refresh-board-")) {
      const [, boardJson] = menuItemId.match(/^refresh-board-(.+)/);
      const board = JSON.parse(boardJson);

      return this.onClickRefreshBoardLists(board);
    }

    if (menuItemId.startsWith("add-to-")) {
      const [, boardJson, listJson] = menuItemId.match(/^add-to-(.+)-(.+)/);
      const board = JSON.parse(boardJson);
      const list = JSON.parse(listJson);

      return this.onClickList(onClickData, tab, board, list);
    }

    console.warn("Unknown menu item!", onClickData);
  }

  async createBoards(boards) {
    this.menus.create({
      id: "refresh-all-board",
      title: "♻️ Refresh all boards",
      contexts: ["all"],
    });

    this.menus.create({
      id: "boards-separator",
      type: "separator",
    });

    boards.forEach((board) => this.createBoard(board));

    this.menus.onClicked.addListener(this.onClickMenuItem);
  }

  createBoard(board) {
    this.menus.create({
      id: `board-${board.id}`,
      title: board.name,
      contexts: ["all"],
    });

    this.menus.create({
      parentId: `board-${board.id}`,
      id: `refresh-board-${JSON.stringify({ id: board.id, name: board.name })}`,
      title: `♻️ Refresh ${board.name} lists`,
      contexts: ["all"],
    });

    this.menus.create({
      parentId: `board-${board.id}`,
      id: `board-${board.id}-lists-separator`,
      type: "separator",
    });
  }

  createBoardLists(board, lists) {
    lists.forEach((list) => {
      this.menus.create({
        parentId: `board-${board.id}`,
        id: `add-to-${JSON.stringify({
          id: board.id,
          name: board.name,
        })}-${JSON.stringify({ id: list.id, name: list.name })}`,
        title: list.name,
        contexts: ["all"],
      });
    });
  }
}
