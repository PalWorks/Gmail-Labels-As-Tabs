/**
 * content.ts
 *
 * Main content script for Gmail Labels as Tabs.
 * Handles DOM injection, navigation monitoring, and tab rendering.
 */

import { getSettings, saveSettings, addLabel, removeLabel, updateLabelOrder, updateLabel, Settings, TabLabel } from './utils/storage';

// Start the dropdown observer
// initLabelDropdownObserver(); // Removed duplicate call

// Selectors for Gmail elements
// We target the main toolbar container to inject below it.
const TOOLBAR_SELECTORS = [
    '.G-atb', // Main toolbar container (often has this class)
    '.aeF > div:first-child', // Fallback
];

const TABS_BAR_ID = 'gmail-labels-as-tabs-bar';
const MODAL_ID = 'gmail-labels-settings-modal';

let currentSettings: Settings | null = null;
let observer: MutationObserver | null = null;

/**
 * Initialize the extension.
 */
async function init() {
    currentSettings = await getSettings();

    // Listen for storage changes to update tabs in real-time
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'sync') {
            if (changes.labels) {
                currentSettings!.labels = changes.labels.newValue;
                renderTabs();
            }
            if (changes.theme) {
                currentSettings!.theme = changes.theme.newValue;
                applyTheme(currentSettings!.theme);
            }
        }
    });

    // Initial render attempt
    attemptInjection();

    // Start observing DOM for navigation/loading
    startObserver();

    // Listen for URL changes (popstate)
    window.addEventListener('popstate', handleUrlChange);

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'TOGGLE_SETTINGS') {
            toggleSettingsModal();
        }
    });
}

/**
 * Attempt to inject the tabs bar.
 * Retries if the insertion point isn't found yet.
 */
function attemptInjection() {
    // If bar exists, check if it's in the right place (top)
    const existingBar = document.getElementById(TABS_BAR_ID);

    let injectionPoint: Element | null = null;
    for (const selector of TOOLBAR_SELECTORS) {
        // We want the visible toolbar
        const candidates = document.querySelectorAll(selector);
        for (const el of candidates) {
            if (el.getBoundingClientRect().height > 0) {
                injectionPoint = el;
                break;
            }
        }
        if (injectionPoint) break;
    }

    if (injectionPoint) {
        if (!existingBar) {
            const tabsBar = createTabsBar();
            injectionPoint.insertAdjacentElement('afterend', tabsBar);
            renderTabs();
        } else if (existingBar.previousElementSibling !== injectionPoint) {
            // Re-attach if moved
            injectionPoint.insertAdjacentElement('afterend', existingBar);
        }
        updateActiveTab();
    } else {
        // Retry shortly if not found (Gmail loading)
        setTimeout(attemptInjection, 500);
    }
}

/**
 * Create the container for the tabs.
 */
function createTabsBar(): HTMLElement {
    const bar = document.createElement('div');
    bar.id = TABS_BAR_ID;
    bar.className = 'gmail-tabs-bar';
    return bar;
}

/**
 * Render the tabs based on current settings.
 */

// --- Drag Handlers ---
let dragSrcEl: HTMLElement | null = null;

function handleDragStart(this: HTMLElement, e: DragEvent) {
    dragSrcEl = this;
    this.classList.add('dragging');
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.dataset.index || '');
        // Set a transparent drag image if possible, or let browser handle it
    }
}

function handleDragOver(e: DragEvent) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
    }
    return false;
}

function handleDragEnter(this: HTMLElement, e: DragEvent) {
    this.classList.add('drag-over');
}

function handleDragLeave(this: HTMLElement, e: DragEvent) {
    // Prevent flickering when entering child elements
    if (this.contains(e.relatedTarget as Node)) return;
    this.classList.remove('drag-over');
}

async function handleDrop(this: HTMLElement, e: DragEvent) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    // Remove the drop marker
    this.classList.remove('drag-over');

    if (dragSrcEl !== this) {
        const oldIndex = parseInt(dragSrcEl!.dataset.index || '0');
        const newIndex = parseInt(this.dataset.index || '0');

        // Optimistic update
        if (currentSettings) {
            const labels = [...currentSettings.labels];
            const [movedLabel] = labels.splice(oldIndex, 1);
            labels.splice(newIndex, 0, movedLabel);

            // Update local state immediately
            currentSettings.labels = labels;
            renderTabs();

            // Persist
            await updateLabelOrder(labels);
        }
    }
    return false;
}

