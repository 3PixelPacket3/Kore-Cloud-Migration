// Info Hub Archive management page
// --------------------------------
(function () {
  const STORAGE_KEY = "infoPages";

  function loadPages() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      console.error("InfoArchive: unable to load Info Hub pages", e);
      return [];
    }
  }

  function savePages(pages) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pages || []));
    } catch (e) {
      console.error("InfoArchive: unable to save Info Hub pages", e);
    }
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
    const listEl = document.getElementById("infoHubArchiveList");
    const emptyEl = document.getElementById("infoHubArchiveEmpty");
    if (!listEl || !emptyEl) return;

    const pages = loadPages().filter(function (p) { return p && p.archived; });

    if (!pages.length) {
      listEl.innerHTML = "";
      emptyEl.style.display = "";
      return;
    }

    emptyEl.style.display = "none";

    const rows = pages.map(function (page) {
      const id = String(page.id || "");
      const title = escapeHtml(page.title || "Untitled Page");
      const status = escapeHtml(page.status || "draft");
      const updated = escapeHtml(page.updatedAt || page.createdAt || "");
      return (
        '<label class="settings-archive-row">' +
          '<input type="checkbox" class="infohub-archive-checkbox" value="' + id + '"/>' +
          '<span class="settings-archive-main"><strong>' + title + '</strong></span>' +
          '<span class="settings-archive-meta">' +
            (updated ? 'Updated: ' + updated + ' • ' : '') +
            'Status: ' + status +
          '</span>' +
        '</label>'
      );
    });

    listEl.innerHTML = rows.join("");
  }

  function getSelectedIds() {
    const listEl = document.getElementById("infoHubArchiveList");
    if (!listEl) return [];
    const boxes = listEl.querySelectorAll(".infohub-archive-checkbox");
    const ids = [];
    boxes.forEach(function (box) {
      if (box.checked && box.value) ids.push(String(box.value));
    });
    return ids;
  }

  function restoreSelected() {
    const ids = getSelectedIds();
    if (!ids.length) {
      alert("Select at least one archived Info Hub page to restore.");
      return;
    }
    const pages = loadPages();
    let changed = false;
    pages.forEach(function (page) {
      if (!page || !page.id) return;
      const id = String(page.id);
      if (ids.indexOf(id) !== -1 && page.archived) {
        page.archived = false;
        changed = true;
      }
    });
    if (!changed) {
      alert("Nothing to restore.");
      return;
    }
    savePages(pages);
    render();
    alert("Restored " + ids.length + " Info Hub page(s).");
  }

  function deleteSelected() {
    const ids = getSelectedIds();
    if (!ids.length) {
      alert("Select at least one archived Info Hub page to delete.");
      return;
    }
    if (!confirm("Permanently delete the selected archived Info Hub pages? This cannot be undone.")) {
      return;
    }
    const pages = loadPages().filter(function (page) {
      if (!page || !page.id) return false;
      const id = String(page.id);
      if (ids.indexOf(id) === -1) return true;
      // Only delete archived pages in this flow
      return !page.archived;
    });
    savePages(pages);
    render();
    alert("Deleted " + ids.length + " archived Info Hub page(s).");
  }

  function init() {
    const refreshBtn = document.getElementById("refreshInfoHubArchiveBtn");
    const restoreBtn = document.getElementById("restoreInfoHubArchiveBtn");
    const deleteBtn = document.getElementById("deleteInfoHubArchiveBtn");

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
