// Nebula Layout Forge (Plain Text → HTML Layout Builder)
// Enhanced with device preview modes, toolbar undo/clear, font selection, and UX tweaks.
(function () {
  const STORAGE_KEY_STATE = "ptlb_app_state_v2";
  const STORAGE_KEY_THEME = "ptlb_app_theme_v2";
  const STORAGE_KEY_TEMPLATES = "ptlb_app_templates_v2";

  const appEl = document.querySelector(".app");
  const editorEl = document.getElementById("editor");
  const previewEl = document.getElementById("preview");
  const previewPaneEl = document.querySelector(".preview-pane");
  const htmlOutputEl = document.getElementById("htmlOutput");
  const copyHtmlBtn = document.getElementById("copyHtmlBtn");
  const copyStandaloneHtmlBtn = document.getElementById("copyStandaloneHtmlBtn");
  const copyHtmlFromEditorBtn = document.getElementById("copyHtmlFromEditorBtn");
  const copyStatusEl = document.getElementById("copyStatus");
  const quickBackupBtn = document.getElementById("quickBackupBtn");
  const presetListEl = document.getElementById("presetList");
  const railPresetListEl = document.getElementById("railPresetList");
  const customTemplateListEl = document.getElementById("customTemplateList");
  const templateNameInput = document.getElementById("templateNameInput");
  const saveTemplateBtn = document.getElementById("saveTemplateBtn");
  const manualSaveBtn = document.getElementById("manualSaveBtn");
  const restoreLocalBtn = document.getElementById("restoreLocalBtn");
  const localSaveStatusEl = document.getElementById("localSaveStatus");
  const exportJsonBtn = document.getElementById("exportJsonBtn");
  const importJsonInput = document.getElementById("importJsonInput");
  const backupStatusEl = document.getElementById("backupStatus");
  const footerYearEl = document.getElementById("footerYear");
  const textColorSelect = document.getElementById("textColorSelect");
  const bgColorSelect = document.getElementById("bgColorSelect");
  const lineHeightSelect = document.getElementById("lineHeightSelect");
  const fontSelect = document.getElementById("fontSelect");
  const brandHome = document.getElementById("brandHome");
  const backgroundSelect = document.getElementById("backgroundSelect");
  const copyStatusEditorEl = document.getElementById("copyStatusEditor");
  const deviceButtons = document.querySelectorAll(".device-btn");

  const navTabs = document.querySelectorAll(".nav-tab");
  const tabPanels = {
    editor: document.getElementById("editorTab"),
    templates: document.getElementById("templatesTab"),
    html: document.getElementById("htmlTab"),
    help: document.getElementById("helpTab"),
  };

  let autosaveTimeout = null;

  const defaultTheme = {
    mode: "dark",
    palette: "purple",
    baseFontSize: 16,
    fontFamily: "system",
    density: "relaxed",
  };

  const defaultState = {
    contentHtml: editorEl ? editorEl.innerHTML : "",
    theme: defaultTheme,
  };

  const presets = [
    {
      id: "faq",
      name: "FAQ Layout",
      description: "Question-and-answer accordion-style FAQ section.",
      html: `
<h1>Frequently Asked Questions</h1>
<div class="spacer-md"></div>
<div class="box box-info">
  <strong>Tip:</strong> Keep answers short and link to deep-dive docs when needed.
</div>
<div class="spacer-sm"></div>
<h2>General</h2>
<h3 class="note">What is this tool for?</h3>
<p>
  Nebula Layout Forge helps you convert structured content into clean HTML,
  including FAQs like this one.
</p>
<h3>Do I need an internet connection?</h3>
<p>
  <span class="badge">Offline</span>
  No. Everything runs in your browser and uses local JSON backups.
</p>
<div class="spacer-md"></div>
<h2>Usage</h2>
<ul class="task-list">
  <li><input type="checkbox" /> Open the Templates tab.</li>
  <li><input type="checkbox" /> Name your layout.</li>
  <li><input type="checkbox" /> Click "Save Current as Template".</li>
</ul>`,
    },
    {
      id: "tech-doc",
      name: "Clean Technical Documentation",
      description: "Structured documentation with sections, notes, and code.",
      html: `
<h1>API Overview</h1>
<p>
  This document provides a high-level overview of the core API endpoints,
  authentication model, and error handling strategy.
</p>
<div class="note">
  <strong>Note:</strong> All endpoints require TLS (HTTPS). Requests over HTTP
  are rejected with <span class="tag">400 Bad Request</span>.
</div>
<div class="spacer-md"></div>
<h2>Authentication</h2>
<p>
  The API uses token-based authentication. Include your token in the
  <span class="inline-code">Authorization</span> header.
</p>
<div class="code-block">
GET /v1/projects<br />
Authorization: Bearer &lt;token&gt;
</div>
<div class="spacer-md"></div>
<h2>Error Handling</h2>
<table class="table-compact">
  <thead>
    <tr>
      <th>Code</th>
      <th>Meaning</th>
      <th>Suggested Action</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>400</td>
      <td>Bad Request</td>
      <td>Check payload and query parameters.</td>
    </tr>
    <tr>
      <td>401</td>
      <td>Unauthorized</td>
      <td>Verify your token and scopes.</td>
    </tr>
    <tr>
      <td>429</td>
      <td>Rate Limited</td>
      <td>Slow down and retry with backoff.</td>
    </tr>
  </tbody>
</table>`,
    },
    {
      id: "status-board",
      name: "Project Status Board",
      description: "KPI-style project status overview.",
      html: `
<h1>Quarterly Project Status</h1>
<div class="box box-callout">
  <strong>At a glance:</strong> Delivery is on track for all critical projects,
  with a few moderate risks under active mitigation.
</div>
<div class="spacer-md"></div>
<table class="kpi-table">
  <thead>
    <tr>
      <th>Project</th>
      <th>Status</th>
      <th>Owner</th>
      <th>Next Milestone</th>
      <th>Risk</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Onboarding Revamp</td>
      <td><span class="badge">On Track</span></td>
      <td>Alex</td>
      <td>Beta launch (May 12)</td>
      <td>Low</td>
    </tr>
    <tr>
      <td>Billing Migration</td>
      <td><span class="badge">At Risk</span></td>
      <td>Jordan</td>
      <td>Cutover (Jun 02)</td>
      <td>Medium</td>
    </tr>
    <tr>
      <td>Analytics v3</td>
      <td><span class="badge">Watching</span></td>
      <td>Riley</td>
      <td>Public docs (May 25)</td>
      <td>Low</td>
    </tr>
  </tbody>
</table>`,
    },
    {
      id: "changelog",
      name: "Changelog / Update Log",
      description: "Versioned change history with badges.",
      html: `
<h1>Changelog</h1>
<p>
  All notable changes to this project are documented here.
  <span class="badge">Stable</span>
</p>
<div class="spacer-md"></div>
<h2>v1.4.0 <span class="tag">2026-02-01</span></h2>
<ul>
  <li>Added JSON backup and restore with validation.</li>
  <li>Introduced custom templates and preset layouts.</li>
  <li>Improved keyboard navigation in the editor.</li>
</ul>
<div class="note">
  <strong>Upgrade Note:</strong> No breaking changes. Existing backups remain
  compatible.
</div>
<div class="spacer-md"></div>
<h2>v1.3.0</h2>
<ul>
  <li>New KPI-style tables and chart-like data layouts.</li>
  <li>Improved dark mode contrast and color palettes.</li>
</ul>`,
    },
    {
      id: "announcement",
      name: "Announcement / Newsletter",
      description: "Short announcement with callout and highlights.",
      html: `
<h1>Product Launch Announcement</h1>
<div class="box box-callout">
  <strong>We&apos;re live!</strong> Our new layout builder is available to all
  customers starting today. 🎉
</div>
<div class="spacer-md"></div>
<h2>Highlights</h2>
<ul>
  <li>Offline editing with JSON backups.</li>
  <li>Rich layout components: boxes, badges, tables, timelines, and more.</li>
  <li>Custom templates for recurring formats.</li>
</ul>
<div class="spacer-md"></div>
<h2>What&apos;s Next</h2>
<p>
  Over the next few weeks, we&apos;ll roll out additional presets for
  documentation, knowledge bases, and support centers.
</p>`,
    },
    {
      id: "landing",
      name: "Simple Landing Section",
      description: "Hero-style landing content with call-to-action.",
      html: `
<div class="section-accent">
  <h1>Build HTML Layouts with Confidence</h1>
  <p>
    Design structured, reusable content blocks that drop cleanly into your
    website or documentation system.
  </p>
  <div class="spacer-sm"></div>
  <div class="feature-grid">
    <div class="feature-card">
      <h3>Offline-first</h3>
      <p>Edit anywhere without a network connection.</p>
    </div>
    <div class="feature-card">
      <h3>JSON Backups</h3>
      <p>Export/import full state, including templates.</p>
    </div>
    <div class="feature-card">
      <h3>Flexible Layouts</h3>
      <p>Timeline, KPI tables, cards, callouts and more.</p>
    </div>
  </div>
  <div class="cta-strip">
    <span>Ready to design your next layout?</span>
    <span class="badge">Start in the editor</span>
  </div>
</div>`,
    },
    {
      id: "release-notes",
      name: "Release Notes",
      description: "Structured release notes per feature area.",
      html: `
<h1>Release Notes: v2.0</h1>
<div class="divider-label"><span>Highlights</span></div>
<h2>Editor</h2>
<ul>
  <li>Added inline code, code blocks, and pre-formatted snippets.</li>
  <li>Improved list handling and checklist formatting.</li>
</ul>
<h2>Templates</h2>
<ul>
  <li>New FAQ, changelog, landing, and roadmap presets.</li>
  <li>Custom templates now support rename and delete.</li>
</ul>
<h2>Stability</h2>
<ul>
  <li>Fixed autosave edge cases after restoring from backup.</li>
  <li>Improved validation when importing external JSON.</li>
</ul>`,
    },
    {
      id: "support-page",
      name: "Support / Help Page",
      description: "Support topics with notes and callouts.",
      html: `
<h1>Help Center</h1>
<p>
  Welcome to the help center. Start by picking a topic below or searching for a
  keyword.
</p>
<div class="box box-info">
  <strong>Need urgent assistance?</strong> Contact support via email and include
  your backup JSON, if available.
</div>
<div class="spacer-md"></div>
<h2>Common Topics</h2>
<ul>
  <li>Creating and saving templates.</li>
  <li>Exporting and importing JSON backups.</li>
  <li>Embedding HTML in documentation systems.</li>
</ul>
<div class="note">
  <strong>Pro tip:</strong> Use badges and tags to highlight key words and
  statuses in your support articles.
</div>`,
    },
    {
      id: "comparison",
      name: "Feature Comparison Table",
      description: "Side-by-side feature comparison.",
      html: `
<h1>Feature Comparison</h1>
<p>
  Quickly compare the capabilities of different tools or plans using a
  structured table.
</p>
<table class="matrix-table">
  <thead>
    <tr>
      <th>Feature</th>
      <th>Layout Forge</th>
      <th>Generic Editor</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Offline support</td>
      <td>✅</td>
      <td>⚠️</td>
    </tr>
    <tr>
      <td>JSON backups</td>
      <td>✅</td>
      <td>❌</td>
    </tr>
    <tr>
      <td>Rich layout components</td>
      <td>✅</td>
      <td>➖</td>
    </tr>
  </tbody>
</table>`,
    },
    {
      id: "note-style",
      name: "Minimal Note-Style Layout",
      description: "Lightweight notes with headings and bullets.",
      html: `
<h1>Meeting Notes</h1>
<p><span class="tag">Today</span> Quick summary of key discussion points.</p>
<h2>Agenda</h2>
<ul>
  <li>Review open action items.</li>
  <li>Decide on next sprint priorities.</li>
  <li>Confirm release timeline.</li>
</ul>
<h2>Decisions</h2>
<ul class="task-list">
  <li><input type="checkbox" checked /> Move analytics refactor to next sprint.</li>
  <li><input type="checkbox" /> Finalize API error messages.</li>
</ul>
<div class="note">
  <strong>Reminder:</strong> Export a JSON backup of the finalized notes and
  attach it to the sprint ticket.
</div>`,
    },
    // Extra presets
    {
      id: "roadmap",
      name: "Roadmap Timeline",
      description: "Quarterly roadmap styled as a timeline.",
      html: `
<h1>Product Roadmap</h1>
<p>
  This roadmap outlines the planned work across quarters. Use the timeline
  to communicate phases and key milestones.
</p>
<div class="timeline">
  <div class="timeline-item">
    <div class="timeline-dot"></div>
    <h3>Q1 · Foundation</h3>
    <p>Stabilize current release and ship JSON backup improvements.</p>
  </div>
  <div class="timeline-item">
    <div class="timeline-dot"></div>
    <h3>Q2 · Collaboration</h3>
    <p>Add multi-user review workflows and inline comments.</p>
  </div>
  <div class="timeline-item">
    <div class="timeline-dot"></div>
    <h3>Q3 · Integrations</h3>
    <p>Integrate with CMS platforms and documentation tools.</p>
  </div>
</div>`,
    },
    {
      id: "incident-report",
      name: "Incident Report",
      description: "Post-incident analysis layout with timeline.",
      html: `
<h1>Incident Report</h1>
<div class="box box-warn">
  <strong>Summary:</strong> Briefly describe the incident, impact, and duration.
</div>
<div class="spacer-md"></div>
<h2>Timeline</h2>
<div class="timeline">
  <div class="timeline-item">
    <div class="timeline-dot"></div>
    <p><strong>10:02</strong> · Alert triggered for elevated error rates.</p>
  </div>
  <div class="timeline-item">
    <div class="timeline-dot"></div>
    <p><strong>10:15</strong> · On-call engineer acknowledged the incident.</p>
  </div>
  <div class="timeline-item">
    <div class="timeline-dot"></div>
    <p><strong>10:45</strong> · Mitigation deployed; monitoring recovery.</p>
  </div>
</div>
<h2>Root Cause</h2>
<p>Describe the primary contributing factors.</p>
<h2>Follow-up Actions</h2>
<ul class="task-list">
  <li><input type="checkbox" /> Improve monitoring coverage for dependency X.</li>
  <li><input type="checkbox" /> Add runbook steps for quick validation.</li>
</ul>`,
    },
    {
      id: "onboarding-checklist",
      name: "Onboarding Checklist",
      description: "Checklist-style layout for new joiners.",
      html: `
<h1>New Hire Onboarding Checklist</h1>
<p>
  Use this checklist to guide new team members through their first days.
</p>
<div class="section-card">
  <h2>Day 1</h2>
  <ul class="task-list">
    <li><input type="checkbox" /> Laptop and account setup.</li>
    <li><input type="checkbox" /> Meet with manager and buddy.</li>
    <li><input type="checkbox" /> Review team charter and roadmap.</li>
  </ul>
</div>
<div class="section-card">
  <h2>Week 1</h2>
  <ul class="task-list">
    <li><input type="checkbox" /> Shadow at least two live calls.</li>
    <li><input type="checkbox" /> Ship a small, safe change to production.</li>
  </ul>
</div>`,
    },
    {
      id: "update-email",
      name: "Weekly Update Email",
      description: "Internal weekly update/summary layout.",
      html: `
<h1>Weekly Team Update</h1>
<p><span class="tag">Week 32</span> Key highlights from this week.</p>
<div class="feature-grid">
  <div class="feature-card">
    <h3>Shipped</h3>
    <p>New onboarding checklist preset and incident report template.</p>
  </div>
  <div class="feature-card">
    <h3>In Progress</h3>
    <p>Refinements to dark mode theming and accessibility.</p>
  </div>
  <div class="feature-card">
    <h3>Upcoming</h3>
    <p>Better keyboard shortcuts and navigation.</p>
  </div>
</div>
<div class="note">
  <strong>Callout:</strong> Please send feedback about the new layouts by
  Friday noon. 💡
</div>`,
    },
    {
      id: "kb-article",
      name: "Knowledge Base Article",
      description: "Knowledge base style with sections and callouts.",
      html: `
<h1>Using Nebula Layout Forge</h1>
<div class="section-left-border">
  <p>
    This article explains how to use the layout builder for internal
    documentation and external-facing pages.
  </p>
</div>
<h2>Before You Start</h2>
<ul>
  <li>Decide on your target format (FAQ, guide, doc, etc.).</li>
  <li>Pick a preset closest to your needs.</li>
</ul>
<h2>Best Practices</h2>
<ul>
  <li>Use headings to create a clear structure.</li>
  <li>Use callouts to highlight important warnings or success states.</li>
  <li>Use KPIs for dashboards and summaries.</li>
</ul>`,
    },
    {
      id: "feature-spec",
      name: "Feature Spec Layout",
      description: "Structured spec layout with sections and tables.",
      html: `
<h1>Feature Specification</h1>
<div class="section-top-border">
  <p>
    This document describes the requirements, UX flows, and technical details
    for the proposed feature.
  </p>
</div>
<h2>Goals</h2>
<ul>
  <li>Clarify user needs and success metrics.</li>
  <li>Define the boundaries of the first release.</li>
</ul>
<h2>Constraints</h2>
<ul>
  <li>Must work offline.</li>
  <li>Must not degrade existing editor performance.</li>
</ul>
<h2>Risks</h2>
<table class="table-compact">
  <thead>
    <tr>
      <th>Risk</th>
      <th>Impact</th>
      <th>Mitigation</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Unexpected browser APIs</td>
      <td>Medium</td>
      <td>Use well-supported DOM APIs.</td>
    </tr>
  </tbody>
</table>`,
    },
  
    {
      id: "work-tracker-log",
      name: "Work Tracker Session Log",
      description: "Structured work entry layout with rich sections, status chips, and emoji.",
      html: `
<h1>🧰 Work Tracker — Session Entry</h1>
<p class="muted">
  Use this layout to log a single work session, capture progress, blockers, and next actions.
</p>

<hr>

<section>
  <h2>🔖 Session Overview</h2>
  <ul>
    <li><strong>Date:</strong> <span class="tag">YYYY-MM-DD</span></li>
    <li><strong>Owner:</strong> <span class="tag">Your Name</span></li>
    <li><strong>Priority:</strong> <span class="tag tag-pill">Low ▪ Medium ▪ High ▪ Critical</span></li>
    <li><strong>Status:</strong> <span class="tag tag-status">Planned ▪ In Progress ▪ Blocked ▪ Done</span></li>
  </ul>
</section>

<div class="spacer-md"></div>

<section class="box box-info">
  <h2>🎯 Primary Objective</h2>
  <p>
    Briefly describe the core goal of this work session. Focus on the outcome, not the activity.
  </p>
  <ul>
    <li>Objective 1</li>
    <li>Objective 2</li>
    <li>Objective 3</li>
  </ul>
</section>

<div class="spacer-md"></div>

<section>
  <h2>📋 Tasks & Checkpoints</h2>
  <table class="table compact">
    <thead>
      <tr>
        <th>Task</th>
        <th>Owner</th>
        <th>Status</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Create / update records</td>
        <td>JMS</td>
        <td>⬜ Todo ▪ 🔄 In Progress ▪ ✅ Done</td>
        <td>Links, ticket IDs, file paths, etc.</td>
      </tr>
      <tr>
        <td>Validate / QA</td>
        <td>—</td>
        <td>⬜ Todo ▪ 🔄 In Progress ▪ ✅ Done</td>
        <td>Edge cases, checklist items, approvals.</td>
      </tr>
      <tr>
        <td>Comms & handoff</td>
        <td>—</td>
        <td>⬜ Todo ▪ 🔄 In Progress ▪ ✅ Done</td>
        <td>Who needs to know and when.</td>
      </tr>
    </tbody>
  </table>
</section>

<div class="spacer-md"></div>

<section class="box box-warn">
  <h2>🚧 Blockers & Risks</h2>
  <p>
    Capture anything that might slow you down or require escalation.
  </p>
  <ul>
    <li><strong>Blocker:</strong> …</li>
    <li><strong>Owner:</strong> …</li>
    <li><strong>ETA / Next Check:</strong> …</li>
  </ul>
</section>

<div class="spacer-md"></div>

<section class="box box-success">
  <h2>✅ Outcomes & Wins</h2>
  <p>
    Summarize what actually got done this session. Think in terms of impact, not just activity.
  </p>
  <ul>
    <li>Completed change requests / tickets</li>
    <li>Resolved issues or defects</li>
    <li>Improvements or optimizations</li>
  </ul>
</section>

<div class="spacer-md"></div>

<section>
  <h2>📌 Notes & Reference</h2>
  <p class="muted">
    Use this area for links, IDs, paths, and anything future-you will need.
  </p>
  <ul>
    <li>Ticket / case IDs:</li>
    <li>File locations:</li>
    <li>Reference docs:</li>
  </ul>
</section>

<div class="spacer-md"></div>

<section>
  <h2>🔁 Next Session Setup</h2>
  <p>
    Queue up what should happen next so you can hit the ground running.
  </p>
  <ul>
    <li><strong>Top 3 priorities for next session:</strong></li>
    <li><strong>Pending approvals / reviews:</strong></li>
    <li><strong>Follow-ups or reminders:</strong></li>
  </ul>
</section>
`
    },
    {
      id: "info-hub-knowledge-page",
      name: "Info Hub Knowledge Page",
      description: "Opinionated layout for Kore Info Hub articles with hero, callouts, and sections.",
      html: `
<h1>📚 Info Hub — Topic Title</h1>
<p class="muted">
  High-level summary of this topic. Explain what it is, who it is for, and when to use it.
</p>

<div class="spacer-md"></div>

<section class="box box-info">
  <h2>🧭 At a Glance</h2>
  <ul>
    <li><strong>Owner:</strong> Your team / role</li>
    <li><strong>Last updated:</strong> YYYY-MM-DD</li>
    <li><strong>Applies to:</strong> Systems / processes / products</li>
  </ul>
</section>

<div class="spacer-md"></div>

<section>
  <h2>🔍 Context & Purpose</h2>
  <p>
    Describe the background and why this page exists. Mention the business problem or scenario
    this information supports.
  </p>
</section>

<div class="spacer-md"></div>

<section>
  <h2>🧩 Core Concepts</h2>
  <ul>
    <li><strong>Concept 1:</strong> Short explanation.</li>
    <li><strong>Concept 2:</strong> Short explanation.</li>
    <li><strong>Concept 3:</strong> Short explanation.</li>
  </ul>
</section>

<div class="spacer-md"></div>

<section>
  <h2>🛠️ How-To / Workflow</h2>
  <ol>
    <li>Step 1 — Start here.</li>
    <li>Step 2 — Do the main action.</li>
    <li>Step 3 — Validate the result.</li>
    <li>Step 4 — Escalate or hand off if needed.</li>
  </ol>
</section>

<div class="spacer-md"></div>

<section class="box box-warn">
  <h2>⚠️ Gotchas & Edge Cases</h2>
  <ul>
    <li>Common mistakes to avoid.</li>
    <li>Edge cases that need special handling.</li>
    <li>When to escalate, and to whom.</li>
  </ul>
</section>

<div class="spacer-md"></div>

<section class="box box-success">
  <h2>✨ Best Practices</h2>
  <ul>
    <li>Recommended patterns or naming conventions.</li>
    <li>Time-saving tips or shortcuts.</li>
    <li>Quality checks before calling something done.</li>
  </ul>
</section>

<div class="spacer-md"></div>

<section>
  <h2>🔗 Links & References</h2>
  <ul>
    <li>Main reference document</li>
    <li>Related Info Hub pages</li>
    <li>External documentation / vendor links</li>
  </ul>
</section>

<div class="spacer-md"></div>

<section>
  <h2>📝 Changelog (Optional)</h2>
  <table class="table compact">
    <thead>
      <tr>
        <th>Date</th>
        <th>Change</th>
        <th>Author</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>YYYY-MM-DD</td>
        <td>Initial draft</td>
        <td>Initials</td>
      </tr>
    </tbody>
  </table>
</section>
`
    },];

  function getInitialState() {
    let stored;
    try {
      stored = JSON.parse(localStorage.getItem(STORAGE_KEY_STATE));
    } catch (e) {
      stored = null;
    }
    if (!stored || typeof stored !== "object") {
      return { ...defaultState };
    }
    return {
      contentHtml: typeof stored.contentHtml === "string" ? stored.contentHtml : defaultState.contentHtml,
      theme: Object.assign({}, defaultTheme, stored.theme || {}),
    };
  }

  function getStoredTemplates() {
    try {
      const val = JSON.parse(localStorage.getItem(STORAGE_KEY_TEMPLATES));
      return Array.isArray(val) ? val : [];
    } catch (e) {
      return [];
    }
  }

  function saveTemplates(templates) {
    localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(templates));
  }

  function getStoredTheme() {
    try {
      const val = JSON.parse(localStorage.getItem(STORAGE_KEY_THEME));
      if (!val || typeof val !== "object") return null;
      return Object.assign({}, defaultTheme, val);
    } catch (e) {
      return null;
    }
  }

  function persistState(partial) {
    const current = getInitialState();
    const merged = {
      ...current,
      ...partial,
    };
    localStorage.setItem(
      STORAGE_KEY_STATE,
      JSON.stringify({
        contentHtml: merged.contentHtml,
        theme: merged.theme,
      })
    );
    const templates = getStoredTemplates();
    if (templates) {
      localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(templates));
    }
  }

  function applyTheme(theme) {
    if (!theme) theme = defaultTheme;
    appEl.classList.remove("theme-light", "theme-dark");
    appEl.classList.remove("palette-blue", "palette-purple", "palette-teal", "palette-amber");
    appEl.classList.remove("density-relaxed", "density-compact");

    appEl.classList.add(theme.mode === "dark" ? "theme-dark" : "theme-light");
    appEl.classList.add("palette-" + (theme.palette || "purple"));
    appEl.classList.add("density-" + (theme.density || "relaxed"));

    document.documentElement.style.setProperty("--font-size-base", (theme.baseFontSize || 16) + "px");
    switch (theme.fontFamily) {
      case "serif":
        document.documentElement.style.setProperty(
          "--font-family-base",
          'Georgia, "Times New Roman", serif'
        );
        break;
      case "mono":
        document.documentElement.style.setProperty(
          "--font-family-base",
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
        );
        break;
      case "display":
        document.documentElement.style.setProperty(
          "--font-family-base",
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        );
        break;
      default:
        document.documentElement.style.setProperty(
          "--font-family-base",
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        );
    }

    localStorage.setItem(STORAGE_KEY_THEME, JSON.stringify(theme));
    persistState({ theme });
  }

  function normalizeHtml(html) {
    if (!html) return "";
    return html.replace(/<script[\s\S]*?<\/script>/gi, "");
  }

  
  let currentLayoutBackground = "none";

  function buildInlineStyledHtml(html) {
    if (!html) return "";
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;

    function applyInline(selector, style) {
      wrapper.querySelectorAll(selector).forEach((el) => {
        const existing = el.getAttribute("style") || "";
        const sep = existing && !existing.trim().endsWith(";") ? "; " : "";
        el.setAttribute("style", existing + sep + style);
      });
    }

    // Basic typography
    applyInline("h1", "font-weight:700; font-size:2rem; margin:0 0 0.5rem; letter-spacing:-0.03em;");
    applyInline("h2", "font-weight:700; font-size:1.6rem; margin:1.2rem 0 0.5rem; letter-spacing:-0.03em;");
    applyInline("h3", "font-weight:600; font-size:1.25rem; margin:1rem 0 0.4rem;");
    applyInline("h4", "font-weight:600; font-size:1rem; margin:0.9rem 0 0.35rem; text-transform:uppercase; letter-spacing:0.08em; color:#4f46e5;");
    applyInline("p", "margin:0.35rem 0 0.75rem; line-height:1.6;");
    applyInline("ul, ol", "margin:0.5rem 0 0.75rem 1.35rem; padding-left:0.75rem;");
    applyInline("li", "margin-top:0.15rem;");

    // Inline code and pre
    applyInline(
      "code",
      "font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace; font-size:0.9em; background:#020617; color:#e5e7eb; padding:0.1rem 0.35rem; border-radius:0.35rem; border:1px solid #1f2937;"
    );
    applyInline(
      "pre",
      "margin:1rem 0; padding:1rem 1.1rem; border-radius:0.9rem; border:1px solid #1f2937; background:#020617; font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace; font-size:0.9rem; overflow-x:auto; color:#e5e7eb;"
    );

    // Blockquote & hr
    applyInline(
      "blockquote",
      "margin:1.25rem 0; padding:0.9rem 1rem; border-left:3px solid #4f46e5; background:#0b1120; border-radius:0.9rem; color:#e5e7eb; font-style:italic;"
    );
    applyInline("hr", "border:0; border-top:1px solid #e5e7eb; margin:1.75rem 0;");

    // Boxes & callouts
    applyInline(
      ".box",
      "border-radius:0.9rem; padding:0.9rem 1rem; margin:0.85rem 0; border:1px solid #4b5563; background-color:#020617; color:#e5e7eb;"
    );
    applyInline(".box-info", "border-color:#3b82f6; background-color:#0b1120;");
    applyInline(".box-warn", "border-color:#f59e0b; background-color:#1f1300;");
    applyInline(".box-success", "border-color:#22c55e; background-color:#022c22;");
    applyInline(".box-callout", "border-color:#a855f7; background-color:#150027;");

    // Pills & tags
    applyInline(
      ".badge",
      "display:inline-flex; align-items:center; gap:0.35rem; border-radius:999px; padding:0.1rem 0.6rem; font-size:0.75rem; font-weight:600; background:rgba(79,70,229,0.15); border:1px solid #818cf8; color:#4338ca;"
    );
    applyInline(
      ".tag",
      "display:inline-flex; align-items:center; gap:0.25rem; border-radius:999px; padding:0.15rem 0.6rem; font-size:0.75rem; background:#020617; border:1px solid #6b7280; color:#e5e7eb;"
    );
    applyInline(
      ".note",
      "display:block; border-radius:0.8rem; padding:0.75rem 0.85rem; margin:0.8rem 0; background:#fef3c7; border:1px solid #f59e0b; color:#78350f;"
    );

    // Spacers
    applyInline(".spacer-sm", "margin-top:0.35rem;");
    applyInline(".spacer-md", "margin-top:0.9rem;");
    applyInline(".spacer-lg", "margin-top:1.6rem;");

    // Tables
    applyInline("table", "width:100%; border-collapse:collapse; margin:1.25rem 0; font-size:0.9rem;");
    applyInline("th, td", "border:1px solid #d1d5db; padding:0.55rem 0.6rem;");
    applyInline("th", "background:#f3f4f6; color:#111827; text-align:left; font-weight:600;");
    applyInline(".table-compact th, .table-compact td", "padding:0.35rem 0.45rem; font-size:0.8rem;");

    return wrapper.innerHTML;
  }

  function wrapExportWithBackground(html) {
    const bg = currentLayoutBackground || "none";
    if (!html || !html.trim()) return html || "";
    if (bg === "none") return html;
    const styles = {
      "light-card": "background-color:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:24px 24px 28px;",
      "soft-panel": "background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:16px;padding:24px 24px 28px;",
      "dark-card": "background-color:#111827;border:1px solid #4b5563;border-radius:16px;padding:24px 24px 28px;color:#e5e7eb;",
    };
    const style = styles[bg];
    if (!style) return html;
    return `<div style="${style}">${html}</div>`;
  }

  function buildPreviewHtml(normalizedHtml) {
    if (!normalizedHtml || !normalizedHtml.trim()) return "";
    const bg = currentLayoutBackground || "none";
    if (bg === "none") return normalizedHtml;
    const cls = `layout-surface layout-bg-${bg}`;
    return `<div class="${cls}">${normalizedHtml}</div>`;
  }

