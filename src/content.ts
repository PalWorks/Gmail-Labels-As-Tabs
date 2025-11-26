/**
 * content.ts
 *
 * Main content script for Gmail Labels as Tabs.
 * Handles DOM injection, navigation monitoring, and tab rendering.
 */

import { getSettings, saveSettings, addTab, removeTab, updateTabOrder, updateTab, Settings, Tab } from './utils/storage';

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
            if (changes.tabs) {
                currentSettings!.tabs = changes.tabs.newValue;
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
            const tabs = [...currentSettings.tabs];
            const [movedTab] = tabs.splice(oldIndex, 1);
            tabs.splice(newIndex, 0, movedTab);

            // Update local state immediately
            currentSettings.tabs = tabs;
            renderTabs();

            // Persist
            await updateTabOrder(tabs);
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

    currentSettings.tabs.forEach((tab, index) => {
        const tabEl = document.createElement('div');
        tabEl.className = 'gmail-tab';
        tabEl.setAttribute('draggable', 'true');
        tabEl.dataset.index = index.toString();
        tabEl.dataset.value = tab.value;
        tabEl.dataset.type = tab.type;

        // Drag Handle
        const dragHandle = document.createElement('div');
        dragHandle.className = 'tab-drag-handle';
        dragHandle.title = 'Drag to reorder';
        dragHandle.innerHTML = '<svg viewBox="0 0 24 24"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>';
        tabEl.appendChild(dragHandle);

        const nameSpan = document.createElement('span');
        nameSpan.className = 'tab-name';
        nameSpan.textContent = tab.title;
        tabEl.appendChild(nameSpan);

        const actions = document.createElement('div');
        actions.className = 'tab-actions';

        const editBtn = document.createElement('div');
        editBtn.className = 'tab-action-btn edit-btn';
        editBtn.innerHTML = '⋮';
        editBtn.title = 'Edit Tab';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showEditModal(tab);
        });
        actions.appendChild(editBtn);

        const deleteBtn = document.createElement('div');
        deleteBtn.className = 'tab-action-btn delete-btn';
        deleteBtn.innerHTML = '✕';
        deleteBtn.title = 'Remove Tab';
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm(`Remove tab "${tab.title}"?`)) {
                await removeTab(tab.id);
                currentSettings = await getSettings();
                renderTabs();
            }
        });
        actions.appendChild(deleteBtn);
        tabEl.appendChild(actions);

        tabEl.addEventListener('click', (e) => {
            // Don't navigate if clicking actions or drag handle
            if ((e.target as HTMLElement).closest('.tab-actions') || (e.target as HTMLElement).closest('.tab-drag-handle')) {
                return;
            }

            if (tab.type === 'hash') {
                window.location.hash = tab.value;
            } else {
                window.location.href = getLabelUrl(tab.value);
            }
        });

        // Drag Events
        tabEl.addEventListener('dragend', handleDragEnd);

        bar.appendChild(tabEl);
    });

    // "Save View" Button (formerly Pin, now Plus)
    const saveViewBtn = document.createElement('div');
    saveViewBtn.className = 'gmail-tab-btn save-view-btn';
    // Google Material Symbol: add_circle (outlined)
    saveViewBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>';
    saveViewBtn.title = 'Save Current View as Tab';
    saveViewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showPinModal();
    });
    bar.appendChild(saveViewBtn);

    // "Manage Tabs" Button (formerly Add, now Pencil)
    const manageBtn = document.createElement('div');
    manageBtn.className = 'gmail-tab-btn manage-btn';
    // Google Material Symbol: edit
    manageBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';
    manageBtn.title = 'Manage Tabs';
    manageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSettingsModal();
    });
    bar.appendChild(manageBtn);

    updateActiveTab();
}

