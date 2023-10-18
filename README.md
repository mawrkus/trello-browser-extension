# A browser extension for Trello

A browser extension to easily create Trello cards from any Web page in two clicks. Including metadata (title, description) and a cover image.

## Installation

As the extension is not published, the installation takes a bit more time, but is not too complex.

In a terminal, clone the repository:

```shell
git clone https://github.com/mawrkus/trello-browser-extension.git
```

Or download the code by clicking on the "[Code" > "Download ZIP](https://github.com/mawrkus/trello-browser-extension/archive/refs/heads/master.zip)" button in GitHub and unzip it in a "brave-chrome-trello-extension" folder on your computer.

### Brave/Chrome users

- Go to this "url": [chrome://extensions](chrome://extensions) (or [brave://extensions](brave://extensions))
- Activate the "Developer mode" and click on "Load unpacked":
  <img src="docs/images/settings-developer-mode.png" alt="Extension settings" />

- Go to the folder where you've cloned the extension and click "Select". The extension is now installed...
  <img src="docs/images/extension-details.png" alt="Extension details" />

- ...and its icon appears in the browser's toolbar:
  <br /><img src="docs/images/toolbar-with-extension.png" alt="Extension icon in toolbar" />

### Firefox users

The installation process is similar, but starts at this "url": [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox). After clicking on "Load Temporary Add-on...", just select the file "manifest-firefox.json".

For more information: [https://firefox-source-docs.mozilla.org/devtools-user/about_colon_debugging/index.html](https://firefox-source-docs.mozilla.org/devtools-user/about_colon_debugging/index.html)

## Usage

First you'll need an API key and token.
In order to obtain them, <a href="https://trello.com/login" target="_blank">login to Trello</a> then visit <a href="https://trello.com/app-key/" target="_blank">https://trello.com/app-key/</a>

Once obtained your API key and token, click on the extension icon in the browser's toolbar to save them:
<img src="docs/images/extension-popup.png" alt="Trello Card popup" />

Once saved, right-click on the page to open the contextual menu and click on "Refresh all boards":
<img src="docs/images/extension-refresh.png" alt ="Refresh menu item" />

After some time, you should be notified that your boards were successfully loaded:
<img src="docs/images/extension-boards-loaded-notification.png" alt="Boards loaded notification" />

Now you can right-click on any page and choose the board/list you want the new card to be added to:
<img src="docs/images/extension-menu.png" alt="Trello Card menu" />

Et voilà! 🎉
<img src="docs/images/extension-card-added-notification.png" alt="Card added notification" />
