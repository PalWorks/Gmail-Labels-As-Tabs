/**
 * options.ts
 *
 * Logic for the options page.
 * Handles adding, removing, and reordering labels.
 */

import { getSettings, saveSettings, addLabel, removeLabel, updateLabelOrder, TabLabel } from './utils/storage';

const listElement = document.getElementById('labels-list') as HTMLInputElement;
const inputElement = document.getElementById('new-label-input') as HTMLInputElement;
const addBtn = document.getElementById('add-btn') as HTMLButtonElement;
const exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
const importBtn = document.getElementById('import-btn') as HTMLButtonElement;
const importFile = document.getElementById('import-file') as HTMLInputElement;

// Render the list of labels
async function renderList() {
    const settings = await getSettings();
    listElement.innerHTML = '';

    settings.labels.forEach((label, index) => {
        const li = document.createElement('li');
        li.draggable = true;
        li.dataset.id = label.id;
        li.dataset.index = index.toString();

        li.innerHTML = `
      <div style="display: flex; align-items: center;">
        <span class="drag-handle">☰</span>
        <span>${escapeHtml(label.name)}</span>
      </div>
      <button class="remove-btn" title="Remove">✕</button>
    `;

        // Remove handler
        const removeBtn = li.querySelector('.remove-btn') as HTMLButtonElement;
        removeBtn.addEventListener('click', async () => {
            await removeLabel(label.id);
            renderList();
        });

        // Drag events
        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dragover', handleDragOver);
        li.addEventListener('drop', handleDrop);
        li.addEventListener('dragenter', handleDragEnter);
        li.addEventListener('dragleave', handleDragLeave);

        listElement.appendChild(li);
    });
}

// Add new label
addBtn.addEventListener('click', async () => {
    const name = inputElement.value;
    if (name) {
        await addLabel(name);
        inputElement.value = '';
        renderList();
    }
});

// Allow Enter key to submit
inputElement.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addBtn.click();
    }
});

// Export settings
exportBtn.addEventListener('click', async () => {
    const settings = await getSettings();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "gmail_tabs_settings.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
});

// Import settings
importBtn.addEventListener('click', () => {
    importFile.click();
});

importFile.addEventListener('change', (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const content = e.target?.result as string;
            const settings = JSON.parse(content);
            if (Array.isArray(settings.labels)) {
                await saveSettings(settings);
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

    if (dragSrcEl !== this) {
        const settings = await getSettings();
        const oldIndex = parseInt(dragSrcEl!.dataset.index!);
        const newIndex = parseInt(this.dataset.index!);

        // Move item in array
        const item = settings.labels.splice(oldIndex, 1)[0];
        settings.labels.splice(newIndex, 0, item);

        await updateLabelOrder(settings.labels);
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

// Initial render
document.addEventListener('DOMContentLoaded', renderList);
