import { getSettings, saveSettings, addLabel, removeLabel, updateLabelOrder, TabLabel } from './utils/storage';

document.addEventListener('DOMContentLoaded', async () => {
    const settings = await getSettings();
    const themeSelector = document.getElementById('theme-selector');
    const options = document.querySelectorAll('.theme-option');

    const labelList = document.getElementById('labels-list') as HTMLUListElement;
    const newLabelInput = document.getElementById('new-label-input') as HTMLInputElement;
    const addBtn = document.getElementById('add-btn') as HTMLButtonElement;
    const exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
    const importBtn = document.getElementById('import-btn') as HTMLButtonElement;
    const importFile = document.getElementById('import-file') as HTMLInputElement;

    let dragSrcEl: HTMLElement | null = null;

    // --- Theme Logic ---
    // Set initial state
    updateActiveOption(settings.theme);

    themeSelector?.addEventListener('click', async (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('theme-option')) {
            const value = target.dataset.value as 'system' | 'light' | 'dark';
            updateActiveOption(value);
            await saveSettings({ theme: value });
        }
    });

    function updateActiveOption(value: string) {
        options.forEach(opt => {
            if ((opt as HTMLElement).dataset.value === value) {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });
    }

    // --- Tab Management Logic ---
    renderList();

    async function renderList() {
        const currentSettings = await getSettings();
        labelList.innerHTML = '';

        if (currentSettings.labels.length === 0) {
            labelList.innerHTML = '<li style="padding:10px; text-align:center; color:#888; font-size:12px;">No tabs added yet.</li>';
            return;
        }

        currentSettings.labels.forEach((label, index) => {
            const li = document.createElement('li');
            li.className = 'label-item';
            li.setAttribute('draggable', 'true');
            li.dataset.index = index.toString();
            li.innerHTML = `
                <div class="drag-handle" title="Drag to reorder">
                    <svg viewBox="0 0 24 24"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                </div>
                <span class="label-name" title="${label.displayName || label.name}">${label.displayName || label.name}</span>
                <button class="remove-btn" data-id="${label.id}">×</button>
            `;

            // Drag Events
            li.addEventListener('dragstart', handleDragStart);
            li.addEventListener('dragenter', handleDragEnter);
            li.addEventListener('dragover', handleDragOver);
            li.addEventListener('dragleave', handleDragLeave);
            li.addEventListener('drop', handleDrop);
            li.addEventListener('dragend', handleDragEnd);

            labelList.appendChild(li);
        });

        // Add remove listeners
        document.querySelectorAll('.remove-btn').forEach((btn) => {
            btn.addEventListener('click', async (e) => {
                const id = (e.target as HTMLElement).dataset.id;
                if (id) {
                    await removeLabel(id);
                    renderList();
                }
            });
        });
    }

    // Drag Handlers
    function handleDragStart(e: DragEvent) {
        dragSrcEl = e.target as HTMLElement;
        (e.target as HTMLElement).classList.add('dragging');
        e.dataTransfer!.effectAllowed = 'move';
        // Store index
        e.dataTransfer!.setData('text/plain', (e.target as HTMLElement).dataset.index || '');
    }

    function handleDragOver(e: DragEvent) {
        if (e.preventDefault) {
            e.preventDefault(); // Necessary. Allows us to drop.
        }
        e.dataTransfer!.dropEffect = 'move';
        return false;
    }

    function handleDragEnter(e: DragEvent) {
        (e.target as HTMLElement).closest('.label-item')?.classList.add('over');
    }

    function handleDragLeave(e: DragEvent) {
        (e.target as HTMLElement).closest('.label-item')?.classList.remove('over');
    }

    async function handleDrop(e: DragEvent) {
        if (e.stopPropagation) {
            e.stopPropagation(); // stops the browser from redirecting.
        }

        const dropTarget = (e.target as HTMLElement).closest('.label-item') as HTMLElement;
        if (dragSrcEl !== dropTarget && dropTarget) {
            const oldIndex = parseInt(dragSrcEl!.dataset.index || '0');
            const newIndex = parseInt(dropTarget.dataset.index || '0');

            // Reorder
            const s = await getSettings();
            const labels = [...s.labels];
            const [movedLabel] = labels.splice(oldIndex, 1);
            labels.splice(newIndex, 0, movedLabel);

            await updateLabelOrder(labels);
            renderList();
        }
        return false;
    }

    function handleDragEnd(e: DragEvent) {
        dragSrcEl = null;
        document.querySelectorAll('.label-item').forEach(item => {
            item.classList.remove('over', 'dragging');
        });
    }

    // Add Label
    addBtn.addEventListener('click', async () => {
        const name = newLabelInput.value;
        if (name) {
            await addLabel(name);
            newLabelInput.value = '';
            renderList();
        }
    });

    newLabelInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const name = newLabelInput.value;
            if (name) {
                await addLabel(name);
                newLabelInput.value = '';
                renderList();
            }
        }
    });

    // Export JSON
    exportBtn.addEventListener('click', async () => {
        const s = await getSettings();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(s.labels, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "gmail_tabs_config.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });

    // Import JSON
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
                const labels = JSON.parse(content) as TabLabel[];
                if (Array.isArray(labels)) {
                    await saveSettings({ labels });
                    renderList();
                    alert('Tabs imported successfully!');
                } else {
                    alert('Invalid JSON format.');
                }
            } catch (err) {
                alert('Error parsing JSON.');
            }
        };
        reader.readAsText(file);
    });
});
