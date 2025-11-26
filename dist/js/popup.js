"use strict";
(() => {
  // src/utils/storage.ts
  var DEFAULT_SETTINGS = {
    labels: [],
    theme: "system"
  };
  async function getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
        resolve(items);
      });
    });
  }
  async function saveSettings(newSettings) {
    const currentSettings = await getSettings();
    const mergedSettings = { ...currentSettings, ...newSettings };
    return new Promise((resolve) => {
      chrome.storage.sync.set(mergedSettings, () => {
        resolve();
      });
    });
  }
  async function addLabel(labelName) {
    const settings = await getSettings();
    const newLabel = {
      name: labelName.trim(),
      id: crypto.randomUUID(),
      displayName: labelName.trim()
    };
    if (!settings.labels.some((l) => l.name === newLabel.name)) {
      settings.labels.push(newLabel);
      await saveSettings(settings);
    }
  }
  async function removeLabel(labelId) {
    const settings = await getSettings();
    settings.labels = settings.labels.filter((l) => l.id !== labelId);
    await saveSettings(settings);
  }
  async function updateLabelOrder(newLabels) {
    const settings = await getSettings();
    settings.labels = newLabels;
    await saveSettings(settings);
  }

  // src/popup.ts
  document.addEventListener("DOMContentLoaded", async () => {
    const settings = await getSettings();
    const themeSelector = document.getElementById("theme-selector");
    const options = document.querySelectorAll(".theme-option");
    const labelList = document.getElementById("labels-list");
    const newLabelInput = document.getElementById("new-label-input");
    const addBtn = document.getElementById("add-btn");
    const exportBtn = document.getElementById("export-btn");
    const importBtn = document.getElementById("import-btn");
    const importFile = document.getElementById("import-file");
    let dragSrcEl = null;
    updateActiveOption(settings.theme);
    themeSelector?.addEventListener("click", async (e) => {
      const target = e.target;
      if (target.classList.contains("theme-option")) {
        const value = target.dataset.value;
        updateActiveOption(value);
        await saveSettings({ theme: value });
      }
    });
    function updateActiveOption(value) {
      options.forEach((opt) => {
        if (opt.dataset.value === value) {
          opt.classList.add("active");
        } else {
          opt.classList.remove("active");
        }
      });
    }
    renderList();
    async function renderList() {
      const currentSettings = await getSettings();
      labelList.innerHTML = "";
      if (currentSettings.labels.length === 0) {
        labelList.innerHTML = '<li style="padding:10px; text-align:center; color:#888; font-size:12px;">No tabs added yet.</li>';
        return;
      }
      currentSettings.labels.forEach((label, index) => {
        const li = document.createElement("li");
        li.className = "label-item";
        li.setAttribute("draggable", "true");
        li.dataset.index = index.toString();
        li.innerHTML = `
                <div class="drag-handle" title="Drag to reorder">
                    <svg viewBox="0 0 24 24"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                </div>
                <span class="label-name" title="${label.displayName || label.name}">${label.displayName || label.name}</span>
                <button class="remove-btn" data-id="${label.id}">\xD7</button>
            `;
        li.addEventListener("dragstart", handleDragStart);
        li.addEventListener("dragenter", handleDragEnter);
        li.addEventListener("dragover", handleDragOver);
        li.addEventListener("dragleave", handleDragLeave);
        li.addEventListener("drop", handleDrop);
        li.addEventListener("dragend", handleDragEnd);
        labelList.appendChild(li);
      });
      document.querySelectorAll(".remove-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const id = e.target.dataset.id;
          if (id) {
            await removeLabel(id);
            renderList();
          }
        });
      });
    }
    function handleDragStart(e) {
      dragSrcEl = e.target;
      e.target.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", e.target.dataset.index || "");
    }
    function handleDragOver(e) {
      if (e.preventDefault) {
        e.preventDefault();
      }
      e.dataTransfer.dropEffect = "move";
      return false;
    }
    function handleDragEnter(e) {
      e.target.closest(".label-item")?.classList.add("over");
    }
    function handleDragLeave(e) {
      e.target.closest(".label-item")?.classList.remove("over");
    }
    async function handleDrop(e) {
      if (e.stopPropagation) {
        e.stopPropagation();
      }
      const dropTarget = e.target.closest(".label-item");
      if (dragSrcEl !== dropTarget && dropTarget) {
        const oldIndex = parseInt(dragSrcEl.dataset.index || "0");
        const newIndex = parseInt(dropTarget.dataset.index || "0");
        const s = await getSettings();
        const labels = [...s.labels];
        const [movedLabel] = labels.splice(oldIndex, 1);
        labels.splice(newIndex, 0, movedLabel);
        await updateLabelOrder(labels);
        renderList();
      }
      return false;
    }
    function handleDragEnd(e) {
      dragSrcEl = null;
      document.querySelectorAll(".label-item").forEach((item) => {
        item.classList.remove("over", "dragging");
      });
    }
    addBtn.addEventListener("click", async () => {
      const name = newLabelInput.value;
      if (name) {
        await addLabel(name);
        newLabelInput.value = "";
        renderList();
      }
    });
    newLabelInput.addEventListener("keypress", async (e) => {
      if (e.key === "Enter") {
        const name = newLabelInput.value;
        if (name) {
          await addLabel(name);
          newLabelInput.value = "";
          renderList();
        }
      }
    });
    exportBtn.addEventListener("click", async () => {
      const s = await getSettings();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(s.labels, null, 2));
      const downloadAnchorNode = document.createElement("a");
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "gmail_tabs_config.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    });
    importBtn.addEventListener("click", () => {
      importFile.click();
    });
    importFile.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result;
          const labels = JSON.parse(content);
          if (Array.isArray(labels)) {
            await saveSettings({ labels });
            renderList();
            alert("Tabs imported successfully!");
          } else {
            alert("Invalid JSON format.");
          }
        } catch (err) {
          alert("Error parsing JSON.");
        }
      };
      reader.readAsText(file);
    });
  });
})();
//# sourceMappingURL=popup.js.map
