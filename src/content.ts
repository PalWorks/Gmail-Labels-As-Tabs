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
        if (area === 'sync' && changes.labels) {
            currentSettings!.labels = changes.labels.newValue;
            renderTabs();
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
/**
 * Render the tabs based on current settings.
 */
/**
 * Render the tabs based on current settings.
 */
/**
 * Render the tabs based on current settings.
 */
function renderTabs() {
    const bar = document.getElementById(TABS_BAR_ID);
    if (!bar || !currentSettings) return;

    bar.innerHTML = ''; // Clear existing

    currentSettings.labels.forEach(label => {
        const tab = document.createElement('div'); // Changed to div to handle nested clicks better
        tab.className = 'gmail-tab';
        tab.dataset.label = label.name;

        // Tab Content (Name)
        const nameSpan = document.createElement('span');
        nameSpan.className = 'tab-name';
        nameSpan.textContent = label.displayName || label.name;
        tab.appendChild(nameSpan);

        // Hover Actions Container
        const actions = document.createElement('div');
        actions.className = 'tab-actions';

        // Edit Button (3 dots)
        const editBtn = document.createElement('div');
        editBtn.className = 'tab-action-btn edit-btn';
        editBtn.innerHTML = '⋮'; // Vertical ellipsis
        editBtn.title = 'Edit Tab';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showEditModal(label);
        });
        actions.appendChild(editBtn);

        // Delete Button (X)
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

        // Main Tab Click (Navigation)
        tab.addEventListener('click', () => {
            window.location.href = getLabelUrl(label.name);
        });

        bar.appendChild(tab);
    });

    // Add "Add Tab" button
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

// --- Label Dropdown Integration ---

function initLabelDropdownObserver() {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node instanceof HTMLElement) {
                    // Check if the added node is a menu or contains a menu
                    if (node.classList.contains('J-M') || node.querySelector('.J-M')) {
                        handleMenuOpen(node);
                    }
                }
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

function handleMenuOpen(container: HTMLElement) {
    // Gmail menus often have role="menu"
    const menu = container.classList.contains('J-M') ? container : container.querySelector('.J-M');
    if (!menu) return;

    // Check if this is a label menu by looking for specific items
    // "Label colour" is a strong indicator
    const labelColorItem = Array.from(menu.querySelectorAll('div')).find(el => el.textContent === 'Label colour' || el.textContent === 'Label color');

    if (labelColorItem) {
        injectLabelOptions(menu as HTMLElement);
    }
}

function injectLabelOptions(menu: HTMLElement) {
    // Avoid double injection
    if (menu.querySelector('.gmail-tabs-option')) return;

    // Find the label name. This is tricky as it's not directly in the menu.
    // Usually the menu is triggered by a button that has the label name or ID.
    // Or we can look at the active element or the element that triggered the menu.
    // For now, let's try to find the separator to insert after.
    const separator = menu.querySelector('.J-M-Jz'); // Common separator class

    // Create our options
    const addToTabsItem = createMenuItem('Add to tabs', async () => {
        const labelName = getLabelNameFromTrigger();
        if (labelName) {
            await addLabel(labelName);
            renderTabs();
            menu.style.display = 'none'; // Close menu
        }
    });

    const addWithSubItem = createMenuItem('Add to tabs (including sublabels)', async () => {
        const labelName = getLabelNameFromTrigger();
        if (labelName) {
            // TODO: Implement sublabel logic. For now just add the main label.
            await addLabel(labelName);
            renderTabs();
            menu.style.display = 'none';
        }
    });

    // Insert at the top or after "Label colour"
    if (menu.firstChild) {
        menu.insertBefore(addWithSubItem, menu.firstChild);
        menu.insertBefore(addToTabsItem, menu.firstChild);

        // Add a separator
        const sep = document.createElement('div');
        sep.className = 'J-M-Jz gmail-tabs-separator';
        sep.setAttribute('role', 'separator');
        sep.style.userSelect = 'none';
        menu.insertBefore(sep, addWithSubItem.nextSibling?.nextSibling || null);
    }
}

function createMenuItem(text: string, onClick: () => void): HTMLElement {
    const item = document.createElement('div');
    item.className = 'J-N J-Ks gmail-tabs-option'; // Gmail menu item classes
    item.setAttribute('role', 'menuitem');
    item.style.userSelect = 'none';

    item.innerHTML = `
        <div class="J-N-Jz">
            <div class="J-N-C">
                <div class="J-N-J5"></div>
            </div>
            <div class="J-N-T">${text}</div>
        </div>
    `;

    item.addEventListener('mouseenter', () => {
        item.classList.add('J-N-JT'); // Hover state
    });
    item.addEventListener('mouseleave', () => {
        item.classList.remove('J-N-JT');
    });
    item.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick();
    });

    return item;
}

function getLabelNameFromTrigger(): string | null {
    // This is the hardest part: finding which label was clicked.
    // When a menu opens, the trigger element usually has 'aria-expanded="true"'.
    // In the sidebar, the label element usually has a title or text content.

    // Look for the active menu button
    const activeBtn = document.querySelector('div[aria-expanded="true"][role="button"], span[aria-expanded="true"]');
    if (activeBtn) {
        // Traverse up to find the label container
        // The structure varies. Often the button is inside a container that has the label name in a 'title' attribute or text.
        // For sidebar labels:
        // <div class="CL" ...>
        //   <div class="TO" ...>
        //      <div class="n0" title="Label Name">Label Name</div>
        //   </div>
        // </div>

        // Let's try to find a 'title' attribute in the vicinity
        let parent = activeBtn.parentElement;
        while (parent && parent.tagName !== 'BODY') {
            const labelNameEl = parent.querySelector('[title]');
            if (labelNameEl) {
                const title = labelNameEl.getAttribute('title');
                if (title && title !== 'Label colour') return title;
            }
            // Also check if the parent itself has a title (common for the row)
            if (parent.getAttribute('title')) {
                return parent.getAttribute('title');
            }
            parent = parent.parentElement;
            if (parent && parent.classList.contains('aim')) break; // 'aim' is often the row container
        }
    }
    return null;
}

// Run init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Start the dropdown observer
initLabelDropdownObserver();
