// Apps & Tools Hub
// -----------------
// Stores a list of external shortcuts in localStorage.apps.
// Backwards-compatible with earlier structures that only had name/url/icon.

(function () {
  const STORAGE_KEY = "apps";
  const grid = document.getElementById("appGrid");
  const addBtn = document.getElementById("addApp");

  if (!grid) return; // defensive if script loaded on another page

  function esc(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function makeId() {
    try {
      if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
      }
    } catch (e) {
      // ignore
    }
    return "app-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function normalizeApp(raw) {
    if (!raw || typeof raw !== "object") {
      return {
        id: makeId(),
        name: "Untitled App",
        url: "#",
        icon: "",
        description: "",
      };
    }
    return {
      id: raw.id || makeId(),
      name: raw.name || "Untitled App",
      url: raw.url || "#",
      icon: raw.icon || "",
      description: raw.description || "",
    };
  }

  function loadApps() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) return [];
      return arr.map(normalizeApp);
    } catch (e) {
      return [];
    }
  }

  let apps = loadApps();

  function saveApps() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
    } catch (e) {
      // ignore storage errors in offline mode
    }
  }

  function render() {
    grid.innerHTML = "";
    if (!apps.length) {
      const empty = document.createElement("div");
      empty.className = "apps-empty";
      empty.textContent = "No apps or tools yet. Use \"Add App / Tool\" to create your first shortcut.";
      grid.appendChild(empty);
      return;
    }

    apps.forEach((app) => {
      const bubble = document.createElement("div");
      bubble.className = "app-bubble";

      const desc = app.description || "External app, site, or tool.";

      bubble.innerHTML = `
        <div class="app-bubble-actions">
          <button type="button" class="app-bubble-action-btn app-bubble-edit" data-id="${esc(app.id)}" title="Edit">✎</button>
          <button type="button" class="app-bubble-action-btn app-bubble-delete" data-id="${esc(app.id)}" title="Delete">🗑</button>
        </div>
        <a href="${esc(app.url || "#")}" target="_blank" rel="noopener" class="app-bubble-link" aria-label="Open ${esc(app.name)}">
          <div class="app-bubble-icon">
            ${
              app.icon
                ? `<img src="${esc(app.icon)}" alt="${esc(app.name)} icon">`
                : `<span aria-hidden="true">⇱</span>`
            }
          </div>
          <div class="app-bubble-title">${esc(app.name)}</div>
          <div class="app-bubble-desc">${esc(desc)}</div>
        </a>
      `;

      grid.appendChild(bubble);
    });
  }

  function addApp() {
    const name = prompt("App or tool name:", "");
    if (name === null) return;
    let url = prompt("App or tool URL (https://...):", "");
    if (url === null) return;
    url = url.trim();
    if (url && !/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }
    const description = prompt("Short description (why you use it):", "") || "";

    // Always add the shortcut immediately so the action never "does nothing".
    // (Some browsers do not fire onchange if the file picker is cancelled.)
    const newApp = normalizeApp({
      id: makeId(),
      name: name.trim() || "Untitled App",
      url,
      icon: "",
      description: description.trim(),
    });

    apps.push(newApp);
    saveApps();
    render();

    // Optional icon upload
    const wantsIcon = confirm(
      "Shortcut added. Do you want to add an icon image now?\n\nTip: You can also change the icon later via Edit."
    );
    if (!wantsIcon) return;

    const iconInput = document.createElement("input");
    iconInput.type = "file";
    iconInput.accept = "image/*";

    iconInput.onchange = () => {
      const file = iconInput.files && iconInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const idx = findIndexById(newApp.id);
        if (idx === -1) return;
        apps[idx].icon = reader.result;
        saveApps();
        render();
      };
      reader.readAsDataURL(file);
    };

    iconInput.click();
  }

  function findIndexById(id) {
    return apps.findIndex((a) => a.id === id);
  }

  function editApp(id) {
    const idx = findIndexById(id);
    if (idx === -1) return;
    const app = apps[idx];

    const name = prompt("App or tool name:", app.name || "");
    if (name === null) return;

    let url = prompt("App or tool URL (https://...):", app.url || "");
    if (url === null) return;
    url = url.trim();
    if (url && !/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    const description = prompt("Short description (why you use it):", app.description || "") || "";

    app.name = name.trim() || app.name || "Untitled App";
    app.url = url || app.url || "#";
    app.description = description.trim();

    // Optional: allow icon change
    if (confirm("Change icon image as well?")) {
      const iconInput = document.createElement("input");
      iconInput.type = "file";
      iconInput.accept = "image/*";
      iconInput.onchange = () => {
        const file = iconInput.files && iconInput.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            app.icon = reader.result;
            saveApps();
            render();
          };
          reader.readAsDataURL(file);
        } else {
          saveApps();
          render();
        }
      };
      iconInput.click();
    } else {
      saveApps();
      render();
    }
  }

  function deleteApp(id) {
    const idx = findIndexById(id);
    if (idx === -1) return;
    if (!confirm("Remove this app/tool shortcut?")) return;
    apps.splice(idx, 1);
    saveApps();
    render();
  }

  // Event wiring
  if (addBtn) {
    addBtn.addEventListener("click", addApp);
  }

  grid.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    const editBtn = target.closest(".app-bubble-edit");
    const deleteBtn = target.closest(".app-bubble-delete");

    if (editBtn && editBtn instanceof HTMLButtonElement) {
      const id = editBtn.getAttribute("data-id");
      if (id) editApp(id);
      return;
    }

    if (deleteBtn && deleteBtn instanceof HTMLButtonElement) {
      const id = deleteBtn.getAttribute("data-id");
      if (id) deleteApp(id);
      return;
    }
  });

  // Initial paint
  render();
})();
