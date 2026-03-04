// Work Tracker Archive management page
// -----------------------------------
(function () {
  const STORAGE_KEY = "work";

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
      console.error("WorkArchive: unable to load work items", e);
      return [];
    }
  }

  function saveItems(items) {
    const ok = (window.KoreStore && window.KoreStore.writeArray)
      ? window.KoreStore.writeArray(STORAGE_KEY, items || [])
      : (function () {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items || []));
            return true;
          } catch (e) {
            console.error("WorkArchive: unable to save work items", e);
            return false;
          }
        })();

    if (!ok) {
      alert(
        "Kore could not save Work Archive changes because browser storage is full.\n\n" +
          "Tip: Export a Kore Backup in Settings, then clear some stored data (Docs uploads can be large)."
      );
    }
    return ok;
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function render() {
    const listEl = document.getElementById("workArchiveList");
    const emptyEl = document.getElementById("workArchiveEmpty");
    if (!listEl || !emptyEl) return;

    const items = loadItems().filter(function (i) { return i && i.archived; });

    if (!items.length) {
      listEl.innerHTML = "";
      emptyEl.style.display = "";
      return;
    }

    emptyEl.style.display = "none";

    const rows = items.map(function (item) {
      const id = String(item.id || "");
      const title = escapeHtml(item.title || "Untitled request");
      const account = escapeHtml(item.account || "");
      const status = escapeHtml(item.status || "New");
      const created = escapeHtml(item.createdAt || "");
      return (
        '<label class="settings-archive-row">' +
          '<input type="checkbox" class="work-archive-checkbox" value="' + id + '"/>' +
          '<span class="settings-archive-main"><strong>' + title + '</strong>' +
          (account ? ' &mdash; ' + account : '') +
          '</span>' +
          '<span class="settings-archive-meta">' +
            (created ? 'Created ' + created + ' • ' : '') +
            'Status: ' + status +
          '</span>' +
        '</label>'
      );
    });

    listEl.innerHTML = rows.join("");
  }

  function getSelectedIds() {
    const listEl = document.getElementById("workArchiveList");
    if (!listEl) return [];
    const boxes = listEl.querySelectorAll(".work-archive-checkbox");
    const ids = [];
    boxes.forEach(function (box) {
      if (box.checked && box.value) ids.push(String(box.value));
    });
    return ids;
  }

  function restoreSelected() {
    const ids = getSelectedIds();
    if (!ids.length) {
      alert("Select at least one archived work request to restore.");
      return;
    }
    const items = loadItems();
    let changed = false;
    items.forEach(function (item) {
      if (!item || !item.id) return;
      const id = String(item.id);
      if (ids.indexOf(id) !== -1 && item.archived) {
        item.archived = false;
        changed = true;
      }
    });
    if (!changed) {
      alert("Nothing to restore.");
      return;
    }
    saveItems(items);
    render();
    alert("Restored " + ids.length + " work request(s).");
  }

  function deleteSelected() {
    const ids = getSelectedIds();
    if (!ids.length) {
      alert("Select at least one archived work request to delete.");
      return;
    }
    if (!confirm("Permanently delete the selected archived Work requests? This cannot be undone.")) {
      return;
    }
    const items = loadItems().filter(function (item) {
      if (!item || !item.id) return false;
      const id = String(item.id);
      if (ids.indexOf(id) === -1) return true;
      // Only delete archived items in this flow
      return !item.archived;
    });
    saveItems(items);
    render();
    alert("Deleted " + ids.length + " archived work request(s).");
  }

  function init() {
    const refreshBtn = document.getElementById("refreshWorkArchiveBtn");
    const restoreBtn = document.getElementById("restoreWorkArchiveBtn");
    const deleteBtn = document.getElementById("deleteWorkArchiveBtn");

    render();

    if (refreshBtn) refreshBtn.addEventListener("click", render);
    if (restoreBtn) restoreBtn.addEventListener("click", restoreSelected);
    if (deleteBtn) deleteBtn.addEventListener("click", deleteSelected);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
