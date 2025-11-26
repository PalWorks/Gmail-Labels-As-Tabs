"use strict";
(() => {
  // src/utils/storage.ts
  var DEFAULT_SETTINGS = {
    labels: []
  };
  async function getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(DEFAULT_SETTINGS, (items) => {
        resolve(items);
      });
    });
  }
  async function saveSettings(settings) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(settings, () => {
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

  // src/options.ts
  var listElement = document.getElementById("labels-list");
  var inputElement = document.getElementById("new-label-input");
  var addBtn = document.getElementById("add-btn");
  var exportBtn = document.getElementById("export-btn");
  var importBtn = document.getElementById("import-btn");
  var importFile = document.getElementById("import-file");
  async function renderList() {
    const settings = await getSettings();
    listElement.innerHTML = "";
    settings.labels.forEach((label, index) => {
      const li = document.createElement("li");
      li.draggable = true;
      li.dataset.id = label.id;
      li.dataset.index = index.toString();
      li.innerHTML = `
      <div style="display: flex; align-items: center;">
        <span class="drag-handle">\u2630</span>
        <span>${escapeHtml(label.name)}</span>
      </div>
      <button class="remove-btn" title="Remove">\u2715</button>
    `;
      const removeBtn = li.querySelector(".remove-btn");
      removeBtn.addEventListener("click", async () => {
        await removeLabel(label.id);
        renderList();
      });
      li.addEventListener("dragstart", handleDragStart);
      li.addEventListener("dragover", handleDragOver);
      li.addEventListener("drop", handleDrop);
      li.addEventListener("dragenter", handleDragEnter);
      li.addEventListener("dragleave", handleDragLeave);
      listElement.appendChild(li);
    });
  }
  addBtn.addEventListener("click", async () => {
    const name = inputElement.value;
    if (name) {
      await addLabel(name);
      inputElement.value = "";
      renderList();
    }
  });
  inputElement.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addBtn.click();
    }
  });
  exportBtn.addEventListener("click", async () => {
    const settings = await getSettings();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "gmail_tabs_settings.json");
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
        const settings = JSON.parse(content);
        if (Array.isArray(settings.labels)) {
          await saveSettings(settings);
          renderList();
          alert("Settings imported successfully!");
        } else {
          alert("Invalid JSON format.");
        }
      } catch (err) {
        console.error(err);
        alert("Error parsing JSON.");
      }
    };
    reader.readAsText(file);
  });
  var dragSrcEl = null;
  function handleDragStart(e) {
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", this.innerHTML);
    this.classList.add("dragging");
  }
  function handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.dataTransfer.dropEffect = "move";
    return false;
  }
  function handleDragEnter() {
    this.classList.add("over");
  }
  function handleDragLeave() {
    this.classList.remove("over");
  }
  async function handleDrop(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    if (dragSrcEl !== this) {
      const settings = await getSettings();
      const oldIndex = parseInt(dragSrcEl.dataset.index);
      const newIndex = parseInt(this.dataset.index);
      const item = settings.labels.splice(oldIndex, 1)[0];
      settings.labels.splice(newIndex, 0, item);
      await updateLabelOrder(settings.labels);
      renderList();
    }
    return false;
  }
  function escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return text.replace(/[&<>"']/g, function(m) {
      return map[m];
    });
  }
  document.addEventListener("DOMContentLoaded", renderList);
})();
//# sourceMappingURL=options.js.map
