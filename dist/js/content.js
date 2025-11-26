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
    const currentSettings2 = await getSettings();
    const mergedSettings = { ...currentSettings2, ...newSettings };
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
  async function updateTab(tabId, updates) {
    const settings = await getSettings();
    const index = settings.tabs.findIndex((t) => t.id === tabId);
    if (index !== -1) {
      settings.tabs[index] = { ...settings.tabs[index], ...updates };
      await saveSettings(settings);
    }
  }
  async function updateTabOrder(newTabs) {
    const settings = await getSettings();
    settings.tabs = newTabs;
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
        if (changes.tabs) {
          currentSettings.tabs = changes.tabs.newValue;
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
    currentSettings.tabs.forEach((tab, index) => {
      const tabEl = document.createElement("div");
      tabEl.className = "gmail-tab";
      tabEl.setAttribute("draggable", "true");
      tabEl.dataset.index = index.toString();
      tabEl.dataset.value = tab.value;
      tabEl.dataset.type = tab.type;
      const dragHandle = document.createElement("div");
      dragHandle.className = "tab-drag-handle";
      dragHandle.title = "Drag to reorder";
      dragHandle.innerHTML = '<svg viewBox="0 0 24 24"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>';
      tabEl.appendChild(dragHandle);
      const nameSpan = document.createElement("span");
      nameSpan.className = "tab-name";
      nameSpan.textContent = tab.title;
      tabEl.appendChild(nameSpan);
      if (currentSettings.showUnreadCount) {
        const countSpan = document.createElement("span");
        countSpan.className = "unread-count";
        countSpan.textContent = "";
        tabEl.appendChild(countSpan);
        updateUnreadCount(tab, tabEl);
      }
      const actions = document.createElement("div");
      actions.className = "tab-actions";
      const editBtn = document.createElement("div");
      editBtn.className = "tab-action-btn edit-btn";
      editBtn.innerHTML = "\u22EE";
      editBtn.title = "Edit Tab";
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        showEditModal(tab);
      });
      actions.appendChild(editBtn);
      const deleteBtn = document.createElement("div");
      deleteBtn.className = "tab-action-btn delete-btn";
      deleteBtn.innerHTML = "\u2715";
      deleteBtn.title = "Remove Tab";
      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (confirm(`Remove tab "${tab.title}"?`)) {
          await removeTab(tab.id);
          currentSettings = await getSettings();
          renderTabs();
        }
      });
      actions.appendChild(deleteBtn);
      tabEl.appendChild(actions);
      tabEl.addEventListener("click", (e) => {
        if (e.target.closest(".tab-actions") || e.target.closest(".tab-drag-handle")) {
          return;
        }
        if (tab.type === "hash") {
          window.location.hash = tab.value;
        } else {
          window.location.href = getLabelUrl(tab.value);
        }
      });
      tabEl.addEventListener("dragend", handleDragEnd);
      bar.appendChild(tabEl);
    });
    const saveViewBtn = document.createElement("div");
    saveViewBtn.className = "gmail-tab-btn save-view-btn";
    saveViewBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>';
    saveViewBtn.title = "Save Current View as Tab";
    saveViewBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      showPinModal();
    });
    bar.appendChild(saveViewBtn);
    const manageBtn = document.createElement("div");
    manageBtn.className = "gmail-tab-btn manage-btn";
    manageBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';
    manageBtn.title = "Manage Tabs";
    manageBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleSettingsModal();
    });
    bar.appendChild(manageBtn);
    updateActiveTab();
  }
  function showPinModal() {
    const currentHash = window.location.hash;
    if (!currentHash || currentHash === "#inbox") {
      alert("Cannot pin the Inbox. Navigate to a label or search first.");
      return;
    }
    const modal = document.createElement("div");
    modal.className = "gmail-tabs-modal";
    let suggestedTitle = "New Tab";
    if (currentHash.startsWith("#label/")) {
      suggestedTitle = decodeURIComponent(currentHash.replace("#label/", "")).replace(/\+/g, " ");
    } else if (currentHash.startsWith("#search/")) {
      suggestedTitle = "Search: " + decodeURIComponent(currentHash.replace("#search/", "")).replace(/\+/g, " ");
    } else if (currentHash.startsWith("#advanced-search/")) {
      suggestedTitle = "Advanced Search";
    }
    modal.innerHTML = `
        <div class="modal-content edit-tab-modal">
            <div class="modal-header">
                <h3>Pin Current View</h3>
                <button class="close-btn">\u2715</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>View URL (Hash):</label>
                    <input type="text" value="${currentHash}" disabled class="disabled-input">
                </div>
                <div class="form-group">
                    <label>Tab Title:</label>
                    <input type="text" id="pin-title" value="${suggestedTitle}">
                </div>
                <div class="modal-actions">
                    <button id="pin-save-btn" class="primary-btn">Pin Tab</button>
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
    modal.querySelector("#pin-save-btn")?.addEventListener("click", async () => {
      const title = modal.querySelector("#pin-title").value;
      if (title) {
        await addTab(title, currentHash, "hash");
        close();
        currentSettings = await getSettings();
        renderTabs();
      }
    });
  }
  function showEditModal(tab) {
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
                    <label>Value (${tab.type}):</label>
                    <input type="text" value="${tab.value}" disabled class="disabled-input">
                </div>
                <div class="form-group">
                    <label>Display Name:</label>
                    <input type="text" id="edit-display-name" value="${tab.title}">
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
      const title = modal.querySelector("#edit-display-name").value;
      if (title) {
        await updateTab(tab.id, {
          title: title.trim()
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
      const tabEl = t;
      const tabValue = tabEl.dataset.value;
      const tabType = tabEl.dataset.type;
      if (!tabValue) return;
      let isActive = false;
      if (tabType === "hash") {
        isActive = hash === tabValue;
      } else {
        const cleanHash = decodeURIComponent(hash.replace("#label/", "").replace(/\+/g, " "));
        isActive = cleanHash === tabValue || hash.includes(`#label/${encodeURIComponent(tabValue).replace(/%20/g, "+")}`);
      }
      if (isActive) {
        tabEl.classList.add("active");
      } else {
        tabEl.classList.remove("active");
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
                <div class="form-group theme-selector-group">
                    <label>Theme</label>
                    <div class="theme-options">
                        <button class="theme-btn" data-theme="system">System</button>
                        <button class="theme-btn" data-theme="light">Light</button>
                        <button class="theme-btn" data-theme="dark">Dark</button>
                    </div>
                </div>
                
                <div style="border-bottom: 1px solid var(--list-border); margin-bottom: 16px;"></div>
                
                <div class="add-tab-section">
                    <div class="input-group">
                        <input type="text" id="modal-new-label" placeholder="Label Name or View URL">
                    </div>
                    <div id="modal-error-msg" class="input-error-msg" style="display: none;"></div>
                    <div class="input-group" id="modal-title-group" style="display:none;">
                        <input type="text" id="modal-new-title" placeholder="Tab Title">
                    </div>
                    <button id="modal-add-btn" class="primary-btn" style="width: 100%; margin-bottom: 16px;">Add Tab</button>
                </div>
                <div style="border-bottom: 1px solid var(--list-border); margin-bottom: 16px;"></div>
                <ul id="modal-labels-list"></ul>

                <div style="border-bottom: 1px solid var(--list-border); margin-bottom: 16px;"></div>

                <div class="form-group checkbox-group">
                    <input type="checkbox" id="modal-unread-toggle">
                    <label for="modal-unread-toggle">Show Unread Count</label>
                </div>
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
    const titleInput = modal.querySelector("#modal-new-title");
    const titleGroup = modal.querySelector("#modal-title-group");
    const list = modal.querySelector("#modal-labels-list");
    input.addEventListener("input", () => {
      const value = input.value.trim();
      const isUrl = value.includes("http") || value.includes("mail.google.com") || value.startsWith("#");
      if (isUrl) {
        titleGroup.style.display = "flex";
        if (!titleInput.value) {
          if (value.includes("#search/")) {
            titleInput.value = decodeURIComponent(value.split("#search/")[1]).replace(/\+/g, " ");
          } else if (value.includes("#label/")) {
            titleInput.value = decodeURIComponent(value.split("#label/")[1]).replace(/\+/g, " ");
          }
        }
      } else {
        if (!titleInput.value) {
          titleGroup.style.display = "none";
        }
      }
    });
    let modalDragSrcEl = null;
    const handleModalDragStart = function(e) {
      modalDragSrcEl = this;
      this.classList.add("dragging");
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", this.dataset.index || "");
      }
    };
    const handleModalDragOver = function(e) {
      if (e.preventDefault) {
        e.preventDefault();
      }
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "move";
      }
      const rect = this.getBoundingClientRect();
      const relY = e.clientY - rect.top;
      const height = rect.height;
      this.classList.remove("drop-above", "drop-below");
      if (relY < height / 2) {
        this.classList.add("drop-above");
      } else {
        this.classList.add("drop-below");
      }
      return false;
    };
    const handleModalDragEnter = function() {
      this.classList.add("drag-over");
    };
    const handleModalDragLeave = function() {
      this.classList.remove("drag-over", "drop-above", "drop-below");
    };
    const handleModalDrop = async function(e) {
      if (e.stopPropagation) {
        e.stopPropagation();
      }
      const dropPosition = this.classList.contains("drop-above") ? "above" : "below";
      this.classList.remove("drag-over", "drop-above", "drop-below");
      if (modalDragSrcEl !== this) {
        const oldIndex = parseInt(modalDragSrcEl.dataset.index || "0");
        let newIndex = parseInt(this.dataset.index || "0");
        if (dropPosition === "below") {
          newIndex++;
        }
        const settings = await getSettings();
        const newTabs = [...settings.tabs];
        const [movedTab] = newTabs.splice(oldIndex, 1);
        if (oldIndex < newIndex) {
          newIndex--;
        }
        newTabs.splice(newIndex, 0, movedTab);
        await updateTabOrder(newTabs);
        refreshList();
        currentSettings = await getSettings();
        renderTabs();
      }
      return false;
    };
    const handleModalDragEnd = function() {
      modalDragSrcEl = null;
      list.querySelectorAll("li").forEach((item) => {
        item.classList.remove("drag-over", "dragging", "drop-above", "drop-below");
      });
    };
    const refreshList = async () => {
      const settings = await getSettings();
      list.innerHTML = "";
      settings.tabs.forEach((tab, index) => {
        const li = document.createElement("li");
        li.setAttribute("draggable", "true");
        li.dataset.index = index.toString();
        li.innerHTML = `
                <div class="modal-drag-handle" title="Drag to reorder">
                    <svg viewBox="0 0 24 24"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                </div>
                <span class="tab-info">${tab.title} <small style="color: #888; font-size: 0.8em;">(${tab.type === "hash" ? "Custom" : "Label"})</small></span>
                <div class="actions">
                    ${index > 0 ? '<button class="up-btn">\u2191</button>' : ""}
                    ${index < settings.tabs.length - 1 ? '<button class="down-btn">\u2193</button>' : ""}
                    <button class="remove-btn">\u2715</button>
                </div>
            `;
        li.querySelector(".remove-btn")?.addEventListener("click", async () => {
          await removeTab(tab.id);
          refreshList();
          currentSettings = await getSettings();
          renderTabs();
        });
        li.querySelector(".up-btn")?.addEventListener("click", async () => {
          const newTabs = [...settings.tabs];
          [newTabs[index - 1], newTabs[index]] = [newTabs[index], newTabs[index - 1]];
          await updateTabOrder(newTabs);
          refreshList();
          currentSettings = await getSettings();
          renderTabs();
        });
        li.querySelector(".down-btn")?.addEventListener("click", async () => {
          const newTabs = [...settings.tabs];
          [newTabs[index + 1], newTabs[index]] = [newTabs[index], newTabs[index + 1]];
          await updateTabOrder(newTabs);
          refreshList();
          currentSettings = await getSettings();
          renderTabs();
        });
        li.addEventListener("dragstart", handleModalDragStart);
        li.addEventListener("dragover", handleModalDragOver);
        li.addEventListener("dragenter", handleModalDragEnter);
        li.addEventListener("dragleave", handleModalDragLeave);
        li.addEventListener("drop", handleModalDrop);
        li.addEventListener("dragend", handleModalDragEnd);
        list.appendChild(li);
      });
    };
    const errorMsg = modal.querySelector("#modal-error-msg");
    input.addEventListener("input", () => {
      input.classList.remove("input-error");
      errorMsg.style.display = "none";
    });
    addBtn.addEventListener("click", async () => {
      let value = input.value.trim();
      let title = titleInput.value.trim();
      if (value) {
        let type = "label";
        let finalValue = value;
        if (value.includes("http") || value.includes("mail.google.com") || value.startsWith("#")) {
          type = "hash";
          if (value.includes("#")) {
            finalValue = "#" + value.split("#")[1];
          }
        } else {
          if (value.toLowerCase().startsWith("label:")) {
            finalValue = value.substring(6).trim();
          }
        }
        const settings = await getSettings();
        const existingTab = settings.tabs.find((t) => t.value === finalValue);
        if (existingTab) {
          input.classList.add("input-error");
          errorMsg.textContent = `View URL / Label already exists with tab display name as "${existingTab.title}"`;
          errorMsg.style.display = "block";
          return;
        }
        if (type === "hash") {
          if (!title) {
            alert("Please enter a Title for this tab.");
            titleInput.focus();
            return;
          }
          await addTab(title, finalValue, "hash");
        } else {
          await addTab(title || finalValue, finalValue, "label");
        }
        input.value = "";
        titleInput.value = "";
        titleGroup.style.display = "none";
        input.classList.remove("input-error");
        errorMsg.style.display = "none";
        refreshList();
        currentSettings = await getSettings();
        renderTabs();
      }
    });
    refreshList();
    const themeBtns = modal.querySelectorAll(".theme-btn");
    const updateThemeUI = (activeTheme) => {
      themeBtns.forEach((btn) => {
        if (btn.dataset.theme === activeTheme) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });
    };
    getSettings().then((settings) => {
      updateThemeUI(settings.theme);
    });
    themeBtns.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const theme = btn.dataset.theme;
        await saveSettings({ theme });
        updateThemeUI(theme);
        applyTheme(theme);
      });
    });
    const unreadToggle = modal.querySelector("#modal-unread-toggle");
    getSettings().then((settings) => {
      unreadToggle.checked = settings.showUnreadCount;
    });
    unreadToggle.addEventListener("change", async () => {
      await saveSettings({ showUnreadCount: unreadToggle.checked });
      currentSettings = await getSettings();
      renderTabs();
    });
  }
  function normalizeLabel(name) {
    return decodeURIComponent(name).toLowerCase().replace(/[\/\-_]/g, " ").replace(/\s+/g, " ").trim();
  }
  async function updateUnreadCount(tab, tabEl) {
    const countSpan = tabEl.querySelector(".unread-count");
    if (!countSpan) return;
    let labelForFeed = "";
    if (tab.type === "label") {
      labelForFeed = tab.value;
    } else if (tab.type === "hash") {
      if (tab.value === "#inbox") {
        labelForFeed = "";
      } else if (tab.value.startsWith("#label/")) {
        labelForFeed = tab.value.replace("#label/", "");
      }
    }
    if (labelForFeed !== void 0) {
      try {
        const encodedLabel = labelForFeed ? encodeURIComponent(labelForFeed) : "";
        const feedUrl = `${location.origin}${location.pathname}feed/atom/${encodedLabel}`;
        const response = await fetch(feedUrl);
        if (response.ok) {
          const text = await response.text();
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(text, "text/xml");
          const fullcount = xmlDoc.querySelector("fullcount");
          if (fullcount && fullcount.textContent) {
            const count = parseInt(fullcount.textContent, 10);
            if (count > 0) {
              countSpan.textContent = count.toString();
              return;
            } else {
              countSpan.textContent = "";
              return;
            }
          }
        }
      } catch (e) {
        console.warn("Gmail Tabs: Failed to fetch atom feed for", labelForFeed, e);
      }
    }
    const domCount = getUnreadCountFromDOM(tab);
    if (domCount) {
      countSpan.textContent = domCount;
    } else {
      countSpan.textContent = "";
    }
  }
  function getUnreadCountFromDOM(tab) {
    if (tab.type === "hash" && !tab.value.startsWith("#label/")) {
      if (tab.value === "#inbox") {
        const link2 = document.querySelector('a[href$="#inbox"]');
        if (link2) {
          const ariaLabel = link2.getAttribute("aria-label");
          if (ariaLabel) {
            const match = ariaLabel.match(/(\d+)\s+unread/);
            return match ? match[1] : "";
          }
        }
      }
      return "";
    }
    let labelName = tab.value;
    if (tab.type === "hash" && tab.value.startsWith("#label/")) {
      labelName = tab.value.replace("#label/", "");
    }
    const encodedLabel = encodeURIComponent(labelName).replace(/%20/g, "+");
    const hrefSuffix = "#label/" + encodedLabel;
    let link = document.querySelector('a[href$="' + hrefSuffix + '"]');
    if (!link) {
      const normalizedTarget = normalizeLabel(labelName);
      const candidates = document.querySelectorAll('a[href*="#label/"]');
      for (const candidate of candidates) {
        const title = candidate.getAttribute("title");
        if (title && normalizeLabel(title) === normalizedTarget) {
          link = candidate;
          break;
        }
        const ariaLabel = candidate.getAttribute("aria-label");
        if (ariaLabel) {
          const normAria = normalizeLabel(ariaLabel);
          const href = candidate.getAttribute("href");
          if (href) {
            const hrefLabel = href.split("#label/")[1];
            if (hrefLabel && normalizeLabel(hrefLabel) === normalizedTarget) {
              link = candidate;
              break;
            }
          }
        }
      }
    }
    if (link) {
      const ariaLabel = link.getAttribute("aria-label");
      if (ariaLabel) {
        const match = ariaLabel.match(/(\d+)\s+unread/);
        return match ? match[1] : "";
      }
      const countEl = link.querySelector(".bsU");
      if (countEl) {
        return countEl.textContent || "";
      }
    }
    return "";
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