function handleDragEnd(this: HTMLElement, e: DragEvent) {
    dragSrcEl = null;
    document.querySelectorAll('.gmail-tab').forEach(item => {
        item.classList.remove('drag-over', 'dragging');
    });
}

function renderTabs() {
    const bar = document.getElementById(TABS_BAR_ID);
    if (!bar || !currentSettings) return;
    bar.innerHTML = '';

    currentSettings.labels.forEach((label, index) => {
        const tab = document.createElement('div');
        tab.className = 'gmail-tab';
        tab.setAttribute('draggable', 'true');
        tab.dataset.index = index.toString();
        tab.dataset.label = label.name;

        // Drag Handle
        const dragHandle = document.createElement('div');
        dragHandle.className = 'tab-drag-handle';
        dragHandle.title = 'Drag to reorder';
        dragHandle.innerHTML = '<svg viewBox="0 0 24 24"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>';
        tab.appendChild(dragHandle);

        const nameSpan = document.createElement('span');
        nameSpan.className = 'tab-name';
        nameSpan.textContent = label.displayName || label.name;
        tab.appendChild(nameSpan);

        const actions = document.createElement('div');
        actions.className = 'tab-actions';

        const editBtn = document.createElement('div');
        editBtn.className = 'tab-action-btn edit-btn';
        editBtn.innerHTML = '⋮';
        editBtn.title = 'Edit Tab';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showEditModal(label);
        });
        actions.appendChild(editBtn);

        const deleteBtn = document.createElement('div');
        deleteBtn.className = 'tab-action-btn delete-btn';
        deleteBtn.innerHTML = '✕';
        deleteBtn.title = 'Remove Tab';
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm(`Remove tab "${label.displayName || label.name}"?`)) {
                await removeLabel(label.id);
                currentSettings = await getSettings();
                renderTabs();
            }
        });
        actions.appendChild(deleteBtn);
        tab.appendChild(actions);

        tab.addEventListener('click', (e) => {
            // Don't navigate if clicking actions or drag handle
            if ((e.target as HTMLElement).closest('.tab-actions') || (e.target as HTMLElement).closest('.tab-drag-handle')) {
                return;
            }
            window.location.href = getLabelUrl(label.name);
        });

        // Drag Events
        tab.addEventListener('dragstart', handleDragStart);
        tab.addEventListener('dragenter', handleDragEnter);
        tab.addEventListener('dragover', handleDragOver);
        tab.addEventListener('dragleave', handleDragLeave);
        tab.addEventListener('drop', handleDrop);
        tab.addEventListener('dragend', handleDragEnd);

        bar.appendChild(tab);
    });

    const addBtn = document.createElement('div');
    addBtn.className = 'add-tab-btn';
    addBtn.innerHTML = '+';
    addBtn.title = 'Configure Tabs';
    addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSettingsModal();
    });
    bar.appendChild(addBtn);

    updateActiveTab();
}

// --- Edit Modal ---
function showEditModal(label: TabLabel) {
    const modal = document.createElement('div');
    modal.className = 'gmail-tabs-modal';

    modal.innerHTML = `
        <div class="modal-content edit-tab-modal">
            <div class="modal-header">
                <h3>Edit Tab</h3>
                <button class="close-btn">✕</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Label name (Original):</label>
                    <input type="text" value="${label.name}" disabled class="disabled-input">
                </div>
                <div class="form-group">
                    <label>Display Name:</label>
                    <input type="text" id="edit-display-name" value="${label.displayName || label.name}">
                </div>
                <div class="modal-actions">
                    <button id="edit-save-btn" class="primary-btn">Save</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.querySelector('.close-btn')?.addEventListener('click', close);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
    });

    modal.querySelector('#edit-save-btn')?.addEventListener('click', async () => {
        const displayName = (modal.querySelector('#edit-display-name') as HTMLInputElement).value;

        if (displayName) {
            await updateLabel(label.id, {
                displayName: displayName.trim()
            });

            close();
            // Refresh settings and re-render
            currentSettings = await getSettings();
            renderTabs();
        }
    });
}

/**
 * Generate the URL for a given label.
 */
function getLabelUrl(labelName: string): string {
    const encoded = encodeURIComponent(labelName).replace(/%20/g, '+');
    return `https://mail.google.com/mail/u/0/#label/${encoded}`;
}

