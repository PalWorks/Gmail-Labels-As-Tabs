/**
 * options.ts
 *
 * Logic for the options page.
 * Handles adding, removing, and reordering tabs for specific accounts.
 */

import { getSettings, saveSettings, addTab, removeTab, updateTabOrder, getAllAccounts, Settings, Tab } from './utils/storage';

const labelList = document.getElementById('labels-list') as HTMLDivElement;
const newLabelInput = document.getElementById('new-label-input') as HTMLInputElement;
const addBtn = document.getElementById('add-btn') as HTMLButtonElement;
const exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
const importBtn = document.getElementById('import-btn') as HTMLButtonElement;
const importFile = document.getElementById('import-file') as HTMLInputElement;
const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;
const accountSelect = document.getElementById('account-select') as HTMLSelectElement;

let currentAccount: string | null = null;

// Initial setup and event listeners
document.addEventListener('DOMContentLoaded', async () => {
    await loadAccounts();

    // Set initial theme selection if account loaded
    if (currentAccount) {
        const settings = await getSettings(currentAccount);
        if (themeSelect) {
            themeSelect.value = settings.theme;
        }
        renderList();
    }

    // Handle Account Change
    accountSelect?.addEventListener('change', async () => {
        currentAccount = accountSelect.value;
        const settings = await getSettings(currentAccount);
        if (themeSelect) {
            themeSelect.value = settings.theme;
        }
        renderList();
    });

    // Handle Theme Change
    themeSelect?.addEventListener('change', async () => {
        if (!currentAccount) return;
        const theme = themeSelect.value as 'system' | 'light' | 'dark';
        await saveSettings(currentAccount, { theme });
    });
});

async function loadAccounts() {
    const accounts = await getAllAccounts();
    if (accountSelect) {
        accountSelect.innerHTML = '';
        if (accounts.length === 0) {
            const option = document.createElement('option');
            option.text = "No accounts found. Please open Gmail first.";
            option.disabled = true;
            option.selected = true;
            accountSelect.appendChild(option);
            disableControls(true);
        } else {
            accounts.forEach(acc => {
                const option = document.createElement('option');
                option.value = acc;
                option.text = acc;
                accountSelect.appendChild(option);
            });
            // Select first one by default
            currentAccount = accounts[0];
            accountSelect.value = currentAccount;
            disableControls(false);
        }
    }
}

function disableControls(disabled: boolean) {
    if (addBtn) addBtn.disabled = disabled;
    if (newLabelInput) newLabelInput.disabled = disabled;
    if (exportBtn) exportBtn.disabled = disabled;
    if (importBtn) importBtn.disabled = disabled;
    if (themeSelect) themeSelect.disabled = disabled;
}

// Render the list of tabs
async function renderList() {
    if (!currentAccount) return;
    const settings = await getSettings(currentAccount);
    if (!labelList) return;
    labelList.innerHTML = '';

    settings.tabs.forEach((tab, index) => {
        const li = document.createElement('li');
        li.draggable = true;
        li.dataset.id = tab.id;
        li.dataset.index = index.toString();

        li.innerHTML = `
      <div style="display: flex; align-items: center;">
        <span class="drag-handle">☰</span>
        <span>${escapeHtml(tab.title)}</span>
        ${tab.type === 'hash' ? '<small style="color:#888; margin-left:4px;">(Custom)</small>' : ''}
      </div>
      <button class="remove-btn" title="Remove">✕</button>
    `;

        // Remove handler
        const removeBtn = li.querySelector('.remove-btn') as HTMLButtonElement;
        removeBtn.addEventListener('click', async () => {
            if (currentAccount) {
                await removeTab(currentAccount, tab.id);
                renderList();
            }
        });

        // Drag events
        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dragover', handleDragOver);
        li.addEventListener('drop', handleDrop);
        li.addEventListener('dragenter', handleDragEnter);
        li.addEventListener('dragleave', handleDragLeave);

        labelList.appendChild(li);
    });
}

// Add new tab
if (addBtn) {
    addBtn.addEventListener('click', async () => {
        const name = newLabelInput.value;
        if (name && currentAccount) {
            await addTab(currentAccount, name, name, 'label');
            newLabelInput.value = '';
            renderList();
        }
    });
}

// Allow Enter key to submit
if (newLabelInput) {
    newLabelInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addBtn.click();
        }
    });
}

// Export settings
if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
        if (!currentAccount) return;
        const settings = await getSettings(currentAccount);
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `gmail_tabs_settings_${currentAccount}.json`);
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });
}

// Import settings
if (importBtn) {
    importBtn.addEventListener('click', () => {
        importFile.click();
    });
}

if (importFile) {
    importFile.addEventListener('change', (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file || !currentAccount) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string;
                const settings = JSON.parse(content);
                if (Array.isArray(settings.tabs)) {
                    await saveSettings(currentAccount!, settings);
                    renderList();
                    alert('Settings imported successfully!');
                } else {
                    alert('Invalid JSON format.');
                }
            } catch (err) {
                console.error(err);
                alert('Error parsing JSON.');
            }
        };
        reader.readAsText(file);
    });
}

// Drag and Drop Logic
let dragSrcEl: HTMLElement | null = null;

function handleDragStart(this: HTMLElement, e: DragEvent) {
    dragSrcEl = this;
    e.dataTransfer!.effectAllowed = 'move';
    e.dataTransfer!.setData('text/html', this.innerHTML);
    this.classList.add('dragging');
}

function handleDragOver(e: DragEvent) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer!.dropEffect = 'move';
    return false;
}

function handleDragEnter(this: HTMLElement) {
    this.classList.add('over');
}

function handleDragLeave(this: HTMLElement) {
    this.classList.remove('over');
}

async function handleDrop(this: HTMLElement, e: DragEvent) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    if (dragSrcEl !== this && currentAccount) {
        const settings = await getSettings(currentAccount);
        const oldIndex = parseInt(dragSrcEl!.dataset.index!);
        const newIndex = parseInt(this.dataset.index!);

        // Move item in array
        const item = settings.tabs.splice(oldIndex, 1)[0];
        settings.tabs.splice(newIndex, 0, item);

        await updateTabOrder(currentAccount, settings.tabs);
        renderList();
    }
    return false;
}

function escapeHtml(text: string) {
    const map: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function (m) { return map[m]; });
}
