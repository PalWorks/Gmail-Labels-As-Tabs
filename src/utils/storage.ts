/**
 * storage.ts
 *
 * Helper functions for interacting with chrome.storage.sync.
 * Provides typed access to the extension's settings.
 */

export interface Tab {
    id: string;
    title: string;       // Display Name
    type: 'label' | 'hash'; // 'label' for legacy/simple, 'hash' for custom views
    value: string;       // The label name or full hash string
}

// Legacy interface for migration
interface LegacyTabLabel {
    name: string;
    id: string;
    displayName?: string;
}

export interface Settings {
    tabs: Tab[];
    // Legacy support for migration
    labels?: LegacyTabLabel[];
    theme: 'system' | 'light' | 'dark';
    showUnreadCount: boolean;
}

const DEFAULT_SETTINGS: Settings = {
    tabs: [],
    theme: 'system',
    showUnreadCount: false
};

/**
 * Retrieves the current settings from storage.
 * Handles migration from legacy 'labels' to 'tabs'.
 */
export async function getSettings(): Promise<Settings> {
    return new Promise((resolve) => {
        chrome.storage.sync.get(null, (items) => { // Get all items to check for legacy 'labels'
            const settings = { ...DEFAULT_SETTINGS, ...items } as Settings;

            // Migration Logic: If 'labels' exists but 'tabs' is empty/missing
            if (settings.labels && settings.labels.length > 0 && (!settings.tabs || settings.tabs.length === 0)) {
                console.log('Migrating legacy labels to tabs...');
                settings.tabs = settings.labels.map(l => ({
                    id: l.id,
                    title: l.displayName || l.name,
                    type: 'label',
                    value: l.name
                }));
                // Clear legacy labels to prevent re-migration
                delete settings.labels;
                // Save migrated settings immediately
                chrome.storage.sync.set(settings);
            }

            resolve(settings);
        });
    });
}

/**
 * Saves the settings to storage.
 * Merges the provided settings with existing ones.
 */
export async function saveSettings(newSettings: Partial<Settings>): Promise<void> {
    const currentSettings = await getSettings();
    const mergedSettings = { ...currentSettings, ...newSettings };
    return new Promise((resolve) => {
        chrome.storage.sync.set(mergedSettings, () => {
            resolve();
        });
    });
}

/**
 * Adds a new tab to the list.
 */
export async function addTab(title: string, value: string, type: 'label' | 'hash' = 'label'): Promise<void> {
    const settings = await getSettings();
    const newTab: Tab = {
        id: crypto.randomUUID(),
        title: title.trim(),
        value: value.trim(),
        type: type
    };

    // Avoid duplicates based on value
    if (!settings.tabs.some((t) => t.value === newTab.value)) {
        settings.tabs.push(newTab);
        await saveSettings(settings);
    }
}

/**
 * Removes a tab by ID.
 */
export async function removeTab(tabId: string): Promise<void> {
    const settings = await getSettings();
    settings.tabs = settings.tabs.filter((t) => t.id !== tabId);
    await saveSettings(settings);
}

/**
 * Updates an existing tab.
 */
export async function updateTab(tabId: string, updates: Partial<Tab>): Promise<void> {
    const settings = await getSettings();
    const index = settings.tabs.findIndex((t) => t.id === tabId);
    if (index !== -1) {
        settings.tabs[index] = { ...settings.tabs[index], ...updates };
        await saveSettings(settings);
    }
}

/**
 * Updates the order of tabs.
 */
export async function updateTabOrder(newTabs: Tab[]): Promise<void> {
    const settings = await getSettings();
    settings.tabs = newTabs;
    await saveSettings(settings);
}
