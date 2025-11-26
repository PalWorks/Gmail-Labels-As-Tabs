/**
 * background.ts
 *
 * Service worker for the extension.
 * Handles opening the options page.
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'openOptions') {
        chrome.runtime.openOptionsPage();
    }
});

chrome.action.onClicked.addListener((tab) => {
    if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_SETTINGS" });
    }
});

// Optional: Install hook
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        // Could set default labels here if we wanted
        const defaultLabels = [
            { name: 'Inbox', id: 'default-inbox' },
            { name: 'Sent', id: 'default-sent' }
        ];
        chrome.storage.sync.get(['labels'], (result) => {
            if (!result.labels) {
                chrome.storage.sync.set({ labels: defaultLabels });
            }
        });
    }
});
