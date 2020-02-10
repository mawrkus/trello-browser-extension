// eslint-disable-next-line no-unused-vars
class Notifier {
  constructor() {
    this.notifications = chrome.notifications;
    this.tabs = chrome.tabs;

    this.idsToUrlsMap = {};
    this.bindEvents();

    console.log('Notifier', this);
  }

  bindEvents() {
    this.notifications.onClicked.addListener((notificationId) => {
      console.log('Clicked on notification', this.idsToUrlsMap[notificationId]);

      if (this.idsToUrlsMap[notificationId]) {
        this.tabs.create({ url: this.idsToUrlsMap[notificationId].url });
      }
    });
  }

  success({ message, clickUrl }) {
    console.log(message, clickUrl);

    // unique ID required by Chrome
    const options = {
      type: 'basic',
      iconUrl: './icons/trello-logo-96.png',
      title: 'TrelloMe!',
      message,
    };

    this.notifications.create(`success-${Date.now()}`, options, (notificationId) => {
      if (clickUrl) {
        this.idsToUrlsMap[notificationId] = { url: clickUrl };
      }
    });
  }

  error({ type, message }) {
    console.error(type, message);

    // unique ID required by Chrome
    this.notifications.create(`error-${Date.now()}`, {
      type: 'basic',
      iconUrl: './icons/trello-logo-96-grey.png',
      title: `TrelloMe! ${type}`,
      message,
    });
  }
}
