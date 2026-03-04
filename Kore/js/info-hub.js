// ------------------------
// Kore Info Hub: Page Model & Storage
// ------------------------

(function () {
  const STORAGE_KEY = 'infoPages';


  function ensureDefaultGettingStartedPage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length) return;
      }
    } catch (e) {
      // ignore parse errors; fall through to try seeding
    }

    const nowIso = new Date().toISOString();

    const pages = [
      {
        id: "kore-getting-started",
        title: "Kore – Getting Started",
        shortDesc: "Overview of Kore and where everything lives.",
        tags: ["kore", "getting started", "overview", "navigation"],
        status: "Published",
        createdAt: nowIso,
        updatedAt: nowIso,
        archived: false,
        contentHtml: `
          <p><strong>Welcome to Kore.</strong> Kore is a local-first work and knowledge system. You open <code>index.html</code> from the Kore folder and everything runs offline inside your browser. Data is stored in <strong>localStorage</strong>, not on a server.</p>

          <p><img src="images/How To Guide Image.png" alt="Kore Training" style="max-width:100%;border-radius:14px;border:1px solid #1f2937;" /></p>

          <h2>What Kore includes</h2>
          <ul>
            <li><strong>Home</strong> – clock, date, hero image, homepage message, and shortcut buttons.</li>
            <li><strong>Work Tracker</strong> – queue of requests with filters, details, and CSV export.</li>
            <li><strong>Docs Library</strong> – reference links and documents.</li>
            <li><strong>Info Hub</strong> – internal how-to pages and guides.</li>
            <li><strong>Apps &amp; Tools</strong> – customizable tiles for external systems.</li>
            <li><strong>Data &amp; Reports</strong> – workload analytics from Work Tracker.</li>
            <li><strong>Settings</strong> – profiles, time zone, theme, backup/restore.</li>
            <li><strong>Ask Kore</strong> – offline assistant that searches built-in help and your content.</li>
          </ul>

          <h2>How data is stored</h2>
          <p>Kore’s code, HTML, and images live in this folder. Your <em>data</em> (Work items, Docs, Info Hub pages, Apps, Profiles, Settings) live in your browser’s <strong>localStorage</strong>. Use backups to move or protect your data.</p>

          <h2>First run checklist</h2>
          <ol>
            <li>Open <strong>Settings</strong>.</li>
            <li>Set your <strong>Profile name</strong> and avatar.</li>
            <li>Choose your <strong>Time Zone</strong> (controls the Home clock).</li>
            <li>Review <strong>Restore Mode</strong> (Merge vs Replace).</li>
            <li>Create your first <strong>Backup</strong>.</li>
          </ol>

          <p>After that, start using Work Tracker, Docs Library, and Info Hub, and pin your most-used tools on the Home page.</p>
        `
      },
      {
        id: "kore-training-work-tracker",
        title: "Training – Work Tracker Deep Dive",
        shortDesc: "How to use Work Tracker as your daily queue, including filters and reports.",
        tags: ["kore", "training", "work tracker", "queue"],
        status: "Published",
        createdAt: nowIso,
        updatedAt: nowIso,
        archived: false,
        contentHtml: `
          <p>The <strong>Work Tracker</strong> is your primary queue in Kore. Every request, task, or ticket should live here so you can filter, update, and report on it.</p>

          <h2>1) Opening Work Tracker</h2>
          <p>From Home, click <strong>Work Tracker</strong>. You will see a grid or list of cards. Each card represents a single work item.</p>

          <h2>2) Adding a new request</h2>
          <ol>
            <li>Click <strong>Add Request</strong>. This opens a <strong>full-page form</strong> (no modal).</li>
            <li>Fill out Title, Request Type, Account, Priority, Status, Requestor, Created, Due Date, and Notes.</li>
            <li>Save the request. Kore returns you to the Work Tracker queue with the new item visible.</li>
          </ol>

          <h2>3) Editing an existing request</h2>
          <ol>
            <li>From the queue, click a card to open its details.</li>
            <li>Adjust fields such as Status, Priority, Due Date, or Notes.</li>
            <li>Save your changes.</li>
          </ol>

          <h2>4) Filters and sorting</h2>
          <ul>
            <li>Use Status, Priority, Type, and Account filters to focus your view.</li>
            <li>Use the Sort control (Created, Due, Priority, Status) to change ordering.</li>
          </ul>

          <h2>5) Reports and export</h2>
          <p>Open <strong>Data &amp; Reports</strong> to see summary metrics based on your Work Tracker data. Use CSV export when you want to analyze items externally (for example, in Excel).</p>

          <p><strong>Tip:</strong> If a saved item does not appear immediately, refresh Work Tracker. If it still does not appear, confirm that localStorage is allowed and that you did not restore an older backup on top of newer data.</p>
        `
      },
      {
        id: "kore-training-docs-infohub",
        title: "Training – Docs Library & Info Hub",
        shortDesc: "How to capture references and build internal guides.",
        tags: ["kore", "training", "docs", "info hub", "knowledge"],
        status: "Published",
        createdAt: nowIso,
        updatedAt: nowIso,
        archived: false,
        contentHtml: `
          <h2>Docs Library</h2>
          <p>The <strong>Docs Library</strong> is where you track reference materials: URLs, file paths, and descriptions.</p>
          <ul>
            <li>Add entries for SOPs, vendor portals, internal dashboards, or shared drives.</li>
            <li>Give each doc a clear title and description so Ask Kore can find it.</li>
          </ul>

          <h2>Info Hub</h2>
          <p><strong>Info Hub</strong> is your internal wiki. Use it for step-by-step guides and procedures:</p>
          <ul>
            <li>Open <strong>Create a Page</strong> to build a new guide.</li>
            <li>Add headings, bullet points, and screenshots.</li>
            <li>Tag pages by topic (for example, “Workflows”, “Onboarding”, “Client X”).</li>
            <li>Publish the page so it appears in the Info Hub index and navigation.</li>
          </ul>

          <p>Ask Kore indexes titles, descriptions, and content from Info Hub pages, so well-written guides make the assistant more helpful.</p>
        `
      },
      {
        id: "kore-training-ask-kore",
        title: "Training – Ask Kore & Troubleshooting",
        shortDesc: "How the offline assistant works, and how to talk to it.",
        tags: ["kore", "training", "ask kore", "assistant", "troubleshooting"],
        status: "Published",
        createdAt: nowIso,
        updatedAt: nowIso,
        archived: false,
        contentHtml: `
          <p><strong>Ask Kore</strong> is an offline assistant. It does not browse the internet or call external APIs. It only uses:</p>
          <ul>
            <li>Built-in help (README, About, training pages).</li>
            <li>Your Info Hub pages.</li>
            <li>Labels and metadata from Work, Docs, and Apps.</li>
          </ul>

          <h2>How to ask good questions</h2>
          <ul>
            <li>Include the page or tool name (Work Tracker, Docs Library, Info Hub, Settings).</li>
            <li>Describe what you clicked and what you expected.</li>
            <li>Paste exact error messages when something fails.</li>
          </ul>

          <h2>If Ask Kore cannot answer</h2>
          <p>You will see a limitations message that explains what Ask Kore can and cannot do, and how to rephrase your question. Use that as a guide to refine your prompt.</p>
        `
      },
      {
        id: "kore-training-backup-restore",
        title: "Training – Backup & Restore Scenarios",
        shortDesc: "How to protect your data and move Kore safely.",
        tags: ["kore", "training", "backup", "restore", "safety"],
        status: "Published",
        createdAt: nowIso,
        updatedAt: nowIso,
        archived: false,
        contentHtml: `
          <p>Backups are critical because your data lives in localStorage.</p>

          <h2>Creating a backup</h2>
          <ol>
            <li>Go to <strong>Settings &gt; Backup &amp; Restore</strong> or use the Backup button in the header.</li>
            <li>Click <strong>Save Backup</strong>.</li>
            <li>Store the downloaded JSON file somewhere safe.</li>
          </ol>

          <h2>Restoring a backup</h2>
          <ol>
            <li>Open <strong>Settings &gt; Backup &amp; Restore</strong>.</li>
            <li>Choose <strong>Merge</strong> (recommended) or <strong>Replace</strong>.</li>
            <li>Select your backup JSON file.</li>
            <li>Allow Kore to reload. If needed, refresh index.html again.</li>
          </ol>

          <h2>When to use Merge vs Replace</h2>
          <ul>
            <li><strong>Merge</strong> – keep what you have and add/merge in items from the backup.</li>
            <li><strong>Replace</strong> – discard current local data and use only the backup.</li>
          </ul>

          <p><strong>Tip:</strong> Take a fresh backup before major changes (like clearing old work items or restructuring Info Hub).</p>
        `
      }
    ];

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
    } catch (e) {
      // If localStorage fails, do nothing
    }
  }

  function getCurrentProfileId() {
    try {
      const current = localStorage.getItem("koreCurrentProfileId");
      if (current) return current;
      const rawProfiles = localStorage.getItem("koreProfiles");
      if (!rawProfiles) return null;
      const profiles = JSON.parse(rawProfiles);
      if (Array.isArray(profiles) && profiles.length) return profiles[0].id || null;
    } catch (e) {
      console.warn("InfoHub: unable to resolve current profile", e);
    }
    return null;
  }

  function isOwnerProfile() {
    try {
      const rawProfiles = localStorage.getItem("koreProfiles");
      const currentId = localStorage.getItem("koreCurrentProfileId");
      if (!rawProfiles || !currentId) return false;
      const profiles = JSON.parse(rawProfiles);
      if (!Array.isArray(profiles)) return false;
      const p = profiles.find(p => p.id === currentId);
      return !!(p && p.role === "owner");
    } catch (e) {
      return false;
    }
  }

  function loadPages() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      console.error('Error loading info pages from localStorage:', e);
      return [];
    }
  }

  function savePages(pages) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
    } catch (e) {
      console.error('Error saving info pages to localStorage:', e);
    }
  }

  function generateId() {
    return 'page_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
  }

  function findPageById(id) {
    const pages = loadPages();
    const active = pages.find(p => p.id === id && !p.archived);
    if (active) return active;
    return pages.find(p => p.id === id) || null;
  }

  function upsertPage(page) {
    const pages = loadPages();
    const idx = pages.findIndex(p => p.id === page.id);
    if (idx === -1) pages.push(page); else pages[idx] = page;
    savePages(pages);
  }

  function archivePage(id) {
    const pages = loadPages();
    const idx = pages.findIndex(p => p.id === id);
    if (idx !== -1) {
      pages[idx].archived = true;
      pages[idx].status = pages[idx].status || 'draft';
      savePages(pages);
    }
  }

  function deletePage(id) {
    const pages = loadPages().filter(p => p.id !== id);
    savePages(pages);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function stripTags(html) {
    return String(html || '')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function formatDate(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch (e) {
      return iso;
    }
  }

  // ------------------------
  // Populate Info Hub dropdown in nav
  // ------------------------

  function populateInfoHubDropdown() {
    // Updated behavior:
    // Pages no longer appear in the nav dropdown.
    // The dropdown contains only static links (Create a Page + Info Hub Index).
    // We keep this function as a no-op for backwards compatibility.
    return;
  }

  // ------------------------
  // Info Hub Landing Page (optional)
  // ------------------------

  function initInfoHubLanding() {
    const listEl = document.getElementById('infoPageList');
    const searchEl = document.getElementById('infoSearch');
    const statusEl = document.getElementById('infoStatusFilter');
    const sortEl = document.getElementById('infoSort');
    const tagEl = document.getElementById('infoTagFilter');
    if (!listEl) return; // not on landing page

    function getThumb(page) {
      const first = (page.images || [])[0];
      return first && first.dataUrl ? first.dataUrl : '';
    }

    function normalizeText(s) {
      return String(s || '').toLowerCase();
    }

    function render() {
      const pagesRaw = loadPages().filter(p => !p.archived);

      // Search query
      const query = normalizeText(searchEl ? searchEl.value : '');

      // Status filter
      const statusVal = statusEl ? (statusEl.value || 'all') : 'all';

      // Tag filter (single text match)
      const tagQuery = normalizeText(tagEl ? tagEl.value : '').trim();

      let filtered = pagesRaw;

      if (statusVal !== 'all') {
        filtered = filtered.filter(p => (p.status || 'draft') === statusVal);
      }

      if (query) {
        filtered = filtered.filter(p =>
          normalizeText(stripTags(p.titleHtml || p.title)).includes(query) ||
          normalizeText(stripTags(p.summaryHtml || p.summary)).includes(query) ||
          normalizeText((p.tags || []).join(', ')).includes(query)
        );
      }

      if (tagQuery) {
        filtered = filtered.filter(p => normalizeText((p.tags || []).join(', ')).includes(tagQuery));
      }

      // Sorting
      const sortVal = sortEl ? (sortEl.value || 'updatedDesc') : 'updatedDesc';
      filtered.sort((a, b) => {
        const aTitle = stripTags(a.titleHtml || a.title).toLowerCase();
        const bTitle = stripTags(b.titleHtml || b.title).toLowerCase();
        const aUpdated = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bUpdated = new Date(b.updatedAt || b.createdAt || 0).getTime();

        if (sortVal === 'titleAsc') return aTitle.localeCompare(bTitle);
        if (sortVal === 'titleDesc') return bTitle.localeCompare(aTitle);
        if (sortVal === 'updatedAsc') return aUpdated - bUpdated;
        return bUpdated - aUpdated; // updatedDesc
      });

      listEl.innerHTML = '';

      if (filtered.length === 0) {
        const empty = document.createElement('p');
        empty.textContent = 'No pages found.';
        listEl.appendChild(empty);
        return;
      }

      filtered.forEach(page => {
        const card = document.createElement('div');
        card.className = 'infohub-list-item';
        const thumb = getThumb(page);
        const thumbHtml = thumb
          ? `<img src="${thumb}" alt="" class="infohub-thumb" />`
          : `<div class="infohub-thumb infohub-thumb--empty" aria-hidden="true"></div>`;

        const titleText = stripTags(page.titleHtml || page.title || 'Untitled Page');
        const summaryText = stripTags(page.summaryHtml || page.summary || '');

        card.innerHTML = `
          ${thumbHtml}
          <div class="infohub-list-main">
            <a href="info-page.html?id=${encodeURIComponent(page.id)}" class="infohub-list-title">${escapeHtml(titleText || 'Untitled Page')}</a>
            ${summaryText ? `<p class="infohub-list-summary">${escapeHtml(summaryText)}</p>` : ''}
            ${(page.tags && page.tags.length) ? `<div class="infohub-tags">${page.tags.map(t => `<span class="infohub-tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
          </div>
          <div class="infohub-list-meta">
            <span class="status ${page.status === 'published' ? 'status-published' : 'status-draft'}">${page.status === 'published' ? 'Published' : 'Draft'}</span>
            <span class="infohub-timestamp">Updated: ${formatDate(page.updatedAt || page.createdAt)}</span>
            <button type="button" class="danger-btn infohub-delete" data-id="${escapeHtml(page.id)}">Delete</button>
          </div>
        `;
        listEl.appendChild(card);
      });
    }

    render();

    if (searchEl) searchEl.addEventListener('input', render);
    if (statusEl) statusEl.addEventListener('change', render);
    if (sortEl) sortEl.addEventListener('change', render);
    if (tagEl) tagEl.addEventListener('input', render);

    // Delete from index
    listEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.infohub-delete');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      if (!id) return;
      if (confirm('Delete this page? This removes it from the Info Hub list (soft delete).')) {
        archivePage(id);
        render();
      }
    });
    window.koreInfoHubCoreDeleteReady = true;
  }

  // ------------------------
  // Create / Edit Page Builder
  // ------------------------

  function initPageBuilder() {
    const formEl = document.getElementById('pageBuilderForm');
    if (!formEl) return; // not on builder

    const titleEl = document.getElementById('infoTitle');
    const summaryEl = document.getElementById('infoSummary');
    const contentEl = document.getElementById('infoContent');
    const contentHtmlEl = document.getElementById('infoContentHtml');
    const htmlModeBtn = document.getElementById('htmlModeBtn');
    const toolbarEl = document.querySelector('.editor-toolbar');
    const authorEl = document.getElementById('authorInput');
    const tagsEl = document.getElementById('tagsInput');

    const createdAtEl = document.getElementById('createdAt');
    const updatedAtEl = document.getElementById('updatedAt');
    const statusDisplayEl = document.getElementById('statusDisplay');
    const autosaveEl = document.getElementById('autosaveStatus');

    const imagesContainer = document.getElementById('imagesContainer');
    const linksContainer = document.getElementById('linksContainer');

    const addImageBtn = document.getElementById('addImageBtn');
    const addLinkBtn = document.getElementById('addLinkBtn');

    const saveDraftBtn = document.getElementById('saveDraftBtn');
    const publishBtn = document.getElementById('publishBtn');
    const deleteBtn = document.getElementById('deletePageBtn');
    const previewBtn = document.getElementById('previewBtn');
    const insertTemplateBtn = document.getElementById('insertTemplateBtn');

    let currentPageId = null;
    let images = [];
    let links = [];
    let currentStatus = 'draft';
    let isHtmlMode = false;
    let isDirty = false;
    let lastAutosaveAt = 0;

    const HOWTO_TEMPLATE = `
      <h2>Overview</h2>
      <p><em>What this is, when to use it, and the outcome you want.</em></p>

      <h2>Prerequisites</h2>
      <ul>
        <li>Access/permissions:</li>
        <li>Required files/links:</li>
        <li>Tools needed:</li>
      </ul>

      <h2>Steps</h2>
      <ol>
        <li><strong>Step 1:</strong> </li>
        <li><strong>Step 2:</strong> </li>
        <li><strong>Step 3:</strong> </li>
      </ol>

      <h2>Verification</h2>
      <ul>
        <li>How to confirm it worked:</li>
        <li>Expected result:</li>
      </ul>

      <h2>Troubleshooting</h2>
      <ul>
        <li><strong>Problem:</strong> … <br><strong>Fix:</strong> …</li>
        <li><strong>Problem:</strong> … <br><strong>Fix:</strong> …</li>
      </ul>
    `;

    const GUIDE_TEMPLATE = `
  <style>
    :root{
      --bg:#0b0f19;
      --panel:#101827;
      --panel2:#0f172a;
      --text:#e5e7eb;
      --muted:#9ca3af;
      --border:rgba(255,255,255,.10);
      --accent:#60a5fa;
      --good:#34d399;
      --warn:#fbbf24;
      --danger:#fb7185;
      --shadow:0 10px 30px rgba(0,0,0,.35);
      --radius:16px;
      --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      --sans: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
    }
    *{ box-sizing:border-box; }
    html{ scroll-behavior:smooth; }
    body.guide-layout-active{
      margin:0;
      font-family:var(--sans);
      color:var(--text);
      line-height:1.55;
      background:
        radial-gradient(1200px 800px at 15% 10%, rgba(96,165,250,.18), transparent 60%),
        radial-gradient(900px 700px at 85% 25%, rgba(52,211,153,.12), transparent 60%),
        radial-gradient(700px 600px at 50% 95%, rgba(251,113,133,.10), transparent 60%),
        var(--bg);
    }
    .guide-wrap{ max-width:1180px; margin:0 auto; padding:26px 18px 40px; }

    .guide-hero{
      border:1px solid var(--border);
      background:linear-gradient(180deg, rgba(16,24,39,.85), rgba(15,23,42,.75));
      border-radius:var(--radius);
      padding:18px 18px 16px;
      box-shadow:var(--shadow);
    }
    .guide-badgeRow{
      display:flex;
      flex-wrap:wrap;
      gap:10px;
      margin-bottom:10px;
    }
    .guide-badge{
      font-family:var(--mono);
      font-size:12px;
      padding:6px 10px;
      border:1px solid var(--border);
      border-radius:999px;
      background:rgba(255,255,255,.03);
      color:var(--muted);
    }
    .guide-title{
      margin:0 0 8px;
      font-size:28px;
      line-height:1.15;
      letter-spacing:.2px;
    }
    .guide-desc{
      margin:0;
      color:var(--muted);
      max-width:95ch;
      font-size:14.5px;
    }
    .guide-meta{
      display:flex;
      flex-wrap:wrap;
      gap:10px;
      margin-top:12px;
    }
    .guide-pill{
      font-family:var(--mono);
      font-size:12px;
      padding:6px 10px;
      border-radius:999px;
      border:1px solid var(--border);
      background:rgba(255,255,255,.03);
      color:#cbd5e1;
    }
    .guide-pill.good{ border-color:rgba(52,211,153,.35); color:#bbf7d0; }
    .guide-pill.warn{ border-color:rgba(251,191,36,.35); color:#fde68a; }

    .guide-layout-grid{
      display:grid;
      grid-template-columns: 320px 1fr;
      gap:18px;
      margin-top:18px;
      align-items:start;
    }
    .guide-layout-grid > * { min-width:0; }

    .guide-toc{
      border:1px solid var(--border);
      border-radius:var(--radius);
      background:rgba(16,24,39,.65);
      box-shadow:var(--shadow);
      overflow:hidden;
      position: sticky;
      top: 18px;
      max-height: calc(100vh - 36px);
      overflow:auto;
    }
    .guide-tocHead{
      padding:14px 14px 10px;
      border-bottom:1px solid var(--border);
      background:rgba(255,255,255,.02);
    }
    .guide-tocHead strong{
      font-size:13px;
      letter-spacing:.2px;
    }
    .guide-tocBlock{ padding:10px 0; }
    .guide-tocBlock a{
      display:block;
      padding:9px 14px;
      border-bottom:1px solid rgba(255,255,255,.06);
      color:#cbd5e1;
      font-size:13.5px;
    }
    .guide-tocBlock a:hover{ background:rgba(96,165,250,.08); }
    .guide-tocSub{
      margin:0;
      padding:6px 0 10px;
      border-bottom:1px solid rgba(255,255,255,.06);
    }
    .guide-tocSub a{
      padding:7px 14px 7px 28px;
      font-size:13px;
      color:#aab6c7;
      border-bottom:none;
    }

    .guide-main{ display:flex; flex-direction:column; gap:14px; }
    .guide-card{
      border:1px solid var(--border);
      border-radius:var(--radius);
      background:rgba(16,24,39,.55);
      padding:16px;
      box-shadow:var(--shadow);
      width:100%;
    }
    .guide-card h2{
      margin:0 0 10px;
      font-size:18px;
      letter-spacing:.2px;
    }
    .guide-card h3{
      margin:14px 0 8px;
      font-size:15px;
      color:#dbeafe;
    }
    .guide-card p{ margin:8px 0 0; }
    .guide-grid2{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:12px;
      margin-top:10px;
    }

    .guide-note,.guide-warnbox,.guide-dangerbox{
      margin-top:10px;
      padding:12px;
      border-radius:12px;
      border:1px solid rgba(255,255,255,.12);
      background:rgba(255,255,255,.04);
    }
    .guide-note{ border-color:rgba(96,165,250,.25); background:rgba(96,165,250,.07); color:#dbeafe; }
    .guide-warnbox{ border-color:rgba(251,191,36,.25); background:rgba(251,191,36,.06); color:#fef3c7; }
    .guide-dangerbox{ border-color:rgba(251,113,133,.30); background:rgba(251,113,133,.06); color:#ffe4e6; }

    @media (max-width: 980px){
      .guide-layout-grid{ grid-template-columns: 1fr; }
      .guide-toc{ position: relative; top: 0; max-height:none; }
      .guide-grid2{ grid-template-columns: 1fr; }
    }
  </style>

  <div class="guide-wrap" id="top">
    <section class="guide-hero" aria-label="Guide overview">
      <div class="guide-badgeRow">
        <span class="guide-badge">INTERNAL ONLY</span>
        <span class="guide-badge">Category / System</span>
        <span class="guide-badge">Audience</span>
      </div>

      <h1 class="guide-title">Guide Title – System / Process Name</h1>

      <p class="guide-desc">
        One or two short paragraphs explaining what this guide covers, who it is for,
        and the primary outcome a reader should expect after following it.
      </p>

      <div class="guide-meta">
        <span class="guide-pill good">Single-page reference for team</span>
        <span class="guide-pill">Key constraints or concepts</span>
        <span class="guide-pill warn">Call out important caveats</span>
      </div>
    </section>

    <section class="guide-layout-grid">
      <nav class="guide-toc" aria-label="Table of contents">
        <div class="guide-tocHead"><strong>Table of Contents</strong></div>
        <div class="guide-tocBlock">
          <a href="#section-1">1. Section one</a>
          <a href="#section-2">2. Section two</a>
          <a href="#section-3">3. Section three</a>
          <a href="#section-4">4. Section four</a>
        </div>
      </nav>

      <main class="guide-main">
        <section class="guide-card" id="section-1">
          <h2>1) Section heading</h2>
          <p>Use this area to describe the context, goals, or background for this part of the process.</p>
          <div class="guide-note">
            Example note box – call out key reminders, “watch for this”, or approval steps.
          </div>
        </section>

        <section class="guide-card" id="section-2">
          <h2>2) Section heading</h2>
          <p>Break down requirements, rules, or patterns. Add lists or subheadings as needed.</p>
        </section>

        <section class="guide-card" id="section-3">
          <h2>3) Section heading</h2>
          <p>Capture any layout rules, configuration details, or options in this area.</p>
        </section>

        <section class="guide-card" id="section-4">
          <h2>4) Checklist &amp; handoff</h2>
          <p>Summarize a checklist that someone can follow to confirm this is complete.</p>
        </section>

        <div class="footer">
          Internal single-page HTML guide template.
        </div>
      </main>
    </section>
  </div>
`;


    function getContentHtml() {
      if (isHtmlMode && contentHtmlEl) return contentHtmlEl.value || '';
      return contentEl ? contentEl.innerHTML : '';
    }

    function setContentHtml(html) {
      const safe = String(html || '');
      if (contentEl) contentEl.innerHTML = safe;
      if (contentHtmlEl) contentHtmlEl.value = safe;
    }

    function enableHtmlMode(enable) {
      isHtmlMode = !!enable;
      if (!contentEl || !contentHtmlEl) return;

      if (isHtmlMode) {
        contentHtmlEl.value = contentEl.innerHTML;
        contentEl.style.display = 'none';
        contentHtmlEl.style.display = 'block';
        if (toolbarEl) toolbarEl.classList.add('editor-toolbar--disabled');
        if (htmlModeBtn) htmlModeBtn.textContent = 'Rich Text';
      } else {
        contentEl.innerHTML = contentHtmlEl.value || '';
        contentEl.style.display = 'block';
        contentHtmlEl.style.display = 'none';
        if (toolbarEl) toolbarEl.classList.remove('editor-toolbar--disabled');
        if (htmlModeBtn) htmlModeBtn.textContent = 'HTML';
      }
      markDirty();
    }

    // If editing existing page, load it
    const params = new URLSearchParams(window.location.search);
    const existingId = params.get('id');
    if (existingId) {
      const existing = findPageById(existingId);
      if (existing) {
        currentPageId = existing.id;
        titleEl.value = existing.titleHtml || existing.title || '';
        summaryEl.value = existing.summaryHtml || existing.summary || '';
        contentEl.innerHTML = existing.contentHtml || '';
        if (contentHtmlEl) contentHtmlEl.value = existing.contentHtml || '';
        authorEl.value = existing.author || '';
        tagsEl.value = (existing.tags || []).join(', ');
        images = existing.images || [];
        links = existing.links || [];
        createdAtEl.textContent = formatDate(existing.createdAt);
        updatedAtEl.textContent = formatDate(existing.updatedAt || existing.createdAt);
        statusDisplayEl.textContent = existing.status === 'published' ? 'Published' : 'Draft';
        currentStatus = existing.status === 'published' ? 'published' : 'draft';
        renderImages();
        renderLinks();
      }
    }

    // ------------------------
    // Rich text toolbar (offline)
    // Uses document.execCommand for broad compatibility.
    // ------------------------

    function exec(cmd, value) {
      if (isHtmlMode) {
        alert('Switch out of HTML mode to use the formatting toolbar.');
        return;
      }
      contentEl.focus();
      try {
        document.execCommand(cmd, false, value);
      } catch (e) {
        console.warn('Editor command failed:', cmd, e);
      }
      markDirty();
    }

    function handleToolbarClick(e) {
      if (isHtmlMode) return;
      const btn = e.target.closest('button');
      if (!btn) return;
      const cmd = btn.getAttribute('data-cmd');
      const action = btn.getAttribute('data-action');

      if (cmd) {
        const v = btn.getAttribute('data-value');
        if (cmd === 'removeFormat') {
          // Make "Clear" feel reliable:
          // 1) remove inline formatting in selection
          // 2) remove links
          // If selection is collapsed, clear the entire editor.
          const sel = window.getSelection && window.getSelection();
          if (!sel || sel.isCollapsed) {
            if (confirm('Clear all formatting and content in the editor?')) {
              setContentHtml('<p></p>');
            }
          } else {
            exec('removeFormat');
            exec('unlink');
          }
          return;
        }
        if (cmd === 'formatBlock') {
          // Ensure the value is a tag like <h2>
          const tag = (v || '').toLowerCase();
          const tagValue = tag ? `<${tag}>` : '<p>';
          exec('formatBlock', tagValue);
        } else {
          exec(cmd, v || null);
        }
        return;
      }

      if (action === 'link') {
        const url = prompt('Link URL (external or internal):');
        if (!url) return;
        exec('createLink', url);
      }
    }

    if (toolbarEl && contentEl) {
      toolbarEl.addEventListener('click', handleToolbarClick);
    }

    if (htmlModeBtn) {
      htmlModeBtn.addEventListener('click', () => enableHtmlMode(!isHtmlMode));
    }

    function renderImages() {
      if (!imagesContainer) return;
      imagesContainer.innerHTML = '';
      images.forEach((img, idx) => {
        const wrap = document.createElement('div');
        wrap.className = 'infohub-image-item';
        wrap.innerHTML = `
          <img src="${img.dataUrl}" alt="Image ${idx + 1}" class="infohub-image-preview" />
          <input type="text" class="infohub-image-caption" placeholder="Caption" value="${escapeHtml(img.caption || '')}" data-idx="${idx}">
          <button type="button" class="infohub-image-remove" data-idx="${idx}">Remove</button>
        `;
        imagesContainer.appendChild(wrap);
      });
    }

    function renderLinks() {
      if (!linksContainer) return;
      linksContainer.innerHTML = '';
      links.forEach((link, idx) => {
        const wrap = document.createElement('div');
        wrap.className = 'infohub-link-item';
        wrap.innerHTML = `
          <input type="text" class="infohub-link-label" placeholder="Label" value="${escapeHtml(link.label || '')}" data-idx="${idx}">
          <input type="url" class="infohub-link-url" placeholder="https://example.com" value="${escapeHtml(link.url || '')}" data-idx="${idx}">
          <button type="button" class="infohub-link-remove" data-idx="${idx}">Remove</button>
        `;
        linksContainer.appendChild(wrap);
      });
    }

    function handleAddImage() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files && input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          images.push({
            id: 'img_' + Date.now() + '_' + Math.floor(Math.random() * 1e6),
            dataUrl: reader.result,
            caption: ''
          });
          renderImages();
          markDirty();
        };
        reader.readAsDataURL(file);
      };
      input.click();
    }

    function handleImagesContainerClick(e) {
      const target = e.target;
      if (target.classList.contains('infohub-image-remove')) {
        const idx = parseInt(target.getAttribute('data-idx'), 10);
        if (!Number.isNaN(idx)) {
          images.splice(idx, 1);
          renderImages();
          markDirty();
        }
      }
    }

    function handleImagesContainerInput(e) {
      const target = e.target;
      if (target.classList.contains('infohub-image-caption')) {
        const idx = parseInt(target.getAttribute('data-idx'), 10);
        if (!Number.isNaN(idx)) {
          images[idx].caption = target.value;
          markDirty();
        }
      }
    }

    function handleAddLink() {
      links.push({ label: '', url: '' });
      renderLinks();
      markDirty();
    }

    function handleLinksContainerClick(e) {
      const target = e.target;
      if (target.classList.contains('infohub-link-remove')) {
        const idx = parseInt(target.getAttribute('data-idx'), 10);
        if (!Number.isNaN(idx)) {
          links.splice(idx, 1);
          renderLinks();
          markDirty();
        }
      }
    }

    function handleLinksContainerInput(e) {
      const target = e.target;
      if (target.classList.contains('infohub-link-label') || target.classList.contains('infohub-link-url')) {
        const idx = parseInt(target.getAttribute('data-idx'), 10);
        if (!Number.isNaN(idx)) {
          const field = target.classList.contains('infohub-link-label') ? 'label' : 'url';
          links[idx][field] = target.value;
          markDirty();
        }
      }
    }

    function markDirty() {
      isDirty = true;
    }

    if (insertTemplateBtn) {
      insertTemplateBtn.addEventListener('click', function () {
        const currentHtml = stripTags(getContentHtml()).trim();
        if (currentHtml.length > 0) {
          const ok = confirm('Insert the How-To template? This will replace the current Main Content.');
          if (!ok) return;
        }
        enableHtmlMode(false);
        setContentHtml(HOWTO_TEMPLATE);
        markDirty();
      });
    }

    const insertGuideTemplateBtn = document.getElementById('insertGuideTemplateBtn');
    if (insertGuideTemplateBtn) {
      insertGuideTemplateBtn.addEventListener('click', function () {
        const currentHtml = stripTags(getContentHtml()).trim();
        if (currentHtml.length > 0) {
          const ok = confirm('Insert the Visual Guide template? This will replace the current Main Content.');
          if (!ok) return;
        }
        enableHtmlMode(false);
        setContentHtml(GUIDE_TEMPLATE);
        markDirty();
      });
    }

    function safeAutoBackup() {
      try {

      } catch (e) {
        // ignore backup failures; do not block normal flows
      }
    }

    // Track form edits for autosave
    [titleEl, summaryEl, authorEl, tagsEl].forEach(el => {
      if (!el) return;
      el.addEventListener('input', markDirty);
    });
    if (contentEl) contentEl.addEventListener('input', markDirty);
    if (contentHtmlEl) contentHtmlEl.addEventListener('input', markDirty);

    function collectTags() {
      const raw = tagsEl.value || '';
      return raw
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
    }

    function buildPagePayload(status) {
      const nowIso = new Date().toISOString();
      const pages = loadPages();
      let createdAt = nowIso;

      if (currentPageId) {
        const existing = pages.find(p => p.id === currentPageId);
        if (existing && existing.createdAt) createdAt = existing.createdAt;
      }

      if (!currentPageId) currentPageId = generateId();

      // Single-user offline mode: visibility scoping is no longer used.
      const ownerProfileId = null;
      const visibility = 'shared';

      return {
        id: currentPageId,
        // Allow HTML in title/summary by storing raw HTML variants.
        // We keep text fallbacks for stable indexing.
        titleHtml: titleEl.value.trim() || 'Untitled Page',
        summaryHtml: summaryEl.value.trim(),
        title: stripTags(titleEl.value.trim() || 'Untitled Page'),
        summary: stripTags(summaryEl.value.trim()),
        contentHtml: getContentHtml(),
        images: images.slice(),
        links: links.slice(),
        tags: collectTags(),
        createdAt,
        updatedAt: nowIso,
        author: authorEl.value.trim() || 'Local User',
        status,
        archived: false,
        ownerProfileId: ownerProfileId || null,
        visibility
      };
    }

    function saveAsDraft() {
      if (!titleEl.value.trim()) {
        alert('Please provide at least a title before saving.');
        return;
      }
      const page = buildPagePayload('draft');
      upsertPage(page);
      safeAutoBackup();
      currentStatus = 'draft';
      isDirty = false;
      createdAtEl.textContent = formatDate(page.createdAt);
      updatedAtEl.textContent = formatDate(page.updatedAt);
      statusDisplayEl.textContent = 'Draft';
      alert('Draft saved.');
      populateInfoHubDropdown();
    }

    function publishPage() {
      if (!titleEl.value.trim()) {
        alert('Title is required to publish a page.');
        return;
      }
      const page = buildPagePayload('published');
      upsertPage(page);
      safeAutoBackup();
      currentStatus = 'published';
      isDirty = false;
      createdAtEl.textContent = formatDate(page.createdAt);
      updatedAtEl.textContent = formatDate(page.updatedAt);
      statusDisplayEl.textContent = 'Published';
      alert('Page published. Redirecting to Info Hub Index.');
      populateInfoHubDropdown();
      window.location.href = 'info-hub.html';
    }

    // Optional QoL: Autosave drafts (no prompts)
    function autosaveDraft() {
      if (!autosaveEl) return;
      if (!isDirty) return;
      if (!titleEl.value.trim()) return;
      if (currentStatus === 'published') return; // avoid unintended changes

      // Throttle autosave (at most once every 10s)
      const now = Date.now();
      if (now - lastAutosaveAt < 10000) return;
      lastAutosaveAt = now;

      const page = buildPagePayload('draft');
      upsertPage(page);
      safeAutoBackup();
      isDirty = false;
      updatedAtEl.textContent = formatDate(page.updatedAt);
      autosaveEl.textContent = 'Autosaved';
      setTimeout(() => { if (autosaveEl) autosaveEl.textContent = ''; }, 2500);
      populateInfoHubDropdown();
    }

    setInterval(autosaveDraft, 20000);

    function deletePageHandler() {
      if (!currentPageId) {
        // nothing persisted yet; just reset form
        if (confirm('Clear this page?')) {
          window.location.href = 'create-page.html';
        }
        return;
      }
      if (confirm('Delete this page? This removes it from the Info Hub list (soft delete).')) {
        archivePage(currentPageId);
        alert('Page deleted.');
        safeAutoBackup();
        populateInfoHubDropdown();
        window.location.href = 'info-hub.html';
      }
    }

    function previewPage() {
      const temp = buildPagePayload('draft');
      const win = window.open('', '_blank');
      if (!win) return;
      win.document.write(`
        <html><head><title>Preview: ${escapeHtml(temp.title)}</title>
        <style>
          body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 1.5rem; background: #0f172a; color: #e5e7eb; }
          h1 { margin-top: 0; }
          .meta { font-size: 0.9rem; color: #94a3b8; margin-bottom: 1rem; }
          .images img { max-width: 100%; border-radius: 8px; margin-top: 0.5rem; }
          .caption { font-size: 0.85rem; color: #cbd5f5; }
        </style>
        </head><body>
          <h1>${temp.titleHtml || escapeHtml(temp.title)}</h1>
          <div class="meta">Preview only (not saved).</div>
          ${temp.summaryHtml ? `<p><strong>Summary:</strong> ${temp.summaryHtml}</p>` : (temp.summary ? `<p><strong>Summary:</strong> ${escapeHtml(temp.summary)}</p>` : '')}
          <div>${temp.contentHtml}</div>
          ${temp.images && temp.images.length ? '<h3>Images</h3><div class="images">' + temp.images.map(img => `
            <div>
              <img src="${img.dataUrl}" alt="">
              ${img.caption ? `<div class="caption">${img.caption}</div>` : ''}
            </div>
          `).join('') + '</div>' : ''}
        </body></html>
      `);
      win.document.close();
    }

    // Event bindings
    if (addImageBtn) addImageBtn.addEventListener('click', handleAddImage);
    if (imagesContainer) {
      imagesContainer.addEventListener('click', handleImagesContainerClick);
      imagesContainer.addEventListener('input', handleImagesContainerInput);
    }

    if (addLinkBtn) addLinkBtn.addEventListener('click', handleAddLink);
    if (linksContainer) {
      linksContainer.addEventListener('click', handleLinksContainerClick);
      linksContainer.addEventListener('input', handleLinksContainerInput);
    }

    if (saveDraftBtn) saveDraftBtn.addEventListener('click', saveAsDraft);
    if (publishBtn) publishBtn.addEventListener('click', publishPage);
    if (deleteBtn) deleteBtn.addEventListener('click', deletePageHandler);
    if (previewBtn) previewBtn.addEventListener('click', previewPage);

    // Initialize metadata for new pages
    if (!existingId) {
      const now = new Date().toISOString();
      createdAtEl.textContent = formatDate(now);
      statusDisplayEl.textContent = 'Draft';
    }
  }

  // ------------------------
  // Info Page Read-only View
  // ------------------------

  function initInfoPageView() {
    const viewEl = document.getElementById('infoPageView');
    if (!viewEl) return; // not on view page

    const titleEl = document.getElementById('viewTitle');
    const summaryEl = document.getElementById('viewSummary');
    const contentEl = document.getElementById('viewContent');
    const imagesEl = document.getElementById('viewImages');
    const linksEl = document.getElementById('viewLinks');
    const metaEl = document.getElementById('viewMeta');

    const editBtn = document.getElementById('editPageBtn');
    const archiveBtn = document.getElementById('archivePageBtn');
    const backBtn = document.getElementById('backToInfoHubBtn');

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) {
      titleEl.textContent = 'Page not found';
      summaryEl.textContent = '';
      contentEl.textContent = 'No page id provided.';
      if (editBtn) editBtn.disabled = true;
      if (archiveBtn) archiveBtn.disabled = true;
      return;
    }

    const page = findPageById(id);
    if (!page || page.archived) {
      titleEl.textContent = 'Page not found';
      summaryEl.textContent = '';
      contentEl.textContent = 'This page does not exist or has been archived.';
      if (editBtn) editBtn.disabled = true;
      if (archiveBtn) archiveBtn.disabled = true;
      return;
    }

    titleEl.innerHTML = page.titleHtml || escapeHtml(page.title || 'Untitled Page');
    summaryEl.innerHTML = page.summaryHtml || escapeHtml(page.summary || '');
    const legacyContent = page.contentHtml || page.content || page.bodyHtml || '';
    contentEl.innerHTML = legacyContent;

    if (imagesEl) {
      imagesEl.innerHTML = '';
      (page.images || []).forEach(img => {
        const wrap = document.createElement('div');
        wrap.className = 'infohub-image-block';
        wrap.innerHTML = `
          <img src="${img.dataUrl}" class="infohub-image-preview" alt="">
          ${img.caption ? `<div class="infohub-image-caption">${img.caption}</div>` : ''}
        `;
        imagesEl.appendChild(wrap);
      });
    }

    if (linksEl) {
      linksEl.innerHTML = '';
      const links = page.links || [];
      if (links.length) {
        const ul = document.createElement('ul');
        links.forEach(link => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = link.url || '#';
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.innerHTML = link.label ? link.label : escapeHtml(link.url || 'Link');
          li.appendChild(a);
          ul.appendChild(li);
        });
        linksEl.appendChild(ul);
      } else {
        const none = document.createElement('p');
        none.textContent = 'No supporting links.';
        linksEl.appendChild(none);
      }
    }

    if (metaEl) {
      const tagsText = (page.tags || []).join(', ');
      metaEl.innerHTML = `
        <p><strong>Status:</strong> ${page.status === 'published' ? 'Published' : 'Draft'}</p>
        <p><strong>Author:</strong> ${escapeHtml(page.author || 'Local User')}</p>
        <p><strong>Created:</strong> ${formatDate(page.createdAt)}</p>
        <p><strong>Last Updated:</strong> ${formatDate(page.updatedAt || page.createdAt)}</p>
        ${tagsText ? `<p><strong>Tags:</strong> ${escapeHtml(tagsText)}</p>` : ''}
      `;
    }

    if (editBtn) {
      editBtn.addEventListener('click', () => {
        window.location.href = 'create-page.html?id=' + encodeURIComponent(id);
      });
    }

    if (archiveBtn) {
      archiveBtn.addEventListener('click', () => {
        if (confirm('Delete this page? This removes it from the Info Hub list (soft delete).')) {
          archivePage(id);
          alert('Page deleted.');
          populateInfoHubDropdown();
          window.location.href = 'info-hub.html';
        }
      });
    }

    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.location.href = 'info-hub.html';
      });
    }
  }

  // ------------------------
  // Nav Dropdown UX (click-to-toggle + click-away close)
  // ------------------------

  function initNavDropdownToggles() {
    const toggles = document.querySelectorAll('.nav-dropdown-toggle');
    if (!toggles.length) return;

    toggles.forEach(t => {
      t.addEventListener('click', (e) => {
        // Allow the Info Hub link itself to work with modifier keys,
        // but normal click toggles the dropdown for touch devices.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        const parent = t.closest('.nav-dropdown');
        if (!parent) return;
        parent.classList.toggle('open');
      });
    });

    document.addEventListener('click', (e) => {
      const isInside = e.target.closest('.nav-dropdown');
      if (isInside) return;
      document.querySelectorAll('.nav-dropdown.open').forEach(el => el.classList.remove('open'));
    });
  }

  // ------------------------
  // Init on DOMContentLoaded
  // ------------------------

  document.addEventListener('DOMContentLoaded', function () {
    ensureDefaultGettingStartedPage();
    populateInfoHubDropdown();
    initNavDropdownToggles();
    initInfoHubLanding();
    initPageBuilder();
    initInfoPageView();
  });
})();

