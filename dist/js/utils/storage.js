/**
 * storage.ts
 *
 * Helper functions for interacting with chrome.storage.sync.
 * Provides typed access to the extension's settings.
 */
const DEFAULT_SETTINGS = {
    labels: [],
};
/**
 * Retrieves the current settings from storage.
 */
export async function getSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
            resolve(items);
        });
    });
}
/**
 * Saves the settings to storage.
 */
export async function saveSettings(settings) {
    return new Promise((resolve) => {
        chrome.storage.sync.set(settings, () => {
            resolve();
        });
    });
}
/**
 * Adds a new label to the list.
 */
export async function addLabel(labelName) {
    const settings = await getSettings();
    const newLabel = {
        name: labelName.trim(),
        id: crypto.randomUUID(),
    };
    // Avoid duplicates
    if (!settings.labels.some((l) => l.name === newLabel.name)) {
        settings.labels.push(newLabel);
        await saveSettings(settings);
    }
}
/**
 * Removes a label by ID.
 */
export async function removeLabel(labelId) {
    const settings = await getSettings();
    settings.labels = settings.labels.filter((l) => l.id !== labelId);
    await saveSettings(settings);
}
/**
 * Updates the order of labels.
 */
export async function updateLabelOrder(newLabels) {
    const settings = await getSettings();
    settings.labels = newLabels;
    await saveSettings(settings);
}
