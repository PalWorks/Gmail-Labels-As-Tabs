"use strict";
(() => {
  // node_modules/@inboxsdk/core/background.js
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "inboxsdk__injectPageWorld" && sender.tab) {
      if (chrome.scripting) {
        let documentIds;
        let frameIds;
        if (sender.documentId) {
          documentIds = [sender.documentId];
        } else {
          frameIds = [sender.frameId];
        }
        chrome.scripting.executeScript({
          target: { tabId: sender.tab.id, documentIds, frameIds },
          world: "MAIN",
          files: ["pageWorld.js"]
        });
        sendResponse(true);
      } else {
        sendResponse(false);
      }
    }
  });

  // src/background.ts
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "openOptions") {
      chrome.runtime.openOptionsPage();
    }
  });
  chrome.action.onClicked.addListener((tab) => {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_SETTINGS" }).catch((err) => {
        console.warn("Could not send message to tab:", err);
      });
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
