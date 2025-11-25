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
      id: crypto.randomUUID()
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
      if (area === "sync" && changes.labels) {
        currentSettings.labels = changes.labels.newValue;
        renderTabs();
      }
    });
    attemptInjection();
    startObserver();
    window.addEventListener("popstate", handleUrlChange);
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
  function renderTabs() {
    const bar = document.getElementById(TABS_BAR_ID);
    if (!bar || !currentSettings) return;
    bar.innerHTML = "";
    currentSettings.labels.forEach((label) => {
      const tab = document.createElement("a");
      tab.className = "gmail-tab";
      tab.textContent = label.name;
      tab.href = getLabelUrl(label.name);
      tab.dataset.label = label.name;
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
      if (input.value) {
        await addLabel(input.value);
        input.value = "";
        refreshList();
      }
    });
    refreshList();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
//# sourceMappingURL=content.js.map
