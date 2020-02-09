// eslint-disable-next-line no-unused-vars
class Notifier {
  constructor() {
    this.notifications = chrome.notifications;
    console.log('Notifier', this);
  }

  success({ message }) {
    // unique ID required by Chrome
    this.notifications.create(`notification-success-${Date.now()}`, {
      type: 'basic',
      iconUrl: './icons/trello-logo-96.png',
      title: 'TrelloMe!',
      message,
    });

    console.log(message);
  }

  error({ type, message }) {
    // unique ID required by Chrome
    this.notifications.create(`notification-error-${Date.now()}`, {
      type: 'basic',
      iconUrl: './icons/trello-logo-96-grey.png',
      title: `TrelloMe! ${type}`,
      message,
    });

    console.error(type, message);
  }
}