// --- Pin Modal ---
function showPinModal() {
    const currentHash = window.location.hash;
    if (!currentHash || currentHash === '#inbox') {
        alert('Cannot pin the Inbox. Navigate to a label or search first.');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'gmail-tabs-modal';

    // Suggest a title based on the hash
    let suggestedTitle = 'New Tab';
    if (currentHash.startsWith('#label/')) {
        suggestedTitle = decodeURIComponent(currentHash.replace('#label/', '')).replace(/\+/g, ' ');
    } else if (currentHash.startsWith('#search/')) {
        suggestedTitle = 'Search: ' + decodeURIComponent(currentHash.replace('#search/', '')).replace(/\+/g, ' ');
    } else if (currentHash.startsWith('#advanced-search/')) {
        suggestedTitle = 'Advanced Search';
    }

    modal.innerHTML = `
        <div class="modal-content edit-tab-modal">
            <div class="modal-header">
                <h3>Pin Current View</h3>
                <button class="close-btn">✕</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>View URL (Hash):</label>
                    <input type="text" value="${currentHash}" disabled class="disabled-input">
                </div>
                <div class="form-group">
                    <label>Tab Title:</label>
                    <input type="text" id="pin-title" value="${suggestedTitle}">
                </div>
                <div class="modal-actions">
                    <button id="pin-save-btn" class="primary-btn">Pin Tab</button>
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

    modal.querySelector('#pin-save-btn')?.addEventListener('click', async () => {
        const title = (modal.querySelector('#pin-title') as HTMLInputElement).value;

        if (title) {
            await addTab(title, currentHash, 'hash');
            close();
            // Refresh settings and re-render
            currentSettings = await getSettings();
            renderTabs();
        }
    });
}

// --- Edit Modal ---
function showEditModal(tab: Tab) {
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
                    <label>Value (${tab.type}):</label>
                    <input type="text" value="${tab.value}" disabled class="disabled-input">
                </div>
                <div class="form-group">
                    <label>Display Name:</label>
                    <input type="text" id="edit-display-name" value="${tab.title}">
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
        const title = (modal.querySelector('#edit-display-name') as HTMLInputElement).value;

        if (title) {
            await updateTab(tab.id, {
                title: title.trim()
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
        const tabEl = t as HTMLElement;
        const tabValue = tabEl.dataset.value;
        const tabType = tabEl.dataset.type;
        if (!tabValue) return;

        let isActive = false;

        if (tabType === 'hash') {
            // Exact match for hash tabs
            isActive = hash === tabValue;
        } else {
            // Label matching logic
            const cleanHash = decodeURIComponent(hash.replace('#label/', '').replace(/\+/g, ' '));
            isActive = cleanHash === tabValue || hash.includes(`#label/${encodeURIComponent(tabValue).replace(/%20/g, '+')}`);
        }

        if (isActive) {
            tabEl.classList.add('active');
        } else {
            tabEl.classList.remove('active');
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
                <div class="form-group theme-selector-group">
                    <label>Theme</label>
                    <div class="theme-options">
                        <button class="theme-btn" data-theme="system">System</button>
                        <button class="theme-btn" data-theme="light">Light</button>
                        <button class="theme-btn" data-theme="dark">Dark</button>
                    </div>
                </div>
                <div style="border-bottom: 1px solid var(--list-border); margin-bottom: 16px;"></div>
                
                <div class="add-tab-section">
                    <div class="input-group">
                        <input type="text" id="modal-new-label" placeholder="Label Name or View URL">
                    </div>
                    <div id="modal-error-msg" class="input-error-msg" style="display: none;"></div>
                    <div class="input-group" id="modal-title-group" style="display:none;">
                        <input type="text" id="modal-new-title" placeholder="Tab Title">
                    </div>
                    <button id="modal-add-btn" class="primary-btn" style="width: 100%; margin-bottom: 16px;">Add Tab</button>
                </div>
                <div style="border-bottom: 1px solid var(--list-border); margin-bottom: 16px;"></div>
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
    const titleInput = modal.querySelector('#modal-new-title') as HTMLInputElement;
    const titleGroup = modal.querySelector('#modal-title-group') as HTMLElement;
    const list = modal.querySelector('#modal-labels-list') as HTMLUListElement;

    // Smart Input Detection
    input.addEventListener('input', () => {
        const value = input.value.trim();
        const isUrl = value.includes('http') || value.includes('mail.google.com') || value.startsWith('#');

        if (isUrl) {
            titleGroup.style.display = 'flex';
            // Auto-extract title if possible (simple heuristic)
            if (!titleInput.value) {
                if (value.includes('#search/')) {
                    titleInput.value = decodeURIComponent(value.split('#search/')[1]).replace(/\+/g, ' ');
                } else if (value.includes('#label/')) {
                    titleInput.value = decodeURIComponent(value.split('#label/')[1]).replace(/\+/g, ' ');
                }
            }
        } else {
            // For simple labels, we can hide the title input or keep it optional.
            // Let's hide it to keep it simple, unless user manually opened it? 
            // For now, auto-hide if it goes back to simple text and title is empty.
            if (!titleInput.value) {
                titleGroup.style.display = 'none';
            }
        }
    });

    // Modal Drag and Drop Logic
    let modalDragSrcEl: HTMLElement | null = null;

    const handleModalDragStart = function (this: HTMLElement, e: DragEvent) {
        modalDragSrcEl = this;
        this.classList.add('dragging');
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', this.dataset.index || '');
        }
    };

    const handleModalDragOver = function (this: HTMLElement, e: DragEvent) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }

        // Calculate position within the element
        const rect = this.getBoundingClientRect();
        const relY = e.clientY - rect.top;
        const height = rect.height;

        // Remove existing classes first
        this.classList.remove('drop-above', 'drop-below');

        if (relY < height / 2) {
            this.classList.add('drop-above');
        } else {
            this.classList.add('drop-below');
        }

        return false;
    };

    const handleModalDragEnter = function (this: HTMLElement) {
        this.classList.add('drag-over');
    };

    const handleModalDragLeave = function (this: HTMLElement) {
        this.classList.remove('drag-over', 'drop-above', 'drop-below');
    };

    const handleModalDrop = async function (this: HTMLElement, e: DragEvent) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }

        const dropPosition = this.classList.contains('drop-above') ? 'above' : 'below';
        this.classList.remove('drag-over', 'drop-above', 'drop-below');

        if (modalDragSrcEl !== this) {
            const oldIndex = parseInt(modalDragSrcEl!.dataset.index || '0');
            let newIndex = parseInt(this.dataset.index || '0');

            // Adjust newIndex based on drop position
            if (dropPosition === 'below') {
                newIndex++;
            }

            // If moving down, the index shifts because we remove the item first
            // But if we are inserting 'below' a target that is essentially at index+1
            // Let's simplify: remove first, then insert.

            const settings = await getSettings();
            const newTabs = [...settings.tabs];
            const [movedTab] = newTabs.splice(oldIndex, 1);

            // If we removed an item from before the target, the target's index shifted down by 1
            if (oldIndex < newIndex) {
                newIndex--;
            }

            newTabs.splice(newIndex, 0, movedTab);

            await updateTabOrder(newTabs);
            refreshList();
            // Also update the main bar
            currentSettings = await getSettings();
            renderTabs();
        }
        return false;
    };

    const handleModalDragEnd = function (this: HTMLElement) {
        modalDragSrcEl = null;
        list.querySelectorAll('li').forEach(item => {
            item.classList.remove('drag-over', 'dragging', 'drop-above', 'drop-below');
        });
    };

    const refreshList = async () => {
        const settings = await getSettings();
        list.innerHTML = '';
        settings.tabs.forEach((tab, index) => {
            const li = document.createElement('li');
            li.setAttribute('draggable', 'true');
            li.dataset.index = index.toString();

            li.innerHTML = `
                <div class="modal-drag-handle" title="Drag to reorder">
                    <svg viewBox="0 0 24 24"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                </div>
                <span class="tab-info">${tab.title} <small style="color: #888; font-size: 0.8em;">(${tab.type === 'hash' ? 'Custom' : 'Label'})</small></span>
                <div class="actions">
                    ${index > 0 ? '<button class="up-btn">↑</button>' : ''}
                    ${index < settings.tabs.length - 1 ? '<button class="down-btn">↓</button>' : ''}
                    <button class="remove-btn">✕</button>
                </div>
            `;

            li.querySelector('.remove-btn')?.addEventListener('click', async () => {
                await removeTab(tab.id);
                refreshList();
                currentSettings = await getSettings();
                renderTabs();
            });

            li.querySelector('.up-btn')?.addEventListener('click', async () => {
                const newTabs = [...settings.tabs];
                [newTabs[index - 1], newTabs[index]] = [newTabs[index], newTabs[index - 1]];
                await updateTabOrder(newTabs);
                refreshList();
                currentSettings = await getSettings();
                renderTabs();
            });

            li.querySelector('.down-btn')?.addEventListener('click', async () => {
                const newTabs = [...settings.tabs];
                [newTabs[index + 1], newTabs[index]] = [newTabs[index], newTabs[index + 1]];
                await updateTabOrder(newTabs);
                refreshList();
                currentSettings = await getSettings();
                renderTabs();
            });

            // Add Drag Listeners
            li.addEventListener('dragstart', handleModalDragStart);
            li.addEventListener('dragover', handleModalDragOver);
            li.addEventListener('dragenter', handleModalDragEnter);
            li.addEventListener('dragleave', handleModalDragLeave);
            li.addEventListener('drop', handleModalDrop);
            li.addEventListener('dragend', handleModalDragEnd);

            list.appendChild(li);
        });
    };

    const errorMsg = modal.querySelector('#modal-error-msg') as HTMLElement;

    // Clear error on input
    input.addEventListener('input', () => {
        input.classList.remove('input-error');
        errorMsg.style.display = 'none';
        // ... existing input logic ...
    });

    addBtn.addEventListener('click', async () => {
        let value = input.value.trim();
        let title = titleInput.value.trim();

        if (value) {
            // Check if it's a URL/Hash
            let type: 'label' | 'hash' = 'label';
            let finalValue = value;

            if (value.includes('http') || value.includes('mail.google.com') || value.startsWith('#')) {
                type = 'hash';
                // Extract Hash
                if (value.includes('#')) {
                    finalValue = '#' + value.split('#')[1];
                }
            } else {
                // It's a Label
                if (value.toLowerCase().startsWith('label:')) {
                    finalValue = value.substring(6).trim();
                }
            }

            // Duplicate Check
            const settings = await getSettings();
            const existingTab = settings.tabs.find(t => t.value === finalValue);

            if (existingTab) {
                input.classList.add('input-error');
                errorMsg.textContent = `View URL / Label already exists with tab display name as "${existingTab.title}"`;
                errorMsg.style.display = 'block';
                return;
            }

            if (type === 'hash') {
                if (!title) {
                    alert('Please enter a Title for this tab.');
                    titleInput.focus();
                    return;
                }
                await addTab(title, finalValue, 'hash');
            } else {
                await addTab(title || finalValue, finalValue, 'label');
            }

            input.value = '';
            titleInput.value = '';
            titleGroup.style.display = 'none';
            input.classList.remove('input-error');
            errorMsg.style.display = 'none';

            refreshList();
            // Also update the main bar
            currentSettings = await getSettings();
            renderTabs();
        }
    });

    refreshList();

    // Theme Selector Logic
    const themeBtns = modal.querySelectorAll('.theme-btn');
    const updateThemeUI = (activeTheme: string) => {
        themeBtns.forEach(btn => {
            if ((btn as HTMLElement).dataset.theme === activeTheme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    };

    // Initialize UI
    getSettings().then(settings => {
        updateThemeUI(settings.theme);
    });

    themeBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const theme = (btn as HTMLElement).dataset.theme as 'system' | 'light' | 'dark';
            await saveSettings({ theme });
            updateThemeUI(theme);
            applyTheme(theme);
            // currentSettings will be updated via storage listener
        });
    });
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
