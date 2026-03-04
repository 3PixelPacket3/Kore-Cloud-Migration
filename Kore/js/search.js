
// Kore Global Search
// -------------------
// Searches across Work Tracker, Info Hub pages, and Docs using localStorage.
// Results are grouped by type and link back into the appropriate pages.

(function () {
  function safeJson(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function parseTags(input) {
    if (!input) return [];
    if (Array.isArray(input)) return input.map(String).map((t) => t.trim()).filter(Boolean);
    const raw = String(input || "");
    if (!raw.trim()) return [];
    const parts = raw
      .replace(/[#;]/g, " ")
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter(Boolean);
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

  function norm(str) {
    return String(str || "").toLowerCase();
  }

  function loadWork() {
    const arr = safeJson("work");
    return arr.map(function (raw) {
      return {
        id: raw.id || "",
        title: raw.title || raw.name || "Untitled request",
        type: raw.type || "",
        account: raw.account || "",
        priority: raw.priority || "",
        status: raw.status || "",
        requestor: raw.requestor || "",
        notes: raw.notes || "",
        tags: parseTags(raw.tags),
        createdAt: raw.createdAt || "",
        dueDate: raw.dueDate || "",
        archived: !!raw.archived,
      };
    });
  }

  function loadInfoPages() {
    const arr = safeJson("infoPages");
    return arr.map(function (p) {
      return {
        id: p.id || "",
        title: p.title || "Untitled page",
        shortDesc: p.shortDesc || "",
        tags: parseTags(p.tags),
        status: p.status || "Published",
        archived: !!p.archived,
        // Strip HTML tags for search snippet
        contentText: String(p.contentHtml || "")
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " "),
        updatedAt: p.updatedAt || "",
      };
    });
  }

  function loadDocs() {
    const arr = safeJson("docs");
    return arr.map(function (d) {
      return {
        id: d.id || "",
        title: d.title || d.fileName || "Untitled",
        fileName: d.fileName || "",
        fileType: d.fileType || "",
        category: d.category || "Uncategorized",
        description: d.description || "",
        tags: Array.isArray(d.tags) ? d.tags : [],
        createdAt: d.createdAt || "",
        updatedAt: d.updatedAt || "",
        source: d.source || "",
      };
    });
  }

  function snippet(text, len) {
    if (!text) return "";
    const s = String(text);
    if (s.length <= (len || 140)) return s;
    return s.slice(0, len || 140) + "…";
  }

  function renderResults(resultsRoot, groups) {
    if (!resultsRoot) return;
    resultsRoot.innerHTML = "";

    const total = groups.work.length + groups.info.length + groups.docs.length;
    if (!total) {
      const p = document.createElement("p");
      p.className = "global-search-empty";
      p.textContent = "No results yet. Try broadening your query or removing tag filters.";
      resultsRoot.appendChild(p);
      return;
    }

    function renderGroup(label, items, type) {
      if (!items.length) return;

      const section = document.createElement("section");
      section.className = "global-search-group";

      const h2 = document.createElement("h2");
      h2.textContent = label + " (" + items.length + ")";
      section.appendChild(h2);

      const ul = document.createElement("ul");
      ul.className = "global-search-list";

      items.forEach(function (item) {
        const li = document.createElement("li");
        li.className = "global-search-item";

        if (type === "work") {
          const a = document.createElement("a");
          a.href = "work.html?id=" + encodeURIComponent(item.id);
          a.textContent = item.title;
          a.className = "global-search-title";

          const meta = document.createElement("div");
          meta.className = "global-search-meta";
          meta.textContent = [item.type, item.account, item.status, item.priority]
            .filter(Boolean)
            .join(" • ");

          const sn = document.createElement("div");
          sn.className = "global-search-snippet";
          sn.textContent = snippet(item.notes, 160);

          li.appendChild(a);
          li.appendChild(meta);
          if (item.tags && item.tags.length) {
            const tagsEl = document.createElement("div");
            tagsEl.className = "global-search-tags";
            tagsEl.textContent = "#" + item.tags.join(" #");
            li.appendChild(tagsEl);
          }
          li.appendChild(sn);
        } else if (type === "info") {
          const a = document.createElement("a");
          a.href = "info-page.html?id=" + encodeURIComponent(item.id);
          a.textContent = item.title;
          a.className = "global-search-title";

          const meta = document.createElement("div");
          meta.className = "global-search-meta";
          meta.textContent = [item.status === "Draft" ? "Draft" : "Published", item.updatedAt]
            .filter(Boolean)
            .join(" • ");

          const sn = document.createElement("div");
          sn.className = "global-search-snippet";
          sn.textContent = snippet(item.shortDesc || item.contentText, 160);

          li.appendChild(a);
          li.appendChild(meta);
          if (item.tags && item.tags.length) {
            const tagsEl = document.createElement("div");
            tagsEl.className = "global-search-tags";
            tagsEl.textContent = "#" + item.tags.join(" #");
            li.appendChild(tagsEl);
          }
          li.appendChild(sn);
        } else if (type === "docs") {
          const a = document.createElement("span");
          a.textContent = item.title;
          a.className = "global-search-title";

          const meta = document.createElement("div");
          meta.className = "global-search-meta";
          meta.textContent = [item.fileType, item.category, item.createdAt]
            .filter(Boolean)
            .join(" • ");

          const sn = document.createElement("div");
          sn.className = "global-search-snippet";
          sn.textContent = snippet(item.description, 160);

          li.appendChild(a);
          li.appendChild(meta);
          if (item.tags && item.tags.length) {
            const tagsEl = document.createElement("div");
            tagsEl.className = "global-search-tags";
            tagsEl.textContent = "#" + item.tags.join(" #");
            li.appendChild(tagsEl);
          }
          li.appendChild(sn);
        }

        ul.appendChild(li);
      });

      section.appendChild(ul);
      resultsRoot.appendChild(section);
    }

    renderGroup("Work", groups.work, "work");
    renderGroup("Info Pages", groups.info, "info");
    renderGroup("Documents", groups.docs, "docs");
  }

  function runSearch() {
    var input = document.getElementById("globalSearchInput");
    var tagInput = document.getElementById("globalSearchTag");
    var resultsRoot = document.getElementById("globalSearchResults");
    if (!input || !resultsRoot) {
      return;
    }

    var q = norm(input.value);
    var tagNorm = norm((tagInput && tagInput.value) || "").replace(/^#/, "").trim();

    var include = {
      work: true,
      info: true,
      docs: true,
    };

    var typeChecks = document.querySelectorAll('input[name="globalType"]');
    if (typeChecks && typeChecks.length) {
      include.work = include.info = include.docs = false;
      typeChecks.forEach(function (cb) {
        if (!(cb instanceof HTMLInputElement)) return;
        if (!cb.checked) return;
        if (cb.value === "work") include.work = true;
        if (cb.value === "info") include.info = true;
        if (cb.value === "docs") include.docs = true;
      });
    }

    var workItems = include.work ? loadWork() : [];
    var infoPages = include.info ? loadInfoPages() : [];
    var docs = include.docs ? loadDocs() : [];

    function matchesTag(tagsArr) {
      if (!tagNorm) return true;
      if (!Array.isArray(tagsArr)) return false;
      return tagsArr.some(function (t) {
        return norm(t).replace(/^#/, "") === tagNorm;
      });
    }

    function matchesQuery(blob) {
      if (!q) return true;
      return blob.includes(q);
    }

    var workResults = workItems.filter(function (w) {
      if (w.archived) return false;
      var blob = norm(
        [w.title, w.notes, w.type, w.account, w.status, w.priority, (w.tags || []).join(" ")].join(" ")
      );
      return matchesQuery(blob) && matchesTag(w.tags || []);
    });

    var infoResults = infoPages.filter(function (p) {
      if (p.archived) return false;
      var blob = norm(
        [p.title, p.shortDesc, p.contentText, (p.tags || []).join(" ")].join(" ")
      );
      return matchesQuery(blob) && matchesTag(p.tags || []);
    });

    var docResults = docs.filter(function (d) {
      var blob = norm(
        [d.title, d.fileName, d.description, d.category, (d.tags || []).join(" ")].join(" ")
      );
      return matchesQuery(blob) && matchesTag(d.tags || []);
    });

    // lightweight sorting: most recent first when dates are present
    workResults.sort(function (a, b) {
      return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    });
    infoResults.sort(function (a, b) {
      return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
    });
    docResults.sort(function (a, b) {
      return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    });

    renderResults(resultsRoot, {
      work: workResults,
      info: infoResults,
      docs: docResults,
    });
  }

  function initGlobalSearch() {
    var input = document.getElementById("globalSearchInput");
    var btn = document.getElementById("globalSearchBtn");
    if (!input) return;

    if (btn) {
      btn.addEventListener("click", runSearch);
    }

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        runSearch();
      }
    });

    var tagInput = document.getElementById("globalSearchTag");
    if (tagInput) {
      tagInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          runSearch();
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGlobalSearch);
  } else {
    initGlobalSearch();
  }
})();