function updatePreviewAndHtml() {
    const normalized = normalizeHtml(editorEl.innerHTML);
    const previewHtml = buildPreviewHtml(normalized);
    previewEl.innerHTML = previewHtml;
    const exportHtml = wrapExportWithBackground(buildInlineStyledHtml(normalized));
    htmlOutputEl.value = exportHtml;
    scheduleAutosave(normalized);
  }

  function scheduleAutosave(html) {
    if (autosaveTimeout) clearTimeout(autosaveTimeout);
    autosaveTimeout = setTimeout(() => {
      persistState({ contentHtml: html });
      if (localSaveStatusEl) {
        localSaveStatusEl.textContent = "Autosaved locally.";
        localSaveStatusEl.className = "status-text";
      }
    }, 800);
  }

  function execCommand(cmd, value = null) {
    editorEl.focus();
    document.execCommand(cmd, false, value);
    updatePreviewAndHtml();
  }

  function wrapSelection(className) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;
    const wrapper = document.createElement("span");
    wrapper.className = className;
    range.surroundContents(wrapper);
    sel.removeAllRanges();
    sel.addRange(range);
    updatePreviewAndHtml();
  }

  function wrapSelectionWithSpan(className, styleObj) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;

    const span = document.createElement("span");
    if (className) span.className = className;
    if (styleObj) {
      Object.keys(styleObj).forEach((k) => {
        span.style[k] = styleObj[k];
      });
    }
    range.surroundContents(span);
    sel.removeAllRanges();
    sel.addRange(range);
    updatePreviewAndHtml();
  }

  function insertHtmlAtCursor(html) {
    editorEl.focus();
    document.execCommand("insertHTML", false, html);
    updatePreviewAndHtml();
  }

  function applyBlock(blockTag) {
    editorEl.focus();
    document.execCommand("formatBlock", false, blockTag.toUpperCase());
    updatePreviewAndHtml();
  }

  function handleToolbarClick(e) {
    const btn = e.target.closest(".tool-btn");
    if (!btn) return;

    const cmd = btn.getAttribute("data-cmd");
    const block = btn.getAttribute("data-block");
    const custom = btn.getAttribute("data-custom");
    const snippet = btn.getAttribute("data-snippet");

    if (cmd) {
      execCommand(cmd);
      return;
    }
    if (block) {
      applyBlock(block);
      return;
    }
    if (custom) {
      switch (custom) {
        case "inlineCode":
          wrapSelection("inline-code");
          break;
        case "codeBlock":
          wrapSelection("code-block");
          break;
        case "checklist":
          insertHtmlAtCursor(`
<ul class="task-list">
  <li><input type="checkbox" /> First task</li>
  <li><input type="checkbox" /> Second task</li>
  <li><input type="checkbox" /> Third task</li>
</ul>`);
          break;
        case "fontSmaller":
          wrapSelectionWithSpan(null, { fontSize: "0.9em" });
          break;
        case "fontLarger":
          wrapSelectionWithSpan(null, { fontSize: "1.2em" });
          break;
        case "undo":
          editorEl.focus();
          document.execCommand("undo");
          updatePreviewAndHtml();
          break;
        case "clear":
          editorEl.innerHTML = "";
          updatePreviewAndHtml();
          break;
      }
      return;
    }
    if (snippet) {
      insertSnippet(snippet);
      return;
    }
  }

  function insertSnippet(kind) {
    switch (kind) {
      case "spacer-sm":
        insertHtmlAtCursor('<div class="spacer-sm"></div>');
        break;
      case "spacer-md":
        insertHtmlAtCursor('<div class="spacer-md"></div>');
        break;
      case "spacer-lg":
        insertHtmlAtCursor('<div class="spacer-lg"></div>');
        break;
      case "box-info":
        insertHtmlAtCursor('<div class="box box-info"><strong>Info:</strong> Replace this with your information.</div>');
        break;
      case "box-warn":
        insertHtmlAtCursor('<div class="box box-warn"><strong>Warning:</strong> Replace this with your warning text.</div>');
        break;
      case "box-success":
        insertHtmlAtCursor('<div class="box box-success"><strong>Success:</strong> Replace this with your confirmation text.</div>');
        break;
      case "box-callout":
        insertHtmlAtCursor('<div class="box box-callout"><strong>Callout:</strong> Highlight your key message here.</div>');
        break;
      case "badge":
        insertHtmlAtCursor('<span class="badge">NEW</span>');
        break;
      case "tag":
        insertHtmlAtCursor('<span class="tag">beta</span>');
        break;
      case "note":
        insertHtmlAtCursor('<div class="note"><strong>Note:</strong> Add a helpful tip or explanation here.</div>');
        break;
      case "table-standard":
        insertHtmlAtCursor(`
<table>
  <thead>
    <tr>
      <th>Column A</th>
      <th>Column B</th>
      <th>Column C</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Row 1</td>
      <td>Value</td>
      <td>Value</td>
    </tr>
    <tr>
      <td>Row 2</td>
      <td>Value</td>
      <td>Value</td>
    </tr>
  </tbody>
</table>`);
        break;
      case "table-compact":
        insertHtmlAtCursor(`
<table class="table-compact">
  <thead>
    <tr>
      <th>Key</th>
      <th>Value</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Label A</td>
      <td>Detail</td>
    </tr>
    <tr>
      <td>Label B</td>
      <td>Detail</td>
    </tr>
  </tbody>
</table>`);
        break;
      case "table-kpi":
        insertHtmlAtCursor(`
<table class="kpi-table">
  <thead>
    <tr>
      <th>Metric</th>
      <th>Current</th>
      <th>Target</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Availability</td>
      <td>99.9%</td>
      <td>99.9%</td>
      <td>✅ On Track</td>
    </tr>
    <tr>
      <td>Response Time</td>
      <td>220 ms</td>
      <td>200 ms</td>
      <td>⚠️ Slightly Above Target</td>
    </tr>
  </tbody>
</table>`);
        break;
      case "table-chart":
        insertHtmlAtCursor(`
<table class="chart-table">
  <thead>
    <tr>
      <th>Month</th>
      <th>Signups</th>
      <th>Churn</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>January</td>
      <td>120</td>
      <td>5%</td>
    </tr>
    <tr>
      <td>February</td>
      <td>140</td>
      <td>4%</td>
    </tr>
  </tbody>
</table>`);
        break;
      case "table-matrix":
        insertHtmlAtCursor(`
<table class="matrix-table">
  <thead>
    <tr>
      <th>Feature</th>
      <th>Plan A</th>
      <th>Plan B</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Custom Templates</td>
      <td>✅</td>
      <td>✅</td>
    </tr>
    <tr>
      <td>JSON Backups</td>
      <td>✅</td>
      <td>⚠️ Limited</td>
    </tr>
  </tbody>
</table>`);
        break;
      case "section-left-border":
        insertHtmlAtCursor('<div class="section-left-border"><p>Left-border section. Replace this text.</p></div>');
        break;
      case "section-top-border":
        insertHtmlAtCursor('<div class="section-top-border"><p>Top-border section. Replace this text.</p></div>');
        break;
      case "section-card":
        insertHtmlAtCursor('<div class="section-card"><h2>Card Section</h2><p>Replace this with your content.</p></div>');
        break;
      case "section-accent":
        insertHtmlAtCursor('<div class="section-accent"><h2>Accent Section</h2><p>Highlight a key theme or group of content here.</p></div>');
        break;
      case "two-column":
        insertHtmlAtCursor(`
<div class="layout-two-column">
  <div>
    <h3>Column A</h3>
    <p>Place your first block of content here.</p>
  </div>
  <div>
    <h3>Column B</h3>
    <p>Place your second block of content here.</p>
  </div>
</div>`);
        break;
      case "timeline":
        insertHtmlAtCursor(`
<div class="timeline">
  <div class="timeline-item">
    <div class="timeline-dot"></div>
    <p><strong>Step 1</strong> · Describe the first event.</p>
  </div>
  <div class="timeline-item">
    <div class="timeline-dot"></div>
    <p><strong>Step 2</strong> · Describe the second event.</p>
  </div>
</div>`);
        break;
      case "feature-grid":
        insertHtmlAtCursor(`
<div class="feature-grid">
  <div class="feature-card">
    <h3>Feature One</h3>
    <p>Brief explanation of the feature.</p>
  </div>
  <div class="feature-card">
    <h3>Feature Two</h3>
    <p>Brief explanation of the feature.</p>
  </div>
</div>`);
        break;
      case "cta-strip":
        insertHtmlAtCursor(`
<div class="cta-strip">
  <span>Ready to take action?</span>
  <span class="badge">Call to Action</span>
</div>`);
        break;
      case "preformatted":
        insertHtmlAtCursor('<pre class="pre-block">Preformatted text block. Paste or type preformatted content here.</pre>');
        break;
      case "divider-label":
        insertHtmlAtCursor('<div class="divider-label"><span>Section</span></div>');
        break;
    }
  }

  function handleEmojiClick(e) {
    const btn = e.target.closest(".emoji-btn");
    if (!btn) return;
    const emoji = btn.getAttribute("data-emoji");
    if (!emoji) return;
    editorEl.focus();
    document.execCommand("insertText", false, emoji);
    updatePreviewAndHtml();
  }

  function handleTextColorChange() {
    const color = textColorSelect.value;
    if (!color) return;
    execCommand("foreColor", color);
    textColorSelect.value = "";
  }

  function handleBgColorChange() {
    const color = bgColorSelect.value;
    if (!color) return;
    execCommand("hiliteColor", color);
    bgColorSelect.value = "";
  }

  function handleLineHeightChange() {
    const mode = lineHeightSelect.value;
    if (!mode) return;
    const cls = mode === "compact" ? "lh-compact" : "lh-relaxed";
    wrapSelection(cls);
    lineHeightSelect.value = "";
  }

  function handleFontChange() {
    const value = fontSelect.value;
    if (!value) return;
    let family;
    switch (value) {
      case "sans":
        family = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        break;
      case "serif":
        family = 'Georgia, "Times New Roman", serif';
        break;
      case "mono":
        family = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
        break;
      case "display":
        family = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        break;
      default:
        family = "";
    }
    if (family) {
      wrapSelectionWithSpan(null, { fontFamily: family });
    }
    fontSelect.value = "";
  }

  function handleCopyHtml(targetEl) {
    const html = htmlOutputEl.value || "";
    const statusTarget = targetEl || copyStatusEl;
    if (!html) {
      showCopyStatus("Nothing to copy yet.", false, statusTarget);
      return;
    }
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      htmlOutputEl.select();
      document.execCommand("copy");
      showCopyStatus("HTML copied to clipboard (fallback).", true, statusTarget);
      return;
    }
    navigator.clipboard
      .writeText(html)
      .then(() => {
        showCopyStatus("HTML copied to clipboard.", true, statusTarget);
      })
      .catch(() => {
        showCopyStatus("Unable to copy HTML.", false, statusTarget);
      });
  }

  function buildStandaloneHtmlDocument() {
    const contentHtml = htmlOutputEl.value || "";
    const title = "Nebula Layout Forge Document";
    const css = `
      :root {
        color-scheme: dark;
      }
      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: radial-gradient(circle at top, #020617 0, #020617 45%, #020617 60%, #020617 100%);
        color: #e5e7eb;
        padding: 3rem 1rem;
        display: flex;
        justify-content: center;
      }
      main.nebula-doc {
        width: 100%;
        max-width: 960px;
        background: linear-gradient(135deg, rgba(15,23,42,0.96), rgba(17,24,39,0.98));
        border-radius: 1.5rem;
        border: 1px solid rgba(148,163,184,0.35);
        box-shadow:
          0 40px 80px rgba(15,23,42,0.9),
          0 0 0 1px rgba(148,163,184,0.15);
        padding: 2.5rem 2.25rem 2.75rem;
      }
      @media (max-width: 640px) {
        main.nebula-doc {
          padding: 1.5rem 1.25rem 2rem;
          border-radius: 1.25rem;
        }
      }
      h1, h2, h3, h4, h5 {
        font-weight: 700;
        letter-spacing: -0.03em;
        color: #f9fafb;
        margin-top: 1.75rem;
        margin-bottom: 0.75rem;
      }
      h1 {
        font-size: clamp(2.25rem, 3vw, 2.75rem);
      }
      h2 {
        font-size: clamp(1.75rem, 2.3vw, 2.1rem);
      }
      h3 {
        font-size: clamp(1.35rem, 1.8vw, 1.5rem);
      }
      h4 {
        font-size: 1.1rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: #a5b4fc;
      }
      p {
        margin: 0.35rem 0 0.75rem;
        line-height: 1.7;
        color: #e5e7eb;
      }
      strong {
        color: #f9fafb;
      }
      a {
        color: #a5b4fc;
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
      ul, ol {
        margin: 0.5rem 0 0.75rem 1.35rem;
        padding-left: 0.75rem;
      }
      li + li {
        margin-top: 0.25rem;
      }
      code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        background-color: rgba(15,23,42,0.85);
        border-radius: 0.4rem;
        padding: 0.1rem 0.4rem;
        font-size: 0.9em;
        border: 1px solid rgba(148,163,184,0.45);
      }
      pre {
        margin: 1rem 0;
        padding: 1rem 1.1rem;
        border-radius: 0.9rem;
        background: radial-gradient(circle at top left, rgba(30,64,175,0.18), rgba(15,23,42,0.95));
        border: 1px solid rgba(79,70,229,0.4);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        font-size: 0.9rem;
        overflow-x: auto;
        color: #e5e7eb;
      }
      blockquote {
        margin: 1.25rem 0;
        padding: 0.9rem 1.4rem;
        border-left: 3px solid #6366f1;
        background: radial-gradient(circle at top left, rgba(79,70,229,0.12), rgba(15,23,42,0.95));
        border-radius: 0.9rem;
        color: #e5e7eb;
        font-style: italic;
      }
      hr {
        border: 0;
        border-top: 1px solid rgba(148,163,184,0.5);
        margin: 1.75rem 0;
      }
      .spacer-sm { margin-top: 0.35rem; }
      .spacer-md { margin-top: 0.9rem; }
      .spacer-lg { margin-top: 1.6rem; }
      .box {
        border-radius: 0.9rem;
        padding: 0.9rem 1rem;
        margin: 0.85rem 0;
        border: 1px solid rgba(148,163,184,0.5);
        background: radial-gradient(circle at top left, rgba(15,23,42,0.9), rgba(15,23,42,1));
      }
      .box-info {
        border-color: rgba(59,130,246,0.7);
        background: radial-gradient(circle at top left, rgba(37,99,235,0.15), rgba(15,23,42,0.98));
      }
      .box-warn {
        border-color: rgba(245,158,11,0.85);
        background: radial-gradient(circle at top left, rgba(245,158,11,0.16), rgba(15,23,42,0.98));
      }
      .box-success {
        border-color: rgba(34,197,94,0.8);
        background: radial-gradient(circle at top left, rgba(34,197,94,0.16), rgba(15,23,42,0.98));
      }
      .box-callout {
        border-color: rgba(168,85,247,0.85);
        background: radial-gradient(circle at top left, rgba(168,85,247,0.16), rgba(15,23,42,0.98));
      }
      .badge,
      .tag,
      .note {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 0.15rem 0.7rem;
        font-size: 0.75rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .badge {
        background: rgba(79,70,229,0.15);
        border: 1px solid rgba(129,140,248,0.6);
        color: #e0e7ff;
      }
      .tag {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        background: rgba(15,23,42,0.95);
        border: 1px solid rgba(148,163,184,0.8);
        color: #e5e7eb;
      }
      .note {
        background: rgba(251,191,36,0.15);
        border: 1px solid rgba(245,158,11,0.7);
        color: #fef3c7;
      }
      .section-left-border {
        border-left: 3px solid rgba(129,140,248,0.9);
        padding-left: 1.1rem;
        margin: 1.2rem 0;
      }
      .section-top-border {
        border-top: 1px solid rgba(148,163,184,0.6);
        padding-top: 0.9rem;
        margin-top: 1.4rem;
      }
      .section-card {
        border-radius: 1rem;
        border: 1px solid rgba(148,163,184,0.6);
        padding: 1.15rem 1.25rem;
        margin: 1.1rem 0;
        background: radial-gradient(circle at top left, rgba(15,23,42,0.9), rgba(15,23,42,1));
      }
      .task-list {
        list-style: none;
        padding-left: 0;
        margin: 0.3rem 0 0.8rem;
      }
      .task-list li {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.25rem 0;
      }
      .task-list input[type="checkbox"] {
        appearance: none;
        width: 0.9rem;
        height: 0.9rem;
        border-radius: 0.25rem;
        border: 1px solid rgba(148,163,184,0.8);
        background: rgba(15,23,42,0.9);
        display: inline-block;
        position: relative;
      }
      .task-list input[type="checkbox"]:checked::after {
        content: "✓";
        position: absolute;
        inset: -0.05rem;
        font-size: 0.8rem;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #bbf7d0;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 1.25rem 0;
        font-size: 0.9rem;
      }
      th,
      td {
        border: 1px solid rgba(148,163,184,0.6);
        padding: 0.55rem 0.6rem;
      }
      th {
        background: radial-gradient(circle at top, rgba(15,23,42,0.95), rgba(15,23,42,1));
        color: #e5e7eb;
        text-align: left;
        font-weight: 600;
      }
      tr:nth-child(even) td {
        background: rgba(15,23,42,0.88);
      }
      .table-compact th,
      .table-compact td {
        padding: 0.35rem 0.45rem;
        font-size: 0.8rem;
      }
      .kpi-table thead th {
        background: radial-gradient(circle at top, rgba(79,70,229,0.4), rgba(15,23,42,1));
      }
      .kpi-table tbody td:first-child {
        font-weight: 600;
        color: #e5e7eb;
      }
      .status-pill {
        border-radius: 999px;
        padding: 0.1rem 0.7rem;
        font-size: 0.75rem;
        font-weight: 500;
      }
      .status-ok {
        background: rgba(22,163,74,0.18);
        color: #bbf7d0;
      }
      .status-warn {
        background: rgba(245,158,11,0.18);
        color: #fed7aa;
      }
      .status-risk {
        background: rgba(239,68,68,0.18);
        color: #fecaca;
      }
      .timeline {
        border-left: 2px solid rgba(148,163,184,0.7);
        margin: 1.2rem 0;
        padding-left: 1.25rem;
      }
      .timeline-item {
        position: relative;
        margin-bottom: 1.15rem;
      }
      .timeline-item::before {
        content: "";
        position: absolute;
        left: -1.43rem;
        top: 0.3rem;
        width: 0.7rem;
        height: 0.7rem;
        border-radius: 999px;
        border: 2px solid rgba(129,140,248,0.9);
        background: #020617;
      }
      .timeline-label {
        font-size: 0.75rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: #a5b4fc;
        margin-bottom: 0.1rem;
      }
      .feature-grid {
        display: grid;
        gap: 0.8rem;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        margin: 1rem 0 0.5rem;
      }
      .feature-card {
        padding: 0.9rem 0.95rem;
        border-radius: 0.9rem;
        border: 1px solid rgba(148,163,184,0.6);
        background: radial-gradient(circle at top left, rgba(79,70,229,0.09), rgba(15,23,42,1));
      }
      .feature-card h3 {
        margin-top: 0;
        margin-bottom: 0.4rem;
      }
      .feature-card p {
        margin: 0;
        font-size: 0.9rem;
        color: #cbd5f5;
      }
    `;
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>${css}</style>
</head>
<body>
  <main class="nebula-doc">
${contentHtml}
  </main>
</body>
</html>`;
  }

  function handleCopyStandaloneHtml(targetEl) {
    const docHtml = buildStandaloneHtmlDocument();
    const statusTarget = targetEl || copyStatusEl;
    if (!docHtml) {
      showCopyStatus("Nothing to copy yet.", false, statusTarget);
      return;
    }
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      htmlOutputEl.value = docHtml;
      htmlOutputEl.select();
      document.execCommand("copy");
      showCopyStatus("Standalone HTML copied (fallback).", true, statusTarget);
      return;
    }
    navigator.clipboard
      .writeText(docHtml)
      .then(() => {
        showCopyStatus("Standalone HTML page copied to clipboard.", true, statusTarget);
      })
      .catch(() => {
        showCopyStatus("Unable to copy standalone HTML.", false, statusTarget);
      });
  }

  function showCopyStatus(msg, success, targetEl) {
    const el = targetEl || copyStatusEl;
    if (!el) return;
    el.textContent = msg;
    el.className = "status-text " + (success ? "success" : "error");
    setTimeout(() => {
      el.textContent = "";
      el.className = "status-text";
    }, 2500);
  }

  function initPresets() {
    presetListEl.innerHTML = "";
    railPresetListEl.innerHTML = "";

    presets.forEach((p, index) => {
      const li = document.createElement("li");
      li.className = "item-row";
      li.innerHTML = `
        <div class="item-row-main">
          <div class="item-row-title">${p.name}</div>
          <div class="item-row-desc">${p.description}</div>
        </div>
        <div class="item-row-actions">
          <button class="btn ghost btn-load-preset" data-id="${p.id}">Load</button>
        </div>
      `;
      presetListEl.appendChild(li);

      if (index < 6) {
        const liRail = document.createElement("li");
        liRail.className = "rail-preset-item";
        liRail.textContent = p.name;
        liRail.setAttribute("data-id", p.id);
        railPresetListEl.appendChild(liRail);
      }
    });

    presetListEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-load-preset");
      if (!btn) return;
      const id = btn.getAttribute("data-id");
      loadPresetById(id, true);
    });

    railPresetListEl.addEventListener("click", (e) => {
      const item = e.target.closest(".rail-preset-item");
      if (!item) return;
      const id = item.getAttribute("data-id");
      loadPresetById(id, true);
    });
  }

  function switchToTab(tabId) {
    navTabs.forEach((b) => b.classList.remove("active"));
    Object.keys(tabPanels).forEach((key) => {
      const panel = tabPanels[key];
      if (!panel) return;
      panel.classList.toggle("active", key === tabId);
      if (key === tabId) {
        const btn = document.querySelector('.nav-tab[data-tab="' + key + '"]');
        if (btn) btn.classList.add("active");
      }
    });
    if (tabId === "html") {
      updatePreviewAndHtml();
    }

  }
  function loadPresetById(id, switchToEditor) {
    const preset = presets.find((x) => x.id === id);
    if (!preset) return;
    editorEl.innerHTML = preset.html.trim();
    updatePreviewAndHtml();
    if (switchToEditor) {
      switchToTab("editor");
    }
  }

  function renderCustomTemplates() {
    const templates = getStoredTemplates();
    customTemplateListEl.innerHTML = "";
    if (!templates.length) {
      const empty = document.createElement("p");
      empty.className = "hint";
      empty.textContent = "No templates saved yet.";
      customTemplateListEl.appendChild(empty);
      return;
    }
    templates.forEach((tpl, index) => {
      const li = document.createElement("li");
      li.className = "item-row";
      li.innerHTML = `
        <div class="item-row-main">
          <div class="item-row-title">${tpl.name || "Untitled Template"}</div>
          <div class="item-row-desc">Saved layout with ${tpl.contentHtml.length} characters.</div>
        </div>
        <div class="item-row-actions">
          <button class="btn ghost btn-use-template" data-index="${index}">Load</button>
          <button class="btn ghost btn-rename-template" data-index="${index}">Rename</button>
          <button class="btn ghost btn-delete-template" data-index="${index}">Delete</button>
        </div>
      `;
      customTemplateListEl.appendChild(li);
    });
  }

  function handleSaveTemplate() {
    const name = (templateNameInput.value || "").trim() || "Custom Template";
    const contentHtml = normalizeHtml(editorEl.innerHTML);
    const theme = getStoredTheme() || defaultTheme;

    let templates = getStoredTemplates();
    if (templates.length >= 5) {
      templates.shift();
    }
    templates.push({
      name,
      contentHtml,
      theme,
      savedAt: new Date().toISOString(),
    });
    saveTemplates(templates);
    persistState({});
    templateNameInput.value = "";
    renderCustomTemplates();
  }

  function handleTemplateListClick(e) {
    const useBtn = e.target.closest(".btn-use-template");
    const renameBtn = e.target.closest(".btn-rename-template");
    const deleteBtn = e.target.closest(".btn-delete-template");
    let templates = getStoredTemplates();

    if (useBtn) {
      const index = parseInt(useBtn.getAttribute("data-index"), 10);
      const tpl = templates[index];
      if (!tpl) return;
      editorEl.innerHTML = tpl.contentHtml || "";
      if (tpl.theme) applyTheme(tpl.theme);
      updatePreviewAndHtml();
      switchToTab("editor");
      return;
    }

    if (renameBtn) {
      const index = parseInt(renameBtn.getAttribute("data-index"), 10);
      const tpl = templates[index];
      if (!tpl) return;
      const newName = prompt("Rename template:", tpl.name || "Custom Template");
      if (!newName) return;
      tpl.name = newName;
      saveTemplates(templates);
      renderCustomTemplates();
      return;
    }

    if (deleteBtn) {
      const index = parseInt(deleteBtn.getAttribute("data-index"), 10);
      templates.splice(index, 1);
      saveTemplates(templates);
      renderCustomTemplates();
      return;
    }
  }

  function handleNavClick(e) {
    const btn = e.target.closest(".nav-tab");
    if (!btn) return;
    const tabId = btn.getAttribute("data-tab");
    switchToTab(tabId);
  }

  function manualSave() {
    const html = normalizeHtml(editorEl.innerHTML);
    persistState({ contentHtml: html });
    if (localSaveStatusEl) {
      localSaveStatusEl.textContent = "Saved current content to local storage.";
      localSaveStatusEl.className = "status-text success";
    }
  }

  function restoreLocal() {
    const state = getInitialState();
    editorEl.innerHTML = state.contentHtml || "";
    applyTheme(state.theme || defaultTheme);
    updatePreviewAndHtml();
    if (localSaveStatusEl) {
      localSaveStatusEl.textContent = "Restored from local save.";
      localSaveStatusEl.className = "status-text success";
    }
  }

  function exportJsonBackup() {
    const templates = getStoredTemplates();
    const theme = getStoredTheme() || defaultTheme;
    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      state: {
        contentHtml: normalizeHtml(editorEl.innerHTML),
        theme,
        templates,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    a.download = `ptlb-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (backupStatusEl) {
      backupStatusEl.textContent = "Backup exported as JSON file.";
      backupStatusEl.className = "status-text success";
    }
  }

  function importJsonBackup(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data !== "object" || !data.state) {
          throw new Error("Invalid backup format.");
        }
        const { contentHtml, theme, templates } = data.state;
        editorEl.innerHTML = contentHtml || "";
        if (theme) applyTheme(Object.assign({}, defaultTheme, theme));
        if (Array.isArray(templates)) {
          saveTemplates(templates);
        }
        persistState({
          contentHtml: contentHtml || "",
          theme: theme || defaultTheme,
        });
        renderCustomTemplates();
        updatePreviewAndHtml();
        if (backupStatusEl) {
          backupStatusEl.textContent = "Backup imported successfully.";
          backupStatusEl.className = "status-text success";
        }
        switchToTab("editor");
      } catch (err) {
        if (backupStatusEl) {
          backupStatusEl.textContent = "Failed to import backup: " + err.message;
          backupStatusEl.className = "status-text error";
        }
      }
    };
    reader.onerror = () => {
      if (backupStatusEl) {
        backupStatusEl.textContent = "Failed to read backup file.";
        backupStatusEl.className = "status-text error";
      }
    };
    reader.readAsText(file);
  }

  function quickBackup() {
    exportJsonBackup();
  }

  function initTheme() {
    const storedTheme = getStoredTheme() || defaultTheme;
    applyTheme(storedTheme);
  }

  function initNav() {
    navTabs.forEach((tab) => {
      tab.addEventListener("click", handleNavClick);
    });
  }

  function initEditor() {
    const state = getInitialState();
    editorEl.innerHTML = state.contentHtml || editorEl.innerHTML;
    updatePreviewAndHtml();
    editorEl.addEventListener("input", () => {
      updatePreviewAndHtml();
    });

    if (backgroundSelect) {
      backgroundSelect.addEventListener("change", (e) => {
        currentLayoutBackground = e.target.value || "none";
        updatePreviewAndHtml();
      });
    }

    const toolbarEl = document.querySelector(".toolbar");
    toolbarEl.addEventListener("click", handleToolbarClick);

    const emojiRow = document.querySelector(".emoji-row");
    emojiRow.addEventListener("click", handleEmojiClick);

    if (textColorSelect) {
      textColorSelect.addEventListener("change", handleTextColorChange);
    }
    if (bgColorSelect) {
      bgColorSelect.addEventListener("change", handleBgColorChange);
    }
    if (lineHeightSelect) {
      lineHeightSelect.addEventListener("change", handleLineHeightChange);
    }
    if (fontSelect) {
      fontSelect.addEventListener("change", handleFontChange);
    }

    const railSnippetsContainer = document.querySelector(".rail-snippets");
    if (railSnippetsContainer) {
      railSnippetsContainer.addEventListener("click", (e) => {
        const btn = e.target.closest(".rail-snippet");
        if (!btn) return;
        const snippet = btn.getAttribute("data-snippet");
        if (!snippet) return;
        insertSnippet(snippet);
      });
    }
  }

  function initFooterYear() {
    if (footerYearEl) {
      footerYearEl.textContent = new Date().getFullYear();
    }
  }

  function initBrandHome() {
    if (brandHome) {
      brandHome.addEventListener("click", () => {
        switchToTab("editor");
      });
    }
  }

  function initDeviceToggle() {
    if (!previewPaneEl || !deviceButtons.length) return;
    function setDevice(mode) {
      previewPaneEl.classList.remove("device-desktop", "device-tablet", "device-mobile");
      previewPaneEl.classList.add("device-" + mode);
      deviceButtons.forEach((btn) => {
        btn.classList.toggle("active", btn.getAttribute("data-device") === mode);
      });
    }
    deviceButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.getAttribute("data-device");
        setDevice(mode);
      });
    });
    setDevice("desktop");
  }

  function attachGlobalHandlers() {
    if (copyHtmlBtn) copyHtmlBtn.addEventListener("click", () => handleCopyHtml(copyStatusEl));
    if (copyHtmlFromEditorBtn) copyHtmlFromEditorBtn.addEventListener("click", () => handleCopyHtml(copyStatusEditorEl));
    if (copyStandaloneHtmlBtn) copyStandaloneHtmlBtn.addEventListener("click", () => handleCopyStandaloneHtml(copyStatusEl));
    if (saveTemplateBtn) saveTemplateBtn.addEventListener("click", handleSaveTemplate);
    if (customTemplateListEl) {
      customTemplateListEl.addEventListener("click", handleTemplateListClick);
    }
    if (manualSaveBtn) manualSaveBtn.addEventListener("click", manualSave);
    if (restoreLocalBtn) restoreLocalBtn.addEventListener("click", restoreLocal);
    if (exportJsonBtn) exportJsonBtn.addEventListener("click", exportJsonBackup);
    if (quickBackupBtn) quickBackupBtn.addEventListener("click", quickBackup);
    if (importJsonInput) {
      importJsonInput.addEventListener("change", () => {
        const file = importJsonInput.files && importJsonInput.files[0];
        if (!file) return;
        importJsonBackup(file);
        importJsonInput.value = "";
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initNav();
    initEditor();
    initPresets();
    renderCustomTemplates();
    attachGlobalHandlers();
    initFooterYear();
    initBrandHome();
    initDeviceToggle();
    switchToTab("editor");
  });
})();