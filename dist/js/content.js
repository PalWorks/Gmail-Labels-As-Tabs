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
    const currentSettings2 = await getSettings();
    const mergedSettings = { ...currentSettings2, ...newSettings };
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
  async function updateLabel(labelId, updates) {
    const settings = await getSettings();
    const index = settings.labels.findIndex((l) => l.id === labelId);
    if (index !== -1) {
      settings.labels[index] = { ...settings.labels[index], ...updates };
      await saveSettings(settings);
    }
  }
  async function updateLabelOrder(newLabels) {
    const settings = await getSettings();
    settings.labels = newLabels;
    await saveSettings(settings);
  }

  // src/content.ts
  var TOOLBAR_SELECTORS = [
    ".G-atb",
    // Main toolbar container (often has this class)
    ".aeF > div:first-child"
    // Fallback
  ];
  var TABS_BAR_ID = "gmail-labels-as-tabs-bar";
  var MODAL_ID = "gmail-labels-settings-modal";
  var currentSettings = null;
  var observer = null;
  async function init() {
    currentSettings = await getSettings();
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "sync") {
        if (changes.labels) {
          currentSettings.labels = changes.labels.newValue;
          renderTabs();
        }
        if (changes.theme) {
          currentSettings.theme = changes.theme.newValue;
          applyTheme(currentSettings.theme);
        }
      }
    });
    attemptInjection();
    startObserver();
    window.addEventListener("popstate", handleUrlChange);
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "TOGGLE_SETTINGS") {
        toggleSettingsModal();
      }
    });
  }
  function attemptInjection() {
    const existingBar = document.getElementById(TABS_BAR_ID);
    let injectionPoint = null;
    for (const selector of TOOLBAR_SELECTORS) {
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
        injectionPoint.insertAdjacentElement("afterend", tabsBar);
        renderTabs();
      } else if (existingBar.previousElementSibling !== injectionPoint) {
        injectionPoint.insertAdjacentElement("afterend", existingBar);
      }
      updateActiveTab();
    } else {
      setTimeout(attemptInjection, 500);
    }
  }
  function createTabsBar() {
    const bar = document.createElement("div");
    bar.id = TABS_BAR_ID;
    bar.className = "gmail-tabs-bar";
    return bar;
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
    this.classList.add("drag-over");
  }
  function handleDragLeave(e) {
    if (this.contains(e.relatedTarget)) return;
    this.classList.remove("drag-over");
  }
  async function handleDrop(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    this.classList.remove("drag-over");
    if (dragSrcEl !== this) {
      const oldIndex = parseInt(dragSrcEl.dataset.index || "0");
      const newIndex = parseInt(this.dataset.index || "0");
      if (currentSettings) {
        const labels = [...currentSettings.labels];
        const [movedLabel] = labels.splice(oldIndex, 1);
        labels.splice(newIndex, 0, movedLabel);
        currentSettings.labels = labels;
        renderTabs();
        await updateLabelOrder(labels);
      }
    }
    return false;
  }
  function handleDragEnd(e) {
    dragSrcEl = null;
    document.querySelectorAll(".gmail-tab").forEach((item) => {
      item.classList.remove("drag-over", "dragging");
    });
  }
  function renderTabs() {
    const bar = document.getElementById(TABS_BAR_ID);
    if (!bar || !currentSettings) return;
    bar.innerHTML = "";
    currentSettings.labels.forEach((label, index) => {
      const tab = document.createElement("div");
      tab.className = "gmail-tab";
      tab.setAttribute("draggable", "true");
      tab.dataset.index = index.toString();
      tab.dataset.label = label.name;
      const dragHandle = document.createElement("div");
      dragHandle.className = "tab-drag-handle";
      dragHandle.title = "Drag to reorder";
      dragHandle.innerHTML = '<svg viewBox="0 0 24 24"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>';
      tab.appendChild(dragHandle);
      const nameSpan = document.createElement("span");
      nameSpan.className = "tab-name";
      nameSpan.textContent = label.displayName || label.name;
      tab.appendChild(nameSpan);
      const actions = document.createElement("div");
      actions.className = "tab-actions";
      const editBtn = document.createElement("div");
      editBtn.className = "tab-action-btn edit-btn";
      editBtn.innerHTML = "\u22EE";
      editBtn.title = "Edit Tab";
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        showEditModal(label);
      });
      actions.appendChild(editBtn);
      const deleteBtn = document.createElement("div");
      deleteBtn.className = "tab-action-btn delete-btn";
      deleteBtn.innerHTML = "\u2715";
      deleteBtn.title = "Remove Tab";
      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (confirm(`Remove tab "${label.displayName || label.name}"?`)) {
          await removeLabel(label.id);
          currentSettings = await getSettings();
          renderTabs();
        }
      });
      actions.appendChild(deleteBtn);
      tab.appendChild(actions);
      tab.addEventListener("click", (e) => {
        if (e.target.closest(".tab-actions") || e.target.closest(".tab-drag-handle")) {
          return;
        }
        window.location.href = getLabelUrl(label.name);
      });
      tab.addEventListener("dragstart", handleDragStart);
      tab.addEventListener("dragenter", handleDragEnter);
      tab.addEventListener("dragover", handleDragOver);
      tab.addEventListener("dragleave", handleDragLeave);
      tab.addEventListener("drop", handleDrop);
      tab.addEventListener("dragend", handleDragEnd);
      bar.appendChild(tab);
    });
    const addBtn = document.createElement("div");
    addBtn.className = "add-tab-btn";
    addBtn.innerHTML = "+";
    addBtn.title = "Configure Tabs";
    addBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleSettingsModal();
    });
    bar.appendChild(addBtn);
    updateActiveTab();
  }
  function showEditModal(label) {
    const modal = document.createElement("div");
    modal.className = "gmail-tabs-modal";
    modal.innerHTML = `
        <div class="modal-content edit-tab-modal">
            <div class="modal-header">
                <h3>Edit Tab</h3>
                <button class="close-btn">\u2715</button>
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
    modal.querySelector(".close-btn")?.addEventListener("click", close);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) close();
    });
    modal.querySelector("#edit-save-btn")?.addEventListener("click", async () => {
      const displayName = modal.querySelector("#edit-display-name").value;
      if (displayName) {
        await updateLabel(label.id, {
          displayName: displayName.trim()
        });
        close();
        currentSettings = await getSettings();
        renderTabs();
      }
    });
  }
  function getLabelUrl(labelName) {
    const encoded = encodeURIComponent(labelName).replace(/%20/g, "+");
    return `https://mail.google.com/mail/u/0/#label/${encoded}`;
  }
  function updateActiveTab() {
    const hash = window.location.hash;
    const bar = document.getElementById(TABS_BAR_ID);
    if (!bar) return;
    const tabs = bar.querySelectorAll(".gmail-tab");
    tabs.forEach((t) => {
      const tab = t;
      const labelName = tab.dataset.label;
      if (!labelName) return;
      const cleanHash = decodeURIComponent(hash.replace("#label/", "").replace(/\+/g, " "));
      if (cleanHash === labelName || hash.includes(`#label/${encodeURIComponent(labelName).replace(/%20/g, "+")}`)) {
        tab.classList.add("active");
      } else {
        tab.classList.remove("active");
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
      subtree: true
    });
  }
  function toggleSettingsModal() {
    let modal = document.getElementById(MODAL_ID);
    if (modal) {
      modal.remove();
    } else {
      createSettingsModal();
    }
  }
  function createSettingsModal() {
    const modal = document.createElement("div");
    modal.id = MODAL_ID;
    modal.className = "gmail-tabs-modal";
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Configure Tabs</h3>
                <button class="close-btn">\u2715</button>
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
    modal.querySelector(".close-btn")?.addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });
    const addBtn = modal.querySelector("#modal-add-btn");
    const input = modal.querySelector("#modal-new-label");
    const list = modal.querySelector("#modal-labels-list");
    const refreshList = async () => {
      const settings = await getSettings();
      list.innerHTML = "";
      settings.labels.forEach((label, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
                <span>${label.name}</span>
                <div class="actions">
                    ${index > 0 ? '<button class="up-btn">\u2191</button>' : ""}
                    ${index < settings.labels.length - 1 ? '<button class="down-btn">\u2193</button>' : ""}
                    <button class="remove-btn">\u2715</button>
                </div>
            `;
        li.querySelector(".remove-btn")?.addEventListener("click", async () => {
          await removeLabel(label.id);
          refreshList();
        });
        li.querySelector(".up-btn")?.addEventListener("click", async () => {
          const newLabels = [...settings.labels];
          [newLabels[index - 1], newLabels[index]] = [newLabels[index], newLabels[index - 1]];
          await updateLabelOrder(newLabels);
          refreshList();
        });
        li.querySelector(".down-btn")?.addEventListener("click", async () => {
          const newLabels = [...settings.labels];
          [newLabels[index + 1], newLabels[index]] = [newLabels[index], newLabels[index + 1]];
          await updateLabelOrder(newLabels);
          refreshList();
        });
        list.appendChild(li);
      });
    };
    addBtn.addEventListener("click", async () => {
      let value = input.value.trim();
      if (value) {
        if (value.toLowerCase().startsWith("label:")) {
          value = value.substring(6).trim();
        }
        if (value) {
          await addLabel(value);
          input.value = "";
          refreshList();
        }
      }
    });
    refreshList();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  function applyTheme(theme) {
    document.body.classList.remove("force-dark", "force-light");
    if (theme === "dark") {
      document.body.classList.add("force-dark");
    } else if (theme === "light") {
      document.body.classList.add("force-light");
    }
  }
  if (currentSettings) {
    applyTheme(currentSettings.theme);
  } else {
    getSettings().then((settings) => applyTheme(settings.theme));
  }
})();
//# sourceMappingURL=content.js.map
