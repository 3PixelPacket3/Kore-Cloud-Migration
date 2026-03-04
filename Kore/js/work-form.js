// New Work Request form page
// --------------------------------
(function () {
  const STORAGE_KEY = "work";

  function getEditId() {
    try {
      const p = new URLSearchParams(window.location.search || "");
      const id = p.get("id");
      return id ? String(id) : "";
    } catch (e) {
      return "";
    }
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function makeId() {
    return "work-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function loadItems() {
    try {
      if (window.KoreStore && window.KoreStore.readArray) {
        return window.KoreStore.readArray(STORAGE_KEY);
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function saveItems(items) {
    const ok = (window.KoreStore && window.KoreStore.writeArray)
      ? window.KoreStore.writeArray(STORAGE_KEY, items)
      : (function () {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
            return true;
          } catch (e) {
            return false;
          }
        })();

    if (!ok) {
      alert(
        "Kore could not save this Work Request because browser storage is full.\n\n" +
          "Fix options:\n" +
          "• Export a Kore Backup (Settings → Backup)\n" +
          "• Clear some stored data (Settings → Reset Content) or remove large Docs uploads\n" +
          "• Then try again."
      );
    }
    return ok;
  }


  function loadWorkTheme() {
    try {
      const raw = localStorage.getItem("workConfig");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed.theme || typeof parsed.theme !== "object") return null;
      return parsed.theme;
    } catch (e) {
      return null;
    }
  }

  function colorFor(kind, value) {
    const theme = loadWorkTheme();
    const val = String(value || "");
    if (!theme) return "";
    if (kind === "type" && theme.typeColors && theme.typeColors[val]) return theme.typeColors[val];
    if (kind === "account" && theme.accountColors && theme.accountColors[val]) return theme.accountColors[val];
    if (kind === "priority" && theme.priorityColors && theme.priorityColors[val]) return theme.priorityColors[val];
    if (kind === "status" && theme.statusColors && theme.statusColors[val]) return theme.statusColors[val];
    return "";
  }

  function hexToRgba(hex, alpha) {
    const h = String(hex || "").replace("#", "");
    if (h.length !== 6) return "";
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return "";
    const a = typeof alpha === "number" ? alpha : 0.18;
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }
  function applySelectBubble(selectEl, kind) {
    if (!selectEl) return;
    const val = selectEl.value;
    const color = colorFor(kind, val);
    if (color) {
      selectEl.style.borderColor = color;
      selectEl.style.backgroundColor = hexToRgba(color, 0.22);
      selectEl.style.color = "#0b1120";
    } else {
      selectEl.style.borderColor = "";
      selectEl.style.backgroundColor = "";
      selectEl.style.color = "";
    }
  }



  function initWorkNotesEditor() {
    const editor = document.getElementById("workNotesEditor");
    const htmlEl = document.getElementById("newNotes");
    const toolbar = document.querySelector(".work-notes-toolbar");
    const htmlBtn = document.getElementById("workNotesHtmlModeBtn");
    if (!editor || !htmlEl) return;

    let isHtmlMode = false;

    function getNotesHtml() {
      if (isHtmlMode) return htmlEl.value || "";
      return editor.innerHTML || "";
    }

    function setNotesHtml(html) {
      const safe = String(html || "");
      editor.innerHTML = safe || "<p></p>";
      htmlEl.value = safe;
    }

    function syncToTextarea() {
      htmlEl.value = isHtmlMode ? (htmlEl.value || "") : (editor.innerHTML || "");
    }

    function enableHtmlMode(enable) {
      isHtmlMode = !!enable;
      if (isHtmlMode) {
        htmlEl.value = editor.innerHTML || "";
        editor.style.display = "none";
        htmlEl.style.display = "block";
        if (htmlBtn) htmlBtn.textContent = "Rich Text";
        if (toolbar) toolbar.classList.add("editor-toolbar--disabled");
      } else {
        editor.innerHTML = htmlEl.value || "";
        editor.style.display = "block";
        htmlEl.style.display = "none";
        if (htmlBtn) htmlBtn.textContent = "HTML";
        if (toolbar) toolbar.classList.remove("editor-toolbar--disabled");
      }
    }

    if (toolbar) {
      toolbar.addEventListener("click", function (e) {
        const btn = e.target.closest("button");
        if (!btn) return;
        const cmd = btn.getAttribute("data-cmd");
        const action = btn.getAttribute("data-action");

        if (cmd) {
          editor.focus();
          document.execCommand(cmd, false, btn.getAttribute("data-value") || null);
          syncToTextarea();
          return;
        }

        if (action === "link") {
          const url = window.prompt("Enter link URL:");
          if (!url) return;
          editor.focus();
          document.execCommand("createLink", false, url);
          syncToTextarea();
          return;
        }
      });
    }

    if (htmlBtn) {
      htmlBtn.addEventListener("click", function () {
        enableHtmlMode(!isHtmlMode);
      });
    }

    // Initialize textarea value from editor
    syncToTextarea();

    return {
      getNotesHtml,
      setNotesHtml,
      enableHtmlMode,
    };
  }

  
function loadWorkConfig() {
    const DEFAULT_TYPES = [
      "Content Change",
      "New Page",
      "Bug Fix",
      "Access Issue",
      "General IT",
    ];
    const DEFAULT_ACCOUNTS = [
      "General",
      "Internal",
      "External",
    ];

    // 1) Prefer simple config written by work-options.js
    try {
      const simpleRaw = localStorage.getItem("workConfigSimple");
      if (simpleRaw) {
        const simple = JSON.parse(simpleRaw);
        const types = Array.isArray(simple.types) ? simple.types : [];
        const accounts = Array.isArray(simple.accounts) ? simple.accounts : [];
        if (types.length || accounts.length) {
          return {
            types: types.length ? types : DEFAULT_TYPES.slice(),
            accounts: accounts.length ? accounts : DEFAULT_ACCOUNTS.slice(),
          };
        }
      }
    } catch (e) {
      // ignore and fall through
    }

    // 2) Fallback to older keys koreWorkTypes / koreWorkAccounts
    try {
      const tRaw = localStorage.getItem("koreWorkTypes");
      const aRaw = localStorage.getItem("koreWorkAccounts");
      const types = tRaw ? JSON.parse(tRaw) : [];
      const accounts = aRaw ? JSON.parse(aRaw) : [];
      if (Array.isArray(types) && Array.isArray(accounts) && (types.length || accounts.length)) {
        return {
          types: types.length ? types : DEFAULT_TYPES.slice(),
          accounts: accounts.length ? accounts : DEFAULT_ACCOUNTS.slice(),
        };
      }
    } catch (e) {
      // ignore and fall through
    }

    // 3) Lastly, fall back to legacy workConfig shape if present
    try {
      const raw = localStorage.getItem("workConfig");
      if (!raw) {
        return { types: DEFAULT_TYPES.slice(), accounts: DEFAULT_ACCOUNTS.slice() };
      }
      const parsed = JSON.parse(raw);
      const rawTypes = Array.isArray(parsed.types) ? parsed.types : [];
      const rawAccounts = Array.isArray(parsed.accounts) ? parsed.accounts : [];
      const types = rawTypes
        .flatMap(function (t) { return String(t || "").split(/[\r\n,]+/); })
        .map(function (s) { return s.trim(); })
        .filter(function (s) { return s.length > 0; });
      const accounts = rawAccounts
        .flatMap(function (t) { return String(t || "").split(/[\r\n,]+/); })
        .map(function (s) { return s.trim(); })
        .filter(function (s) { return s.length > 0; });
      return {
        types: types.length ? types : DEFAULT_TYPES.slice(),
        accounts: accounts.length ? accounts : DEFAULT_ACCOUNTS.slice(),
      };
    } catch (e) {
      return { types: DEFAULT_TYPES.slice(), accounts: DEFAULT_ACCOUNTS.slice() };
    }
  }
  function initForm() {
    const form = document.getElementById("workNewForm");
    if (!form) return;

    const titleEl = document.getElementById("newTitle");
    const typeEl = document.getElementById("newType");
    const accountEl = document.getElementById("newAccount");
    const priorityEl = document.getElementById("newPriority");
    const statusEl = document.getElementById("newStatus");
    const requestorEl = document.getElementById("newRequestor");
    const createdEl = document.getElementById("newCreated");
    const dueEl = document.getElementById("newDue");
    const notesEl = document.getElementById("newNotes");
    const notesEditorEl = document.getElementById("workNotesEditor");
    const notesToolbarEl = document.querySelector(".work-notes-toolbar");
    const notesHtmlModeBtn = document.getElementById("workNotesHtmlModeBtn");
    const cancelBtn = document.getElementById("cancelNewWorkBtn");


    const cfg = loadWorkConfig();
    const notesEditor = initWorkNotesEditor();

function populateSelect(select, values) {
      if (!select) return;
      select.innerHTML = "";
      (values || []).forEach(function (val) {
        const opt = document.createElement("option");
        opt.value = val;
        opt.textContent = val;
        select.appendChild(opt);
      });
    }

    function buildChipRow(containerId, selectEl, kind) {
      const container = document.getElementById(containerId);
      if (!container || !selectEl) return;

      // Ensure select has options first
      const current = selectEl.value || (selectEl.options[0] && selectEl.options[0].value) || "";
      container.innerHTML = "";
      const opts = Array.from(selectEl.options);

      opts.forEach(function (opt) {
        const value = opt.value;
        const label = opt.textContent || value;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "work-chip" + (value === current ? " work-chip--active" : "");
        btn.textContent = label;
        btn.dataset.value = value;

        // Apply per-option color if configured
        const color = colorFor(kind, value);
        if (color) {
          if (value === current) {
            btn.style.borderColor = color;
            btn.style.backgroundColor = color;
            btn.style.color = "#0b1120";
          } else {
            btn.style.borderColor = color;
          }
        }

        btn.addEventListener("click", function () {
          const chosen = btn.dataset.value || "";
          selectEl.value = chosen;

          // Update visual state
          Array.from(container.querySelectorAll(".work-chip")).forEach(function (el) {
            const isActive = el === btn;
            el.classList.toggle("work-chip--active", isActive);
            const val = el.getAttribute("data-value");
            const c = colorFor(kind, val);
            if (c && isActive) {
              el.style.borderColor = c;
              el.style.backgroundColor = c;
              el.style.color = "#0b1120";
            } else if (c && !isActive) {
              el.style.borderColor = c;
              el.style.backgroundColor = "rgba(15,23,42,0.85)";
              el.style.color = "#e5e7eb";
            }
          });
        });

        container.appendChild(btn);
      });
    }


    populateSelect(typeEl, cfg.types);
    populateSelect(accountEl, cfg.accounts);

    // Apply initial bubble colors to dropdowns
    applySelectBubble(typeEl, "type");
    applySelectBubble(accountEl, "account");
    applySelectBubble(priorityEl, "priority");
    applySelectBubble(statusEl, "status");

    // Update bubble colors when selections change
    if (typeEl) typeEl.addEventListener("change", function () { applySelectBubble(typeEl, "type"); });
    if (accountEl) accountEl.addEventListener("change", function () { applySelectBubble(accountEl, "account"); });
    if (priorityEl) priorityEl.addEventListener("change", function () { applySelectBubble(priorityEl, "priority"); });
    if (statusEl) statusEl.addEventListener("change", function () { applySelectBubble(statusEl, "status"); });

    const items = loadItems();
    const editId = getEditId();

    if (createdEl) {
      // Default created date for new items; preserve existing when editing
      if (!editId) createdEl.value = todayISO();
    }

    // If editing, load the existing item and populate the form
    let existing = null;
    if (editId) {
      existing = items.find((x) => x && x.id === editId) || null;
      if (existing) {
        if (titleEl) titleEl.value = existing.title || "";
        if (typeEl) typeEl.value = existing.type || "";
        if (accountEl) accountEl.value = existing.account || "";
        if (priorityEl) priorityEl.value = existing.priority || "Medium";
        if (statusEl) statusEl.value = existing.status || "Open";
        if (requestorEl) requestorEl.value = existing.requestor || "";
        if (createdEl) createdEl.value = existing.createdAt || todayISO();
        if (dueEl) dueEl.value = existing.dueDate || "";
        if (notesEditor && existing.notes) notesEditor.setNotesHtml(existing.notes);

        // Refresh dropdown bubble colors to reflect existing selections
        applySelectBubble(typeEl, "type");
        applySelectBubble(accountEl, "account");
        applySelectBubble(priorityEl, "priority");
        applySelectBubble(statusEl, "status");

        const heading = document.querySelector('.page-title');
        if (heading) heading.textContent = 'Edit Work Request';
        const btn = document.querySelector('#workNewForm button[type="submit"]');
        if (btn) btn.textContent = 'Save Changes';
      }
    }


    const archiveBtn = document.getElementById("archiveWorkBtn");
    if (archiveBtn) {
      if (!editId || !existing) {
        archiveBtn.style.display = "none";
      } else {
        archiveBtn.style.display = "";
        archiveBtn.addEventListener("click", function () {
          const itemsNow = loadItems();
          const idx = itemsNow.findIndex(function (x) { return x && x.id === editId; });
          if (idx === -1) {
            alert("Kore could not find this work request to archive. Try returning to the Work Tracker and opening it again.");
            return;
          }
          if (!confirm("Archive this work request? It will be hidden from the main Work Tracker list but kept for reports, Ask Kore, and backups until you permanently delete it from the Work Tracker Archive page.")) {
            return;
          }
          const prior = itemsNow[idx] || {};
          itemsNow[idx] = Object.assign({}, prior, {
            id: editId,
            archived: true,
            updatedAt: new Date().toISOString()
          });
          saveItems(itemsNow);
          window.location.href = "work.html";
        });
      }
    }

    if (cancelBtn) {
      cancelBtn.addEventListener("click", function () {
        window.location.href = "work.html";
      });
    }

    form.addEventListener("submit", function (evt) {
      evt.preventDefault();
      if (!titleEl || !titleEl.value.trim()) {
        if (titleEl) titleEl.focus();
        return;
      }

      const items = loadItems();
      const editId = getEditId();
      const now = todayISO();

      const title = titleEl ? titleEl.value.trim() : "";
      const type = typeEl ? typeEl.value : "";
      const account = accountEl ? accountEl.value : "";
      const priority = priorityEl ? priorityEl.value : "Medium";
      const status = statusEl ? statusEl.value : "New";
      const requestor = requestorEl ? requestorEl.value.trim() : "";
      const created = createdEl ? createdEl.value : "";
      const dueDate = dueEl ? dueEl.value : "";
      const notes = notesEditor ? notesEditor.getNotesHtml() : (notesEl ? notesEl.value.trim() : "");

      if (editId) {
        const idx = items.findIndex((x) => x && x.id === editId);
        if (idx >= 0) {
          // Update existing
          const prior = items[idx] || {};
          items[idx] = {
            ...prior,
            id: editId,
            title: title,
            type: type,
            account: account,
            priority: priority,
            status: status,
            requestor: requestor,
            createdAt: created,
            dueDate: dueDate,
            notes: notes,
            updatedAt: new Date().toISOString(),
          };
          if (saveItems(items)) {
            window.location.href = "work.html";
          }
          return;
        }
        // If editId was provided but item not found, fall through and create a new one
      }

      const newItem = {
        id: makeId(),
        title: title,
        type: type,
        account: account,
        priority: priority,
        status: status,
        requestor: requestor,
        createdAt: created || now,
        dueDate: dueDate,
        notes: notes,
        updatedAt: new Date().toISOString(),
      };

      items.push(newItem);
      if (saveItems(items)) {
        window.location.href = "work.html";
      }
});
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initForm);
  } else {
    initForm();
  }
})();
