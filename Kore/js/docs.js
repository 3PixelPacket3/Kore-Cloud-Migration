// Documents Library
// -----------------
// Multi-type document hub with sorting, filtering, and support for
// local file uploads + external links. Data lives in localStorage.docs.

(function () {
  const STORAGE_KEY = "docs";

  const fileInput = document.getElementById("docsFileInput");
  const addLinkBtn = document.getElementById("addLinkDocBtn");
  const tableBody = document.getElementById("docsTableBody");
  const emptyState = document.getElementById("docsEmptyState");
  const searchInput = document.getElementById("docsSearch");
  const typeFilter = document.getElementById("docsTypeFilter");
  const categoryFilter = document.getElementById("docsCategoryFilter");
  const sortSelect = document.getElementById("docsSort");

  if (!tableBody) return; // defensive if script not on Docs page

  const state = {
    docs: [],
    filters: {
      search: "",
      type: "all",
      category: "all",
      sort: "title",
    },
  };

  function esc(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function makeId() {
    return (
      "doc-" +
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 8)
    );
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function inferFileType(name) {
    const parts = String(name || "").toLowerCase().split(".");
    const ext = parts.length > 1 ? parts.pop() : "";
    switch (ext) {
      case "pdf":
        return "PDF";
      case "doc":
      case "docx":
        return "Word";
      case "xls":
      case "xlsx":
        return "Excel";
      case "csv":
        return "CSV";
      case "txt":
        return "Text";
      case "md":
        return "Markdown";
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
        return "Image";
      default:
        return ext ? ext.toUpperCase() : "Other";
    }
  }

  function normalizeDoc(raw) {
    if (!raw || typeof raw !== "object") {
      return {
        id: makeId(),
        title: "Untitled",
        fileName: "",
        href: "",
        fileType: "Other",
        category: "Uncategorized",
        description: "",
        tags: [],
        createdAt: todayISO(),
        updatedAt: todayISO(),
        source: "upload",
      };
    }

    // Backwards compatibility: older versions used { name, content } or { name, data }
    const legacyName = raw.name || "";
    const legacyData = raw.content || raw.data || "";

    let title = raw.title || legacyName || "Untitled";
    let fileName = raw.fileName || legacyName || "";
    let href = raw.href || legacyData || "";
    let fileType = raw.fileType || inferFileType(fileName || title);
    let category = raw.category || "Uncategorized";
    let description = raw.description || "";
    let createdAt = raw.createdAt || todayISO();
    let updatedAt = raw.updatedAt || createdAt;
    let source = raw.source || (href && /^https?:/i.test(href) ? "link" : "upload");

    return {
      id: raw.id || makeId(),
      title,
      fileName,
      href,
      fileType,
      category,
      description,
      createdAt,
      updatedAt,
      source,
    };
  }

  function loadDocs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) return [];
      return arr.map(normalizeDoc);
    } catch (e) {
      return [];
    }
  }

  let docsStorageWarned = false;

  function saveDocs() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.docs));
    } catch (e) {
      console.warn("Unable to save documents to this browser. It may exceed offline storage limits.", e);
      if (!docsStorageWarned) {
        docsStorageWarned = true;
        alert(
          "Kore could not save the updated Docs Library because the browser's offline storage limit was reached.\n\n" +
          "Your newest changes may not persist after you leave this page.\n\n" +
          "To fix this, try deleting very large uploaded files, clearing older backups, or using smaller documents."
        );
      }
    }
  }


  function applyFilters() {
    const { search, type, category, sort } = state.filters;
    const searchNorm = search.toLowerCase();

    let items = state.docs.slice();

    if (searchNorm) {
      items = items.filter((d) => {
        const tagsBlob = Array.isArray(d.tags) ? d.tags.join(" ") : "";
        const blob = `${d.title} ${d.description} ${d.category} ${tagsBlob}`.toLowerCase();
        return blob.includes(searchNorm);
      });
    }

    if (type !== "all") {
      items = items.filter((d) => d.fileType === type);
    }

    if (category !== "all") {
      items = items.filter((d) => d.category === category);
    }

    items.sort((a, b) => {
      switch (sort) {
        case "date_desc": {
          return (b.createdAt || "").localeCompare(a.createdAt || "");
        }
        case "date_asc": {
          return (a.createdAt || "").localeCompare(b.createdAt || "");
        }
        case "category": {
          return (a.category || "").localeCompare(b.category || "") || a.title.localeCompare(b.title);
        }
        case "type": {
          return (a.fileType || "").localeCompare(b.fileType || "") || a.title.localeCompare(b.title);
        }
        case "title":
        default:
          return a.title.localeCompare(b.title);
      }
    });

    return items;
  }

  function buildFilterOptions() {
    const types = new Set();
    const categories = new Set();

    state.docs.forEach((d) => {
      if (d.fileType) types.add(d.fileType);
      if (d.category) categories.add(d.category);
    });

    function populateSelect(select, values, allLabel) {
      if (!select) return;
      const current = select.value || "all";
      select.innerHTML = "";
      const allOpt = document.createElement("option");
      allOpt.value = "all";
      allOpt.textContent = allLabel;
      select.appendChild(allOpt);
      Array.from(values)
        .sort((a, b) => a.localeCompare(b))
        .forEach((v) => {
          const opt = document.createElement("option");
          opt.value = v;
          opt.textContent = v;
          select.appendChild(opt);
        });
      // Try to restore previous selection
      if (
        current !== "all" &&
        Array.from(select.options).some((o) => o.value === current)
      ) {
        select.value = current;
      }
    }

    populateSelect(typeFilter, types, "All types");
    populateSelect(categoryFilter, categories, "All categories");
  }

  function render() {
    const items = applyFilters();
    tableBody.innerHTML = "";

    if (!items.length) {
      if (emptyState) emptyState.style.display = "block";
      return;
    }

    if (emptyState) emptyState.style.display = "none";

    items.forEach((doc) => {
      const tr = document.createElement("tr");

      const dateLabel = doc.createdAt || "";

      tr.innerHTML = `
        <td class="docs-title">
          <div class="docs-title-main">${esc(doc.title)}</div>
          ${
            doc.fileName
              ? `<div class="docs-title-sub">${esc(doc.fileName)}</div>`
              : ""
          }
        </td>
        <td>
          <span class="badge badge-type">${esc(doc.fileType)}</span>
        </td>
        <td>${esc(doc.category || "")}</td>
        <td class="docs-tags">${esc(Array.isArray(doc.tags) && doc.tags.length ? doc.tags.join(", ") : "")}</td>
        <td>${esc(dateLabel)}</td>
        <td class="docs-desc">${esc(doc.description || "")}</td
        <td class="docs-actions-cell">
          <button type="button" class="secondary-btn docs-view-btn" data-id="${esc(doc.id)}">
            ${doc.source === "upload" ? "Download" : "Open"}
          </button>
          <button type="button" class="secondary-btn docs-edit-btn" data-id="${esc(doc.id)}">Edit</button>
          <button type="button" class="danger-btn docs-delete-btn" data-id="${esc(doc.id)}">Delete</button>
        </td>
      `;

      tableBody.appendChild(tr);
    });
  }

  function addFiles(files) {
    if (!files || !files.length) return;

    const list = Array.from(files);
    let remaining = list.length;

    list.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const now = todayISO();
        state.docs.push(
          normalizeDoc({
            title: file.name,
            fileName: file.name,
            href: reader.result,
            fileType: inferFileType(file.name),
            category: "Uncategorized",
            description: "",
            createdAt: now,
            updatedAt: now,
            source: "upload",
          })
        );
        remaining -= 1;
        if (remaining === 0) {
          saveDocs();
          buildFilterOptions();
          render();
        }
      };
      reader.readAsDataURL(file);
    });
  }

  function addLinkDoc() {
    const title = prompt("Document title:", "");
    if (title === null) return;

    let url = prompt("Document URL (https://...):", "");
    if (url === null) return;
    url = url.trim();
    if (url && !/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    const category = prompt("Category (e.g., SOP, Guide, Note):", "") || "Uncategorized";
    const description = prompt("Short description (optional):", "") || "";

    const now = todayISO();
    state.docs.push(
      normalizeDoc({
        title: title.trim() || url || "Untitled Link",
        fileName: "",
        href: url,
        fileType: "Link",
        category: category.trim() || "Uncategorized",
        description: description.trim(),
        createdAt: now,
        updatedAt: now,
        source: "link",
      })
    );

    saveDocs();
    buildFilterOptions();
    render();
  }

  function findDoc(id) {
    return state.docs.find((d) => d.id === id) || null;
  }

  function deleteDoc(id) {
    const doc = findDoc(id);
    if (!doc) return;
    if (!confirm(`Delete document "${doc.title}"?`)) return;
    state.docs = state.docs.filter((d) => d.id !== id);
    saveDocs();
    buildFilterOptions();
    render();
  }

  function viewDoc(id) {
    const doc = findDoc(id);
    if (!doc || !doc.href) return;

    // For uploads, trigger a download instead of opening an inline viewer
    if (doc.source === "upload" && /^data:/i.test(doc.href)) {
      try {
        const a = document.createElement("a");
        a.href = doc.href;
        a.download = doc.fileName || doc.title || "download";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (e) {
        alert("Unable to download this file in your browser.");
      }
      return;
    }

    // For external links, open in a new tab
    if (doc.source === "link" && /^https?:/i.test(doc.href)) {
      window.open(doc.href, "_blank", "noopener");
      return;
    }

    const win = window.open("", "_blank");
    if (!win) return;

    const safeTitle = esc(doc.title || doc.fileName || "Document");
    const safeSrc = esc(doc.href);

    win.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${safeTitle}</title>
        <style>
          html, body { margin:0; padding:0; height:100%; }
          body { background:#020617; color:#e5e7eb; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
          header { padding:0.5rem 0.75rem; font-size:0.9rem; background:#0b1120; border-bottom:1px solid #1f2937; }
          iframe { border:0; width:100%; height:calc(100% - 34px); }
        </style>
      </head>
      <body>
        <header>${safeTitle}</header>
        <iframe src="${safeSrc}"></iframe>
      </body>
      </html>
    `);
    win.document.close();
  }

  function editDoc(id) {
    const doc = findDoc(id);
    if (!doc) return;

    const title = prompt("Document title:", doc.title || "");
    if (title === null) return;

    let category = prompt("Category (e.g., SOP, Guide, Note):", doc.category || "");
    if (category === null) return;

    const description = prompt("Short description (optional):", doc.description || "");
    if (description === null) return;

    const tagsRaw = prompt("Tags (comma separated, optional):", Array.isArray(doc.tags) ? doc.tags.join(", ") : "");
    if (tagsRaw === null) return;

    doc.title = title.trim() || doc.title;
    doc.category = (category || "").trim() || doc.category;
    doc.description = (description || "").trim();
    doc.tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
    doc.updatedAt = todayISO();

    // If a link doc, allow URL update
    if (doc.source === "link") {
      let url = prompt("Document URL (https://...):", doc.href || "");
      if (url !== null) {
        url = url.trim();
        if (url && !/^https?:\/\//i.test(url)) {
          url = "https://" + url;
        }
        doc.href = url || doc.href;
      }
    }

    saveDocs();
    buildFilterOptions();
    render();
  }

  // Event wiring
  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLInputElement) || !target.files) return;
      addFiles(target.files);
      target.value = ""; // reset
    });
  }

  if (addLinkBtn) {
    addLinkBtn.addEventListener("click", addLinkDoc);
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      state.filters.search = searchInput.value || "";
      render();
    });
  }

  if (typeFilter) {
    typeFilter.addEventListener("change", () => {
      state.filters.type = typeFilter.value || "all";
      render();
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener("change", () => {
      state.filters.category = categoryFilter.value || "all";
      render();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      state.filters.sort = sortSelect.value || "title";
      render();
    });
  }

  tableBody.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    const viewBtn = target.closest(".docs-view-btn");
    const editBtn = target.closest(".docs-edit-btn");
    const deleteBtn = target.closest(".docs-delete-btn");

    if (viewBtn && viewBtn instanceof HTMLButtonElement) {
      const id = viewBtn.getAttribute("data-id");
      if (id) viewDoc(id);
      return;
    }

    if (editBtn && editBtn instanceof HTMLButtonElement) {
      const id = editBtn.getAttribute("data-id");
      if (id) editDoc(id);
      return;
    }

    if (deleteBtn && deleteBtn instanceof HTMLButtonElement) {
      const id = deleteBtn.getAttribute("data-id");
      if (id) deleteDoc(id);
      return;
    }
  });

  // Initialize
  state.docs = loadDocs();
  buildFilterOptions();
  render();
})();
