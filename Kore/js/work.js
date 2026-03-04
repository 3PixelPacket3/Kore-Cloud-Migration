// Work Tracker (Overview + Details Modal)
// -------------------------------------
// Shows a bubble/card overview of tickets. Clicking a card opens a modal with full details.
// Data persists in localStorage.work and is backwards-compatible with earlier versions.

(function () {
  const STORAGE_KEY = "work";

  const listEl = document.getElementById("workList");
  const emptyState = document.getElementById("workEmptyState");
  const addBtn = document.getElementById("addWorkItemBtn");
  const exportBtn = document.getElementById("exportCsvBtn");
  const statusFilter = document.getElementById("workStatusFilter");
  const priorityFilter = document.getElementById("workPriorityFilter");
  const typeFilter = document.getElementById("workTypeFilter");
  const accountFilter = document.getElementById("workAccountFilter");
  const sortSelect = document.getElementById("workSort");
  const hideCompletedCheckbox = document.getElementById("workHideCompleted");
  const hideOnHoldCheckbox = document.getElementById("workHideOnHold");

  // Modal elements
  const modalEl = document.getElementById("workModal");
  const modalCloseBtn = document.getElementById("workModalClose");
  const modalCancelBtn = document.getElementById("wmCancel");
  const modalSaveBtn = document.getElementById("wmSave");
  const modalDeleteBtn = document.getElementById("wmDelete");
  const modalMetaEl = document.getElementById("workModalMeta");

  const wmTitle = document.getElementById("wmTitle");
  const wmType = document.getElementById("wmType");
  const wmAccount = document.getElementById("wmAccount");
  const wmPriority = document.getElementById("wmPriority");
  const wmStatus = document.getElementById("wmStatus");
  const wmRequestor = document.getElementById("wmRequestor");
  const wmCreated = document.getElementById("wmCreated");
  const wmDue = document.getElementById("wmDue");
  const wmNotes = document.getElementById("wmNotes");
  const wmTags = document.getElementById("wmTags");
  const wmEstEffort = document.getElementById("wmEstEffort");
  const wmActEffort = document.getElementById("wmActEffort");

  if (!listEl) return; // defensive

  const DEFAULT_TYPES = ["Content Change", "New Page", "Bug Fix", "Access Issue", "General IT"];
  const DEFAULT_ACCOUNTS = ["General", "Internal", "External"];

  const PRIORITY_ORDER = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
  const STATUS_ORDER = { New: 0, "In Progress": 1, "On Hold": 2, Completed: 3 };

  const state = {
    items: [],
    activeId: null,
    filters: {
      status: "all",
      priority: "all",
      type: "all",
      account: "all",
      sort: "created_desc",
      hideCompleted: false,
      hideOnHold: false,
    },
  };

  const FILTER_PREFS_KEY = "workFilterPrefs_v1";

  function loadFilterPrefs() {
    try {
      const raw = localStorage.getItem(FILTER_PREFS_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      return {
        hideCompleted: !!parsed.hideCompleted,
        hideOnHold: !!parsed.hideOnHold,
        status: parsed.status || "all",
        priority: parsed.priority || "all",
        type: parsed.type || "all",
        account: parsed.account || "all",
        sort: parsed.sort || "created_desc",
      };
    } catch (e) {
      return null;
    }
  }

  function saveFilterPrefs() {
    try {
      const f = state.filters || {};
      const payload = {
        hideCompleted: !!f.hideCompleted,
        hideOnHold: !!f.hideOnHold,
        status: f.status || "all",
        priority: f.priority || "all",
        type: f.type || "all",
        account: f.account || "all",
        sort: f.sort || "created_desc",
      };
      localStorage.setItem(FILTER_PREFS_KEY, JSON.stringify(payload));
    } catch (e) {
      // ignore persistence errors
    }
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
    const a = typeof alpha === "number" ? alpha : 0.16;
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function makeId() {
    return "work-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function esc(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeTags(input) {
    if (!input) return [];
    if (Array.isArray(input)) {
      return input
        .map(String)
        .map(function (t) { return t.trim(); })
        .filter(function (t) { return t.length > 0; });
    }
    const raw = String(input || "");
    if (!raw.trim()) return [];
    const parts = raw
      .replace(/[#;]/g, " ")
      .split(/[\s,]+/)
      .map(function (t) { return t.trim(); })
      .filter(function (t) { return t.length > 0; });
    const seen = new Set();
    const out = [];
    for (const p of parts) {
      const lower = p.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        out.push(lower);
      }
    }
    return out;
  }

function formatTags(tags) {
    if (!Array.isArray(tags) || !tags.length) return "";
    return tags.map((t) => (t.startsWith("#") ? t : "#" + t)).join(", ");
  }

function mapLegacyStatus(status) {
    const s = String(status || "").toLowerCase();
    if (!s) return "New";
    if (s.includes("not started")) return "New";
    if (s.includes("100")) return "Completed";
    if (s.includes("on hold")) return "On Hold";
    if (s.includes("behind")) return "On Hold";
    if (s.includes("25") || s.includes("50") || s.includes("75")) return "In Progress";
    return "In Progress";
  }

  function normalizeItem(raw) {
    if (!raw || typeof raw !== "object") {
      return {
        id: makeId(),
        title: "Untitled request",
        type: "General IT",
        account: "",
        priority: "Medium",
        status: "New",
        requestor: "",
        createdAt: todayISO(),
        dueDate: "",
        notes: "",
        tags: [],
        estimatedEffort: "",
        actualEffort: "",
        archived: false,
      };
    }

    const hasNewShape =
      Object.prototype.hasOwnProperty.call(raw, "title") ||
      Object.prototype.hasOwnProperty.call(raw, "type") ||
      Object.prototype.hasOwnProperty.call(raw, "priority");

    if (!hasNewShape) {
      return {
        id: raw.id || makeId(),
        title: raw.name || "Untitled request",
        type: "General IT",
        account: raw.account || "",
        priority: "Medium",
        status: mapLegacyStatus(raw.status),
        requestor: "",
        createdAt: raw.createdAt || todayISO(),
        dueDate: raw.dueDate || "",
        notes: raw.notes || raw.desc || "",
      };
    }

    return {
      id: raw.id || makeId(),
      title: raw.title || raw.name || "Untitled request",
      type: raw.type || "General IT",
      account: raw.account || "",
      priority: raw.priority || "Medium",
      status: raw.status || "New",
      requestor: raw.requestor || "",
      createdAt: raw.createdAt || todayISO(),
      dueDate: raw.dueDate || "",
      notes: raw.notes || "",
      tags: parseTags(raw.tags),
      estimatedEffort: raw.estimatedEffort || "",
      actualEffort: raw.actualEffort || "",
      archived: !!raw.archived,
    };
  }

  function loadItems() {
    try {
      const arr = (window.KoreStore && window.KoreStore.readArray)
        ? window.KoreStore.readArray(STORAGE_KEY)
        : (function () {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
          })();
      if (!Array.isArray(arr)) return [];
      // Normalize and drop archived items from the main Work Tracker state.
      // Archived requests are still fully available to the Work Archive page.
      const normalized = arr.map(normalizeItem);
      return normalized.filter(function (i) { return !i.archived; });
    } catch (e) {
      return [];
    }
  }

  function saveItems() {
    const ok = (window.KoreStore && window.KoreStore.writeArray)
      ? window.KoreStore.writeArray(STORAGE_KEY, state.items)
      : (function () {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
            return true;
          } catch (e) {
            return false;
          }
        })();

    if (!ok) {
      alert(
        "Kore could not save your Work Tracker changes because browser storage is full.\n\n" +
          "Fix options:\n" +
          "• Export a Kore Backup (Settings → Backup)\n" +
          "• Clear some stored data (Settings → Reset Content) or remove large Docs uploads\n" +
          "• Then try again."
      );
    }
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
      // fall through
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
      // fall through
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

  let workConfig = loadWorkConfig();

  function uniqueSorted(values) {
    return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }

  function buildFilterOptions() {
    const typeValues = uniqueSorted([...(workConfig.types || DEFAULT_TYPES), ...state.items.map((i) => i.type)]);
    const accountValues = uniqueSorted([...(workConfig.accounts || DEFAULT_ACCOUNTS), ...state.items.map((i) => i.account)]);

    function populate(select, values, allLabel) {
      if (!select) return;
      const current = select.value || "all";
      select.innerHTML = "";
      const allOpt = document.createElement("option");
      allOpt.value = "all";
      allOpt.textContent = allLabel;
      select.appendChild(allOpt);
      values.forEach((v) => {
        const opt = document.createElement("option");
        opt.value = v;
        opt.textContent = v;
        select.appendChild(opt);
      });
      if (current !== "all" && values.includes(current)) select.value = current;
    }

    populate(typeFilter, typeValues, "All types");
    populate(accountFilter, accountValues, "All accounts");
  }

  function applyFilters() {
    const { status, priority, type, account, sort, hideCompleted, hideOnHold } = state.filters;
    let items = state.items.slice();
    // Hide archived items from main view
    items = items.filter((i) => !i.archived);

    if (status !== "all") items = items.filter((i) => i.status === status);
    if (priority !== "all") items = items.filter((i) => i.priority === priority);
    if (type !== "all") items = items.filter((i) => i.type === type);
    if (account !== "all") items = items.filter((i) => (i.account || "") === account);
    if (hideCompleted) items = items.filter((i) => i.status !== "Completed");
    if (hideOnHold) items = items.filter((i) => i.status !== "On Hold");

    items.sort((a, b) => {
      if (sort === "created_asc") return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
      if (sort === "priority") return ((PRIORITY_ORDER[a.priority] !== undefined ? PRIORITY_ORDER[a.priority] : 99)) - ((PRIORITY_ORDER[b.priority] !== undefined ? PRIORITY_ORDER[b.priority] : 99));
      if (sort === "status") return ((STATUS_ORDER[a.status] !== undefined ? STATUS_ORDER[a.status] : 99)) - ((STATUS_ORDER[b.status] !== undefined ? STATUS_ORDER[b.status] : 99));
      // default created_desc
      return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    });

    return items;
  }

  function badgeClassForStatus(status) {
    if (status === "New") return "kore-badge--status-new";
    if (status === "In Progress") return "kore-badge--status-progress";
    if (status === "On Hold") return "kore-badge--status-hold";
    if (status === "Completed") return "kore-badge--status-done";
    return "kore-badge--status-new";
  }

  function badgeClassForPriority(priority) {
    if (priority === "Low") return "kore-badge--prio-low";
    if (priority === "Medium") return "kore-badge--prio-med";
    if (priority === "High") return "kore-badge--prio-high";
    if (priority === "Urgent") return "kore-badge--prio-urgent";
    return "kore-badge--prio-med";
  }

  function snippet(text) {
  const t = String(text || '').trim();
  if (!t) return 'No notes yet. Click to add details.';
  const plain = t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return plain || 'No notes yet. Click to add details.';
}


  function render() {
    // Defensive: even if state or filters accidentally include archived items,
    // never show them in the main Work Tracker list.
    const items = applyFilters().filter(function (i) { return !i.archived; });

    listEl.innerHTML = "";

    if (!items.length) {
      if (emptyState) emptyState.style.display = "block";
      return;
    }

    if (emptyState) emptyState.style.display = "none";

    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "work-item-card";
      card.setAttribute("data-id", item.id);

      const title = item.title || "Untitled request";
      const metaBits = [item.type || "", item.account || ""].filter(Boolean).join(" • ");
      const due = item.dueDate ? `Due ${esc(item.dueDate)}` : "No due date";

      card.innerHTML = `
        <div class="work-item-top">
          <div>
            <div class="work-item-title">${esc(title)}</div>
            <div class="work-item-meta">${esc(metaBits || "General")}</div>
          </div>
          <div class="work-badges">
            <span class="kore-badge ${badgeClassForPriority(item.priority)} js-priority-badge">${esc(item.priority)}</span>
            <span class="kore-badge ${badgeClassForStatus(item.status)} js-status-badge">${esc(item.status)}</span>
          </div>
        </div>
        <div class="work-item-snippet">${esc(snippet(item.notes))}</div>
        <div class="work-item-footer">
          <span>Created ${esc(item.createdAt || "")}</span>
          <span>${due}</span>
          <button type="button" class="link-btn work-item-delete" data-id="${esc(item.id)}">Delete</button>
        </div>
      `;

      // Apply per-option colors for priority & status (including shading for On Hold)
      const prBadge = card.querySelector('.js-priority-badge');
      const stBadge = card.querySelector('.js-status-badge');
      const prColor = colorFor("priority", item.priority);
      const stColor = colorFor("status", item.status);

      if (prBadge && prColor) {
        prBadge.style.borderColor = prColor;
        prBadge.style.backgroundColor = hexToRgba(prColor, 0.16);
      }

      if (stBadge && stColor) {
        stBadge.style.borderColor = stColor;
        // Shade the pill with the configured color (especially visible for On Hold)
        stBadge.style.backgroundColor = hexToRgba(stColor, 0.2);
      }

      listEl.appendChild(card);
    });
  }

  function populateSelect(select, values, selectedValue, placeholderLabel) {
    if (!select) return;
    select.innerHTML = "";
    if (placeholderLabel) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = placeholderLabel;
      select.appendChild(opt);
    }
    values.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      select.appendChild(opt);
    });
    if (selectedValue && values.includes(selectedValue)) {
      select.value = selectedValue;
    } else if (!selectedValue && placeholderLabel) {
      select.value = "";
    }
  }

  function openModalForItem(item) {
    if (!modalEl) return;

    // Ensure config in case it was edited in Settings
    workConfig = loadWorkConfig();

    const allTypes = uniqueSorted([...(workConfig.types || DEFAULT_TYPES), item.type].filter(Boolean));
    const allAccounts = uniqueSorted([...(workConfig.accounts || DEFAULT_ACCOUNTS), item.account].filter(Boolean));
    populateSelect(wmType, allTypes, item.type || "", "Select type");
    populateSelect(wmAccount, allAccounts, item.account || "", "Select account");

    state.activeId = item.id;
    wmTitle.value = item.title || "";
    wmPriority.value = item.priority || "Medium";
    wmStatus.value = item.status || "New";
    wmRequestor.value = item.requestor || "";
    wmCreated.value = item.createdAt || "";
    wmDue.value = item.dueDate || "";
    wmNotes.value = item.notes || "";
    if (wmTags) wmTags.value = formatTags(item.tags || []);
    if (wmEstEffort) wmEstEffort.value = item.estimatedEffort || "";
    if (wmActEffort) wmActEffort.value = item.actualEffort || "";

    if (modalMetaEl) {
      const parts = [];
      if (item.id) parts.push(`ID: ${esc(item.id)}`);
      if (item.createdAt) parts.push(`Created: ${esc(item.createdAt)}`);
      modalMetaEl.innerHTML = parts.length ? parts.join(" • ") : "";
    }

    modalEl.style.display = "block";
    modalEl.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    setTimeout(() => {
      try { wmTitle.focus(); } catch (e) {}
    }, 0);
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.style.display = "none";
    modalEl.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    state.activeId = null;
  }

  function findById(id) {
    return state.items.find((i) => i.id === id) || null;
  }

  function upsertItem(updated) {
    const idx = state.items.findIndex((i) => i.id === updated.id);
    if (idx === -1) state.items.push(updated);
    else state.items[idx] = updated;
    saveItems();
    buildFilterOptions();
    render();
  }

  
  function deleteActiveItem() {
    if (!state.activeId) return;
    const idx = state.items.findIndex((i) => i.id === state.activeId);
    if (idx === -1) return;
    if (!confirm("Archive this work request? It will be hidden from the main list but kept for reports and backups.")) return;
    state.items[idx].archived = true;
    saveItems();
    buildFilterOptions();
    render();
    closeModal();
  }

  function createNewItem() {
function createNewItem() {
    const item = normalizeItem({
      id: makeId(),
      title: "",
      type: (workConfig.types && workConfig.types[0]) || "General IT",
      account: (workConfig.accounts && workConfig.accounts[0]) || "",
      priority: "Medium",
      status: "New",
      requestor: "",
      createdAt: todayISO(),
      dueDate: "",
      notes: "",
    });
    openModalForItem(item);
  }

  function saveFromModal() {
    if (!state.activeId || !wmTitle) return;

    const existing = findById(state.activeId) || normalizeItem({ id: state.activeId });
    const updated = {
      ...existing,
      title: (wmTitle.value || "").trim() || "Untitled request",
      type: wmType ? (wmType.value || existing.type) : existing.type,
      account: wmAccount ? (wmAccount.value || "") : (existing.account || ""),
      priority: wmPriority ? wmPriority.value : existing.priority,
      status: wmStatus ? wmStatus.value : existing.status,
      requestor: ((wmRequestor ? wmRequestor.value : "") || "").trim(),
      dueDate: (wmDue ? wmDue.value : "") || "",
      notes: ((wmNotes ? wmNotes.value : "") || "").trim(),
      createdAt: existing.createdAt || todayISO(),
      tags: parseTags((wmTags ? wmTags.value : "") || existing.tags || []),
      estimatedEffort: (wmEstEffort ? wmEstEffort.value : "") || existing.estimatedEffort || "",
      actualEffort: (wmActEffort ? wmActEffort.value : "") || existing.actualEffort || "",
    };

    upsertItem(updated);
    closeModal();
  }

  function exportCsv() {
    const items = applyFilters();
    const headers = ["Title", "Type", "Account", "Priority", "Status", "Requestor", "Created", "Due", "Notes"];

    const rows = items.map((i) => [
      i.title || "",
      i.type || "",
      i.account || "",
      i.priority || "",
      i.status || "",
      i.requestor || "",
      i.createdAt || "",
      i.dueDate || "",
      (i.notes || "").replaceAll("\n", " "),
    ]);

    const csv = [headers, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kore-work-tracker-${todayISO()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // --- Event wiring ---
  if (addBtn) addBtn.addEventListener("click", () => {
    window.location.href = "work-new.html";
  });
  if (exportBtn) exportBtn.addEventListener("click", exportCsv);

  function updateFiltersFromUI() {
    state.filters.status = statusFilter && statusFilter.value || "all";
    state.filters.priority = priorityFilter && priorityFilter.value || "all";
    state.filters.type = typeFilter && typeFilter.value || "all";
    state.filters.account = accountFilter && accountFilter.value || "all";
    state.filters.sort = sortSelect && sortSelect.value || "created_desc";
    state.filters.hideCompleted = !!(hideCompletedCheckbox && hideCompletedCheckbox.checked);
    state.filters.hideOnHold = !!(hideOnHoldCheckbox && hideOnHoldCheckbox.checked);
    saveFilterPrefs();
    render();
  }

  [statusFilter, priorityFilter, typeFilter, accountFilter, sortSelect].forEach((el) => {
    if (!el) return;
    el.addEventListener("change", updateFiltersFromUI);
  });
  if (hideCompletedCheckbox) {
    hideCompletedCheckbox.addEventListener("change", updateFiltersFromUI);
  }
  if (hideOnHoldCheckbox) {
    hideOnHoldCheckbox.addEventListener("change", updateFiltersFromUI);
  }

  listEl.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    // Inline delete button on card
    if (target.classList.contains("work-item-delete")) {
      const idAttr = target.getAttribute("data-id");
      const card = target.closest(".work-item-card");
      const id = idAttr || (card && card.getAttribute("data-id"));
      if (!id) return;
      state.activeId = id;
      deleteActiveItem();
      return;
    }

    const card = target.closest(".work-item-card");
    if (!card) return;
    const id = card.getAttribute("data-id");
    if (!id) return;
    const item = findById(id);
    if (item) {
      window.location.href = `work-new.html?id=${encodeURIComponent(id)}`;
    }
  });

  function handleModalCloseIntent(ev) {
    const t = ev.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.getAttribute("data-close") === "true") closeModal();
  }

  if (modalEl) modalEl.addEventListener("click", handleModalCloseIntent);
  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);
  if (modalCancelBtn) modalCancelBtn.addEventListener("click", closeModal);
  if (modalSaveBtn) modalSaveBtn.addEventListener("click", saveFromModal);
  if (modalDeleteBtn) modalDeleteBtn.addEventListener("click", deleteActiveItem);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalEl && modalEl.style.display === "block") {
      closeModal();
    }
  });

  // Live refresh if Settings updates workConfig (Type/Account lists)
  window.addEventListener("storage", (e) => {
    if (e.key !== "workConfig") return;
    workConfig = loadWorkConfig();
    buildFilterOptions();
    render();
  });

  
  // If URL contains ?id=, open that work item on load
  try {
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get("id");
    if (targetId) {
      const match = state.items.find((i) => i.id === targetId);
      if (match) {
        openModalForItem(match);
      }
    }
  } catch (e) {
    // ignore
  }

