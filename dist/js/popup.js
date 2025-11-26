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

  // src/popup.ts
  var themeSelect = document.getElementById("theme-select");
  async function initTheme() {
    const settings = await getSettings();
    if (themeSelect) {
      themeSelect.value = settings.theme;
      themeSelect.addEventListener("change", async () => {
        const newTheme = themeSelect.value;
        await saveSettings({ theme: newTheme });
      });
    }
  }
  var tabInput = document.getElementById("new-tab-input");
  var addTabBtn = document.getElementById("add-tab-btn");
  var tabsList = document.getElementById("tabs-list");
  async function initTabs() {
    if (!tabsList) return;
    await renderTabsList();
    if (addTabBtn) {
      addTabBtn.addEventListener("click", async () => {
        await handleAddTab();
      });
    }
    if (tabInput) {
      tabInput.addEventListener("keypress", async (e) => {
        if (e.key === "Enter") {
          await handleAddTab();
        }
      });
    }
  }
  async function handleAddTab() {
    if (!tabInput) return;
    let value = tabInput.value.trim();
    if (value) {
      if (value.toLowerCase().startsWith("label:")) {
        value = value.substring(6).trim();
      }
      if (value) {
        await addTab(value, value, "label");
        tabInput.value = "";
        await renderTabsList();
      }
    }
  }
  async function renderTabsList() {
    const settings = await getSettings();
    if (!tabsList) return;
    tabsList.innerHTML = "";
    settings.tabs.forEach((tab, index) => {
      const li = document.createElement("li");
      li.className = "label-item";
      li.setAttribute("draggable", "true");
      li.dataset.index = index.toString();
      const dragHandle = document.createElement("div");
      dragHandle.className = "drag-handle";
      dragHandle.innerHTML = '<svg viewBox="0 0 24 24"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>';
      li.appendChild(dragHandle);
      const nameSpan = document.createElement("span");
      nameSpan.className = "label-name";
      nameSpan.textContent = tab.title;
      if (tab.type === "hash") {
        const typeSpan = document.createElement("small");
        typeSpan.style.color = "#888";
        typeSpan.style.marginLeft = "4px";
        typeSpan.textContent = "(Custom)";
        nameSpan.appendChild(typeSpan);
      }
      li.appendChild(nameSpan);
      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-btn";
      removeBtn.textContent = "\u2715";
      removeBtn.title = "Remove Tab";
      removeBtn.addEventListener("click", async () => {
        await removeTab(tab.id);
        await renderTabsList();
      });
      li.appendChild(removeBtn);
      li.addEventListener("dragstart", handleDragStart);
      li.addEventListener("dragenter", handleDragEnter);
      li.addEventListener("dragover", handleDragOver);
      li.addEventListener("dragleave", handleDragLeave);
      li.addEventListener("drop", handleDrop);
      li.addEventListener("dragend", handleDragEnd);
      tabsList.appendChild(li);
    });
  }
  var dragSrcEl = null;
  function handleDragStart(e) {
    dragSrcEl = this;
    this.classList.add("dragging");
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", this.dataset.index || "");
    }
  }
  function handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }
    return false;
  }
  function handleDragEnter(e) {
    this.classList.add("over");
  }
  function handleDragLeave(e) {
    this.classList.remove("over");
  }
  async function handleDrop(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    if (dragSrcEl !== this) {
      const oldIndex = parseInt(dragSrcEl.dataset.index || "0");
      const newIndex = parseInt(this.dataset.index || "0");
      const settings = await getSettings();
      const tabs = [...settings.tabs];
      const [movedTab] = tabs.splice(oldIndex, 1);
      tabs.splice(newIndex, 0, movedTab);
      await updateTabOrder(tabs);
      await renderTabsList();
    }
    return false;
  }
  function handleDragEnd(e) {
    dragSrcEl = null;
    document.querySelectorAll(".label-item").forEach((item) => {
      item.classList.remove("over", "dragging");
    });
  }
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initTabs();
  });
})();
//# sourceMappingURL=popup.js.map
