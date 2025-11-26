/**
 * popup.ts
 *
 * Script for the extension popup.
 * Handles theme selection and tab configuration.
 */

import { getSettings, saveSettings, addTab, removeTab, updateTabOrder, Settings, Tab } from './utils/storage';

// --- Theme Logic ---
const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;

async function initTheme() {
    const settings = await getSettings();
    if (themeSelect) {
        themeSelect.value = settings.theme;
        themeSelect.addEventListener('change', async () => {
            const newTheme = themeSelect.value as 'system' | 'light' | 'dark';
            await saveSettings({ theme: newTheme });
        });
    }
}

// --- Tab Configuration Logic ---
const tabInput = document.getElementById('new-tab-input') as HTMLInputElement;
const addTabBtn = document.getElementById('add-tab-btn') as HTMLButtonElement;
const tabsList = document.getElementById('tabs-list') as HTMLUListElement;

async function initTabs() {
    if (!tabsList) return; // Guard against missing elements

    await renderTabsList();

    if (addTabBtn) {
        addTabBtn.addEventListener('click', async () => {
            await handleAddTab();
        });
    }

    if (tabInput) {
        tabInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                await handleAddTab();
            }
        });
    }
}

async function handleAddTab() {
    if (!tabInput) return;

    let value = tabInput.value.trim();
    if (value) {
        // Remove "label:" prefix if present (case-insensitive)
        if (value.toLowerCase().startsWith('label:')) {
            value = value.substring(6).trim();
        }

        if (value) {
            await addTab(value, value, 'label');
            tabInput.value = '';
            await renderTabsList();
        }
    }
}

async function renderTabsList() {
    const settings = await getSettings();
    if (!tabsList) return;

    tabsList.innerHTML = '';

    settings.tabs.forEach((tab, index) => {
        const li = document.createElement('li');
        li.className = 'label-item';
        li.setAttribute('draggable', 'true');
        li.dataset.index = index.toString();

        // Drag Handle
        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        dragHandle.innerHTML = '<svg viewBox="0 0 24 24"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>';
        li.appendChild(dragHandle);

        const nameSpan = document.createElement('span');
        nameSpan.className = 'label-name';
        nameSpan.textContent = tab.title;
        // Show type if it's a hash tab
        if (tab.type === 'hash') {
            const typeSpan = document.createElement('small');
            typeSpan.style.color = '#888';
            typeSpan.style.marginLeft = '4px';
            typeSpan.textContent = '(Custom)';
            nameSpan.appendChild(typeSpan);
        }
        li.appendChild(nameSpan);

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = '✕';
        removeBtn.title = 'Remove Tab';
        removeBtn.addEventListener('click', async () => {
            await removeTab(tab.id);
            await renderTabsList();
        });
        li.appendChild(removeBtn);

        // Drag Events
        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dragenter', handleDragEnter);
        li.addEventListener('dragover', handleDragOver);
        li.addEventListener('dragleave', handleDragLeave);
        li.addEventListener('drop', handleDrop);
        li.addEventListener('dragend', handleDragEnd);

        tabsList.appendChild(li);
    });
}

// --- Drag and Drop Logic ---
let dragSrcEl: HTMLElement | null = null;

function handleDragStart(this: HTMLElement, e: DragEvent) {
    dragSrcEl = this;
    this.classList.add('dragging');
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.dataset.index || '');
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
    this.classList.add('over');
}

function handleDragLeave(this: HTMLElement, e: DragEvent) {
    this.classList.remove('over');
}

async function handleDrop(this: HTMLElement, e: DragEvent) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    if (dragSrcEl !== this) {
        const oldIndex = parseInt(dragSrcEl!.dataset.index || '0');
        const newIndex = parseInt(this.dataset.index || '0');

        const settings = await getSettings();
        const tabs = [...settings.tabs];
        const [movedTab] = tabs.splice(oldIndex, 1);
        tabs.splice(newIndex, 0, movedTab);

        await updateTabOrder(tabs);
        await renderTabsList();
    }
    return false;
}

function handleDragEnd(this: HTMLElement, e: DragEvent) {
    dragSrcEl = null;
    document.querySelectorAll('.label-item').forEach(item => {
        item.classList.remove('over', 'dragging');
    });
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initTabs();
});