/**
 * Highlight the active tab based on current URL.
 */
function updateActiveTab() {
    const hash = window.location.hash;
    const bar = document.getElementById(TABS_BAR_ID);
    if (!bar) return;

    const tabs = bar.querySelectorAll('.gmail-tab');
    tabs.forEach(t => {
        const tab = t as HTMLElement;
        const labelName = tab.dataset.label;
        if (!labelName) return;

        const cleanHash = decodeURIComponent(hash.replace('#label/', '').replace(/\+/g, ' '));

        if (cleanHash === labelName || hash.includes(`#label/${encodeURIComponent(labelName).replace(/%20/g, '+')}`)) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

function handleUrlChange() {
    updateActiveTab();
}

function startObserver() {
    if (observer) observer.disconnect();

    observer = new MutationObserver((mutations) => {
        attemptInjection();
        updateActiveTab();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
}

// --- Settings Modal Logic ---

function toggleSettingsModal() {
    let modal = document.getElementById(MODAL_ID);
    if (modal) {
        modal.remove();
    } else {
        createSettingsModal();
    }
}

function createSettingsModal() {
    const modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.className = 'gmail-tabs-modal';

    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Configure Tabs</h3>
                <button class="close-btn">✕</button>
            </div>
            <div class="modal-body">
                <div class="input-group">
                    <input type="text" id="modal-new-label" placeholder="Label name (e.g. 'Work')">
                    <button id="modal-add-btn">Add</button>
                </div>
                <ul id="modal-labels-list"></ul>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Event Listeners
    modal.querySelector('.close-btn')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    const addBtn = modal.querySelector('#modal-add-btn') as HTMLButtonElement;
    const input = modal.querySelector('#modal-new-label') as HTMLInputElement;
    const list = modal.querySelector('#modal-labels-list') as HTMLUListElement;

    const refreshList = async () => {
        const settings = await getSettings();
        list.innerHTML = '';
        settings.labels.forEach((label, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${label.name}</span>
                <div class="actions">
                    ${index > 0 ? '<button class="up-btn">↑</button>' : ''}
                    ${index < settings.labels.length - 1 ? '<button class="down-btn">↓</button>' : ''}
                    <button class="remove-btn">✕</button>
                </div>
            `;

            li.querySelector('.remove-btn')?.addEventListener('click', async () => {
                await removeLabel(label.id);
                refreshList();
            });

            li.querySelector('.up-btn')?.addEventListener('click', async () => {
                const newLabels = [...settings.labels];
                [newLabels[index - 1], newLabels[index]] = [newLabels[index], newLabels[index - 1]];
                await updateLabelOrder(newLabels);
                refreshList();
            });

            li.querySelector('.down-btn')?.addEventListener('click', async () => {
                const newLabels = [...settings.labels];
                [newLabels[index + 1], newLabels[index]] = [newLabels[index], newLabels[index + 1]];
                await updateLabelOrder(newLabels);
                refreshList();
            });

            list.appendChild(li);
        });
    };

    addBtn.addEventListener('click', async () => {
        let value = input.value.trim();
        if (value) {
            // Remove "label:" prefix if present (case-insensitive)
            if (value.toLowerCase().startsWith('label:')) {
                value = value.substring(6).trim();
            }

            if (value) {
                await addLabel(value);
                input.value = '';
                refreshList();
            }
        }
    });

    refreshList();
}

// Run init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// --- Theme Management ---
function applyTheme(theme: 'system' | 'light' | 'dark') {
    document.body.classList.remove('force-dark', 'force-light');

    if (theme === 'dark') {
        document.body.classList.add('force-dark');
    } else if (theme === 'light') {
        document.body.classList.add('force-light');
    }
    // 'system' does nothing, letting media queries handle it
}

// Initial Theme Application
if (currentSettings) {
    applyTheme(currentSettings.theme);
} else {
    getSettings().then(settings => applyTheme(settings.theme));
}
