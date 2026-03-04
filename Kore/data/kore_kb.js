/*
  Kore Offline Assistant Knowledge Base
  ------------------------------------------------
  Deterministic, offline dataset used by js/ai.js.

  This file is safe to edit as Kore grows.
*/
(function () {
  const KB_PAGES = [
    {
      id: "home",
      title: "Home",
      page: "index.html",
      tags: ["home", "dashboard", "clock", "date", "hero", "image", "shortcuts"],
      summary: "The Home page is the landing view for Kore. It shows the hero image, live clock and date, and your main shortcut buttons for Apps & Tools, Work Queue, and Docs Library. The time zone is controlled from Settings, not from the Home page itself."
    },
    {
      id: "apps",
      title: "Apps & Tools Hub",
      page: "apps.html",
      tags: ["apps", "applications", "shortcuts", "icons", "links", "tools", "external"],
      summary: "The Apps & Tools Hub is a grid of external shortcuts. Each tile can have a name, description, and URL, and tiles are stored locally in your browser so you can customize them for your own workflow."
    },
    {
      id: "work",
      title: "Work Tracker",
      page: "work.html",
      tags: ["work", "tracker", "tasks", "queue", "requests", "status", "priority", "export", "csv"],
      summary: "Work Tracker is your local work queue. You can add new requests, track status and priority, record due dates and notes, and export all items to CSV. The Data / Reports page reads from this Work dataset for charts and summaries."
    },
    {
      id: "work-new",
      title: "New Work Request",
      page: "work-new.html",
      tags: ["work", "new request", "form"],
      summary: "The New Work Request page gives you a full-screen form to create a new work item without using a modal. When you save, the item is stored in local Work Tracker data and you are returned to the main Work page."
    },
    {
      id: "docs",
      title: "Docs Library",
      page: "docs.html",
      tags: ["docs", "documents", "upload", "library", "files", "reference"],
      summary: "Docs Library is a local index of reference documents and links. You can store titles, categories, and paths or URLs for quick access, with basic sorting and filtering controls."
    },
    {
      id: "info-hub",
      title: "Info Hub Index",
      page: "info-hub.html",
      tags: ["info hub", "guides", "how-to", "index"],
      summary: "Info Hub is the central index of your own guides and reference pages. You can create pages from a template, tag them, and later search or open them from the index and navigation dropdown."
    },
    {
      id: "settings",
      title: "Settings",
      page: "settings.html",
      tags: ["settings", "profiles", "time zone", "owner", "restore", "backup"],
      summary: "Settings controls profiles, time zone, restore mode, Owner Tools, homepage message, and configurable Home shortcut buttons. Changes are stored locally and affect how Kore behaves on all other pages."
    },
    {
      id: "profiles",
      title: "Profiles",
      page: "profiles.html",
      tags: ["profiles", "user profile", "avatar"],
      summary: "Profiles let you define and choose a current profile, including display name and avatar. The active profile name and picture appear in the top-right of the navigation bar."
    },
    {
      id: "passwords",
      title: "Password Tools",
      page: "passwords.html",
      tags: ["password", "generator", "security", "offline"],
      summary: "Password Tools provides an offline password generator. It can create strong random passwords locally in your browser. If you choose to store any entries, they are stored only in local browser storage."
    },
    {
      id: "reports",
      title: "Data / Reports",
      page: "reports.html",
      tags: ["reports", "charts", "metrics", "work analytics"],
      summary: "Data / Reports reads Work Tracker items and shows counts, status and priority charts, and breakdowns by type and account. You can export both the raw items and a summary to CSV."
    },
    {
      id: "about",
      title: "About Kore",
      page: "about.html",
      tags: ["about", "kore", "version", "credits"],
      summary: "The About page explains what Kore is, the current version, and the fact that it runs fully offline using local browser storage. It also credits Joshua M. Smolak as the creator and explains that AI assisted with the tooling."
    }
  ];

  const KB_FAQ = [
    {
      q: ["What do I do?", "Where do I start?", "How do I get started?", "Help me get started"],
      a: "Start on the Home page: it shows your clock, date, hero image, and shortcut buttons. From there, open Work Tracker to see or add requests, Docs Library for reference files, and Info Hub for your own guides. Use Settings to tune profiles, time zone, and Home buttons so Kore matches how you work day to day."
    },
    {
      q: ["How do I back up Kore?", "Backup", "Save backup"],
      a: "Use Save Backup (top-right) or Settings > Backup & Restore to download a JSON file. Keep that file safe. Backups include your Work items, Docs entries, Apps tiles, Info Hub pages, profiles, and key settings."
    },
    {
      q: ["How do I restore a backup?", "Restore", "Import backup"],
      a: "Go to Settings > Backup & Restore. Choose Merge (recommended) or Replace. Then select your Kore backup JSON file. Kore will reload to apply restored data. If you do not see changes, refresh the page or reopen index.html."
    },
    {
      q: ["How do I add an app tile?", "Add app", "Apps hub"],
      a: "Open Apps & Tools (apps.html). Use the Add / Customize options to create a tile with a name and URL. Tiles are saved locally in your browser and will be included in backups."
    },
    {
      q: ["How do I add a work request?", "Add work request", "Work Tracker"],
      a: "Open Work Tracker (work.html) and click Add Request. Fill out Title, Type, Account, Priority, Status, and Due Date, then Save. The item is stored locally and shows up in Reports."
    },
    {
      q: ["How do I export my work items?", "Export CSV", "Work Tracker export"],
      a: "On Work Tracker, use Export CSV to download your work items as a CSV. On Reports, you can also export summary CSV files depending on the report."
    },
    {
      q: ["How do I change Request Types or Accounts?", "Work options", "Request types", "Accounts list"],
      a: "Go to Settings and find the Work Tracker options section. Update the Request Types and Accounts lists, then Save. Refresh the Work pages to see the new lists."
    },
    {
      q: ["What are Kore system requirements?", "System requirements", "Requirements"],
      a: "Kore runs fully offline. You need a modern browser that supports localStorage (Chrome or Edge recommended). You should keep Kore in a writable folder and allow file downloads for backups and CSV exports. For best compatibility, run Kore from a simple local web server, but file-open mode also works."
    },
    {
      q: ["Is Password Tools secure?", "Password storage", "Security"],
      a: "The password generator is safe because it generates locally. If you store passwords, they are saved in your browser localStorage, which is not encrypted. For high security, use the generator and store passwords in a dedicated password manager instead of saving them in Kore."
    },
    {
      q: ["Ask Kore is not working", "AI not working", "Dataset missing"],
      a: "Ask Kore relies on the offline dataset file data/kore_kb.js. Make sure the data folder exists next to your HTML files and that kore_kb.js is not renamed. Hard refresh (Ctrl+Shift+R) and confirm you opened Kore from the latest Kore folder."
    },
    {
      q: "What is Kore?",
      a: "Kore is an offline personal work and knowledge system. It keeps a Work Tracker, Apps & Tools shortcuts, Docs Library, Info Hub guides, and helper tools like Password Tools and simple reports, all running locally in your browser without any server."
    },
    {
      q: "How do I add a new work request?",
      a: "Open the Work Tracker page and click Add Request, or use the New Work Request page. Fill in the title, request type, account, priority, status, and due date, then save. The new item is stored in your local work queue and will appear in Data / Reports."
    },
    {
      q: "Why does the AI say the dataset is missing?",
      a: "That message appears if the offline knowledge base file data/kore_kb.js fails to load. Make sure the file exists, is in a folder named data next to your HTML files, and is not renamed. Also make sure you open Kore from the current Kore folder."
    },
    {
      q: "How do I change the time zone used on the Home clock?",
      a: "Go to Settings and look for Time & Locale. Choose your preferred time zone and save. The change is stored locally, and the Home page clock will use that time zone the next time it updates."
    },
    {
      q: "Where does Kore store my data?",
      a: "Kore stores everything in your browser's localStorage. That includes Work Tracker items, Docs Library entries, Info Hub pages, settings, and shortcuts. Use the Backup button to download a JSON file, and Restore to load it into a new browser or machine."
    },
    {
      q: "How do I customize the Home buttons for Apps, Work, and Docs?",
      a: "Use the Settings page. In the Home Shortcuts section, you can change the labels and targets for the three main Home buttons. Save the shortcuts, then visit the Home page to see the updated buttons."
    },
    {
      q: "How do I back up Kore?",
      a: "Click Save Backup in the top-right navigation. Kore creates a JSON file containing your profiles, settings, work items, docs, Info Hub pages, and tools data. Keep that file safe. To restore, use the Restore section in Settings and choose the backup file."
    }
  ];

  const CHAT_TONE = {
    style: "calm and practical",
    notes: "Focus on short, direct answers that map to specific Kore pages or controls whenever possible.",
    openers: [
      "Here is how Kore handles that:",
      "Let me walk through that in Kore:",
      "Here is the Kore view:",
      "In Kore, you would do it like this:"
    ],
    followUps: [
      "If that does not match what you see, check your Settings page and active profile.",
      "You can also create an Info Hub guide for this so you have your own notes.",
      "Once you try that, the Work Tracker and Reports will update automatically.",
      "If you want, you can pin a shortcut on the Home page for faster access next time."
    ],
    notFound: [
      "Here is a simple way to get oriented in Kore:",
      "Here is a safe starting point inside Kore:",
      "Here is how you can get moving in Kore, even if you are not sure what to click first:"
    ]
  };

  window.KORE_ASSISTANT_KB = {
    version: "3.5",
    pages: KB_PAGES,
    faq: KB_FAQ,
    tone: CHAT_TONE
  };
})();
