export class Notifier {
  constructor() {
    this.notifications = chrome.notifications;
    this.tabs = chrome.tabs;

    this.idsToUrlsMap = {};
    this.bindEvents();
  }

  bindEvents() {
    this.notifications.onClicked.addListener((notificationId) => {
      if (this.idsToUrlsMap[notificationId]) {
        this.tabs.create({ url: this.idsToUrlsMap[notificationId].url });

        delete this.idsToUrlsMap[notificationId];
      }
    });

    this.notifications.onClosed.addListener((notificationId, byUser) => {
      delete this.idsToUrlsMap[notificationId];
    });
  }

  async success({ message, clickUrl }) {
    const options = {
      type: "basic",
      iconUrl: "../icons/trello-logo-96.png",
      title: "Trello Card",
      message,
    };

    // unique ID required by Chrome
    const notificationId = await this.notifications.create(
      `success-${Date.now()}`,
      options
    );

    if (clickUrl) {
      this.idsToUrlsMap[notificationId] = { url: clickUrl };
    }
  }

  async error({ type, message }) {
    // unique ID required by Chrome
    await this.notifications.create(`error-${Date.now()}`, {
      type: "basic",
      iconUrl: "../icons/trello-logo-96-grey.png",
      title: `💥 Trello Card | ${type}`,
      message,
    });
  }
}
