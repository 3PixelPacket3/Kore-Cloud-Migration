(function () {
  function collectBackup() {
    const includeKeys = [
      "infoPages",
      "apps",
      "tasks",
      
      "work",
      "koreProfiles",
      "koreCurrentProfileId",
      "koreProfile",
      "koreProfileAvatar",
      "koreHomeTimeZone",
      "koreHomepageMessage",
      "theme",
      "workConfig",
      "workConfigSimple",
      "koreWorkTypes",
      "koreWorkAccounts",
      "koreHomeShortcuts",
      "koreNotesScratch",
      "koreNotesChecklist",
      "ptlb_app_state_v2",
      "ptlb_app_theme_v2",
      "ptlb_app_templates_v2",
    ];

    const storage = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!includeKeys.includes(key)) continue;
        storage[key] = localStorage.getItem(key);
      }
    } catch (e) {
      // ignore
    }

    const version = typeof window !== "undefined" && window.KORE_VERSION
      ? window.KORE_VERSION
      : "2.2";

    return {
      koreVersion: version,
      createdAt: new Date().toISOString(),
      storage,
    };
  }

  function downloadBackup() {
    const payload = collectBackup();
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    a.download = `kore-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function restoreFromFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const json = JSON.parse(reader.result);
        if (!json || typeof json !== "object" || !json.storage) {
          throw new Error("Invalid backup file");
        }
        const storage = json.storage;

        const modeEl = document.getElementById("restoreModeSelect");
        const includeToolsEl = document.getElementById("restoreIncludeTools");
        const mode = modeEl ? modeEl.value : "merge"; // merge | replace
        const merge = mode !== "replace";
        const includeTools = includeToolsEl ? includeToolsEl.checked : true;

        const arrayKeys = ["infoPages", "apps", "tasks",  "work",
      "koreNotesChecklist",
    ];
        const toolKeys = ["apps", "tasks",  "work", "ptlb_app_state_v2", "ptlb_app_theme_v2", "ptlb_app_templates_v2"];
        const keepCurrentKeys = ["theme", "koreHomeTimeZone", "koreProfile",
      "koreProfileAvatar",
    ];

        Object.keys(storage).forEach((key) => {
          try {
            const val = storage[key];

            // Optionally skip Tools data entirely
            if (!includeTools && toolKeys.includes(key)) {
              return;
            }

            if (!merge) {
              // Replace mode: overwrite everything present in the backup payload
              localStorage.setItem(key, val);
              return;
            }

            // Merge mode
            if (keepCurrentKeys.includes(key)) {
              // Keep local preferences
              return;
            }

            if (arrayKeys.includes(key)) {
              let currentArr = [];
              let backupArr = [];
              try {
                if (key === "work" && window.KoreStore && window.KoreStore.readArray) {
                  currentArr = window.KoreStore.readArray("work");
                } else {
                  currentArr = JSON.parse(localStorage.getItem(key) || "[]") || [];
                }
              } catch (e) {
                currentArr = [];
              }
              try {
                if (key === "work" && window.KoreStore && window.KoreStore.parseArrayFromRaw) {
                  backupArr = window.KoreStore.parseArrayFromRaw(val || "[]");
                } else {
                  backupArr = JSON.parse(val || "[]") || [];
                }
              } catch (e) {
                backupArr = [];
              }
              if (!Array.isArray(currentArr)) currentArr = [];
              if (!Array.isArray(backupArr)) backupArr = [];
              const merged = currentArr.concat(backupArr);
              if (key === "work" && window.KoreStore && window.KoreStore.writeArray) {
                window.KoreStore.writeArray("work", merged);
              } else {
                localStorage.setItem(key, JSON.stringify(merged));
              }
              return;
            }

            // Default: prefer backup value
            localStorage.setItem(key, val);
          } catch (e) {
            // ignore individual key failures
          }
        });
        const status = document.getElementById("settingsStatus");
        if (status) {
          status.textContent = merge
            ? "Backup merged. Reload Kore to apply all changes."
            : "Backup restored (replace). Reload Kore to apply all changes.";
        } else {
          alert(
            merge
              ? "Backup merged. Please reload Kore."
              : "Backup restored. Please reload Kore."
          );
        }

        // Auto-reload to ensure all pages pick up restored storage
        setTimeout(function () { try { window.location.reload(); } catch (e) {} }, 250);
      } catch (e) {
        const status = document.getElementById("settingsStatus");
        if (status) {
          status.textContent =
            "Could not read backup file. Please check that it is a valid Kore backup.";
        } else {
          alert("Could not read backup file.");
        }
      }
    };
    reader.readAsText(file);
  }

  // Clear dynamic content (Apps, Work items, Docs, Info Hub pages) so
  // Kore behaves like a fresh install with no added data. Profile,
  // theme, and timezone settings are preserved.
  function factoryReset() {
    if (
      !confirm(
        "Reset content to factory defaults? This will clear Apps, Work items, Docs, and Info Hub pages for this browser. Your profile and appearance settings will be kept."
      )
    ) {
      return;
    }

    const keysToClear = ["infoPages", "apps", "tasks",  "work", "heroImage"];
    try {
      keysToClear.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // ignore individual failures
        }
      });
    } catch (e) {
      // ignore
    }

    const status = document.getElementById("settingsStatus");
    if (status) {
      status.textContent =
        "Content reset to factory defaults. Reload Kore to see the empty state.";
    } else {
      alert("Content reset to factory defaults. Please reload Kore.");
    }
  }

  // Save-triggered backup helper: called only when the user explicitly
  // clicks a Save/Publish button that wants an external copy.
  function autoBackup() {
    try {
      const payload = collectBackup();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      a.download = `kore-autobackup-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      // auto-backup failures should not block primary save flows
    }
  }

  function wireUi() {
    const dlBtn = document.getElementById("downloadBackupBtn");
    const restoreInput = document.getElementById("restoreBackupInput");
    const resetBtn = document.getElementById("factoryResetBtn");
    const navBackupBtn = document.getElementById("navBackupBtn");

    if (dlBtn) {
      dlBtn.addEventListener("click", function () {
        downloadBackup();
        const status = document.getElementById("settingsStatus");
        if (status) status.textContent = "Backup downloaded.";
      });
    }

    // Navigation backup button (if present) now just routes to Backup page; avoid triggering a second download here.
    // (Download is handled by the primary Save Backup button on the Backup page.)
    if (navBackupBtn) {
      // Intentionally no direct download call to prevent double-downloads.
    }

    if (restoreInput) {
      restoreInput.addEventListener("change", function () {
        const file = restoreInput.files && restoreInput.files[0];
        if (!file) return;
        restoreFromFile(file);
        restoreInput.value = "";
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        factoryReset();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireUi);
  } else {
    wireUi();
  }

  // Make backup helpers available to other modules (Info Hub, Apps, etc.).
  window.KoreBackup = {
    downloadBackup,
    restoreFromFile,
    factoryReset,
    autoBackup,
  };
})();
