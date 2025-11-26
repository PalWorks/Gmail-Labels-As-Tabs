"use strict";
(() => {
  // src/background.ts
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "openOptions") {
      chrome.runtime.openOptionsPage();
    }
  });
  chrome.action.onClicked.addListener((tab) => {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_SETTINGS" });
    }
  });
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      const defaultLabels = [
        { name: "Inbox", id: "default-inbox" },
        { name: "Sent", id: "default-sent" }
      ];
      chrome.storage.sync.get(["labels"], (result) => {
        if (!result.labels) {
          chrome.storage.sync.set({ labels: defaultLabels });
        }
      });
    }
  });
})();
//# sourceMappingURL=background.js.map