// Initial load
  const filterPrefs = loadFilterPrefs();
  if (filterPrefs) {
    state.filters.status = filterPrefs.status;
    state.filters.priority = filterPrefs.priority;
    state.filters.type = filterPrefs.type;
    state.filters.account = filterPrefs.account;
    state.filters.sort = filterPrefs.sort;
    state.filters.hideCompleted = filterPrefs.hideCompleted;
    state.filters.hideOnHold = filterPrefs.hideOnHold;
  }

  state.items = loadItems();
  buildFilterOptions();

  // Sync filter UI to loaded preferences
  if (statusFilter && state.filters.status !== "all") statusFilter.value = state.filters.status;
  if (priorityFilter && state.filters.priority !== "all") priorityFilter.value = state.filters.priority;
  if (typeFilter && state.filters.type !== "all") typeFilter.value = state.filters.type;
  if (accountFilter && state.filters.account !== "all") accountFilter.value = state.filters.account;
  if (sortSelect && state.filters.sort) sortSelect.value = state.filters.sort;
  if (hideCompletedCheckbox) hideCompletedCheckbox.checked = !!state.filters.hideCompleted;
  if (hideOnHoldCheckbox) hideOnHoldCheckbox.checked = !!state.filters.hideOnHold;
  render();
}


  // Expose a minimal helper for environments that want to open a work item by id
  // (e.g., inline fallback renderers in work.html).
  window.openKoreWorkItemById = function(id) {
    if (!id) return;
    try {
      window.location.href = 'work-new.html?id=' + encodeURIComponent(id);
    } catch (e) {
      // navigation failed; ignore
    }
  };

})();
