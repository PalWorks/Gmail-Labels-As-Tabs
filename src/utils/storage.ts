/**
 * storage.ts
 *
 * Helper functions for interacting with chrome.storage.sync.
 * Provides typed access to the extension's settings.
 */

export interface TabLabel {
    name: string;
    id: string; // Unique ID for drag and drop
    displayName?: string;
}

export interface Settings {
    labels: TabLabel[];
}

const DEFAULT_SETTINGS: Settings = {
    labels: [],
};

/**
 * Retrieves the current settings from storage.
 */
export async function getSettings(): Promise<Settings> {
    return new Promise((resolve) => {
        chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
            resolve(items as Settings);
        });
    });
}

/**
 * Saves the settings to storage.
 */
export async function saveSettings(settings: Settings): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.sync.set(settings, () => {
            resolve();
        });
    });
}

/**
 * Adds a new label to the list.
 */
export async function addLabel(labelName: string): Promise<void> {
    const settings = await getSettings();
    const newLabel: TabLabel = {
        name: labelName.trim(),
        id: crypto.randomUUID(),
        displayName: labelName.trim(),
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
export async function removeLabel(labelId: string): Promise<void> {
    const settings = await getSettings();
    settings.labels = settings.labels.filter((l) => l.id !== labelId);
    await saveSettings(settings);
}

/**
 * Updates an existing label.
 */
export async function updateLabel(labelId: string, updates: Partial<TabLabel>): Promise<void> {
    const settings = await getSettings();
    const index = settings.labels.findIndex((l) => l.id === labelId);
    if (index !== -1) {
        settings.labels[index] = { ...settings.labels[index], ...updates };
        await saveSettings(settings);
    }
}

/**
 * Updates the order of labels.
 */
export async function updateLabelOrder(newLabels: TabLabel[]): Promise<void> {
    const settings = await getSettings();
    settings.labels = newLabels;
    await saveSettings(settings);
}
