export class TrelloHttpRepository {
  constructor({ httpClient }) {
    this.httpClient = httpClient;
  }

  async getBoards(forceCacheRefresh = false) {
    const boards = await this.httpClient.get(
      '/1/members/me/boards?lists=all',
      forceCacheRefresh,
    );

    console.log('Trello → %d boards loaded.', boards.length);

    return boards;
  }

  async getBoardLists(board, forceCacheRefresh = false) {
    const lists = await this.httpClient.get(
      `/1/boards/${board.id}/lists`,
      forceCacheRefresh,
    );

    console.log("'%s' → %d lists loaded.", board.name, lists.length);

    return lists;
  }

  async createCard(card, cover = null) {
    console.log('Creating new card...', card, cover);

    // TODO: use URLSearcdhParams
    const qs = Object.entries(card).reduce(
      (acc, [k, v]) => `${acc}&${k}=${encodeURIComponent(v)}&`,
      '',
    );

    const newCard = await this.httpClient.post(`/1/cards?${qs}`);

    console.log('New card created!', newCard);

    if (cover) {
      await this.createCardCover(newCard, cover);
    }

    return newCard;
  }

  async createCardCover(card, cover) {
    console.log("Creating cover for card id='%s'...", card.id, cover);

    // TODO: use URLSearcdhParams
    const qs = Object.entries(cover).reduce(
      (acc, [k, v]) => `${acc}${k}=${encodeURIComponent(v)}&`,
      '',
    );

    try {
      const newCover = await this.httpClient.post(
        `/1/cards/${card.id}/attachments?${qs}`,
      );

      console.log("Cover created for card id='%s'!", card.id, newCover);

      return newCover;
    } catch (error) {
      console.log("Error while creating cover for card id='%s'!", card.id);
      console.error(error);

      return null;
    }
  }
}
