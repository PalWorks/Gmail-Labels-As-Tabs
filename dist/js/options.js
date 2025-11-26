"use strict";
(() => {
  // src/utils/storage.ts
  var DEFAULT_SETTINGS = {
    tabs: [],
    theme: "system",
    showUnreadCount: false
  };
  async function getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(null, (items) => {
        const settings = { ...DEFAULT_SETTINGS, ...items };
        if (settings.labels && settings.labels.length > 0 && (!settings.tabs || settings.tabs.length === 0)) {
          console.log("Migrating legacy labels to tabs...");
          settings.tabs = settings.labels.map((l) => ({
            id: l.id,
            title: l.displayName || l.name,
            type: "label",
            value: l.name
          }));
          delete settings.labels;
          chrome.storage.sync.set(settings);
        }
        resolve(settings);
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
  async function addTab(title, value, type = "label") {
    const settings = await getSettings();
    const newTab = {
      id: crypto.randomUUID(),
      title: title.trim(),
      value: value.trim(),
      type
    };
    if (!settings.tabs.some((t) => t.value === newTab.value)) {
      settings.tabs.push(newTab);
      await saveSettings(settings);
    }
  }
  async function removeTab(tabId) {
    const settings = await getSettings();
    settings.tabs = settings.tabs.filter((t) => t.id !== tabId);
    await saveSettings(settings);
  }
  async function updateTabOrder(newTabs) {
    const settings = await getSettings();
    settings.tabs = newTabs;
    await saveSettings(settings);
  }

  // src/options.ts
  var labelList = document.getElementById("labels-list");
  var newLabelInput = document.getElementById("new-label-input");
  var addBtn = document.getElementById("add-btn");
  var exportBtn = document.getElementById("export-btn");
  var importBtn = document.getElementById("import-btn");
  var importFile = document.getElementById("import-file");
  var themeSelect = document.getElementById("theme-select");
  document.addEventListener("DOMContentLoaded", async () => {
    const settings = await getSettings();
    renderList();
    if (themeSelect) {
      themeSelect.value = settings.theme;
    }
    themeSelect?.addEventListener("change", async () => {
      const theme = themeSelect.value;
      await saveSettings({ theme });
    });
  });
  async function renderList() {
    const settings = await getSettings();
    if (!labelList) return;
    labelList.innerHTML = "";
    settings.tabs.forEach((tab, index) => {
      const li = document.createElement("li");
      li.draggable = true;
      li.dataset.id = tab.id;
      li.dataset.index = index.toString();
      li.innerHTML = `
      <div style="display: flex; align-items: center;">
        <span class="drag-handle">\u2630</span>
        <span>${escapeHtml(tab.title)}</span>
        ${tab.type === "hash" ? '<small style="color:#888; margin-left:4px;">(Custom)</small>' : ""}
      </div>
      <button class="remove-btn" title="Remove">\u2715</button>
    `;
      const removeBtn = li.querySelector(".remove-btn");
      removeBtn.addEventListener("click", async () => {
        await removeTab(tab.id);
        renderList();
      });
      li.addEventListener("dragstart", handleDragStart);
      li.addEventListener("dragover", handleDragOver);
      li.addEventListener("drop", handleDrop);
      li.addEventListener("dragenter", handleDragEnter);
      li.addEventListener("dragleave", handleDragLeave);
      labelList.appendChild(li);
    });
  }
  if (addBtn) {
    addBtn.addEventListener("click", async () => {
      const name = newLabelInput.value;
      if (name) {
        await addTab(name, name, "label");
        newLabelInput.value = "";
        renderList();
      }
    });
  }
  if (newLabelInput) {
    newLabelInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        addBtn.click();
      }
    });
  }
  if (exportBtn) {
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
  }
  if (importBtn) {
    importBtn.addEventListener("click", () => {
      importFile.click();
    });
  }
  if (importFile) {
    importFile.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result;
          const settings = JSON.parse(content);
          if (Array.isArray(settings.tabs)) {
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
  }
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
      const item = settings.tabs.splice(oldIndex, 1)[0];
      settings.tabs.splice(newIndex, 0, item);
      await updateTabOrder(settings.tabs);
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
})();
//# sourceMappingURL=options.js.map
