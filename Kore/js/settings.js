(function () {
  function initSettings() {
    const profileInfo = document.getElementById('settingsProfileInfo');
    const renameBtn = document.getElementById('renameProfileBtn');
    const ownerSection = document.getElementById('owner-tools');
    const statusEl = document.getElementById('settingsStatus');

    const toastEl = document.getElementById('settingsToast');
    let toastTimer = null;

    function showSettingsToast(message) {
      if (!message) return;

      if (toastEl) {
        toastEl.textContent = message;
        toastEl.classList.add('settings-toast--visible');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
          toastEl.classList.remove('settings-toast--visible');
        }, 2600);
      }

      if (window.koreToast) { koreToast(message); }
      if (statusEl) { statusEl.textContent = message; }
    }


    // Time & Locale: time zone selector
    const tzSelect = document.getElementById('timeZoneSelect');
    if (tzSelect) {
      try {
        const storedTz = localStorage.getItem('koreHomeTimeZone');
        if (storedTz) {
          tzSelect.value = storedTz;
        }
      } catch (e) {
        // ignore
      }

      tzSelect.addEventListener('change', function () {
        const tz = tzSelect.value;
        try {
          localStorage.setItem('koreHomeTimeZone', tz);
        } catch (e) {
          // ignore
        }
        if (window.koreToast) { koreToast('Time zone updated. The Home clock will use this on next refresh.'); }
      if (statusEl) { statusEl.textContent = 'Time zone updated. The Home clock will use this on next refresh.'; }
      });
    }


    const profilesApi = window.KoreProfiles;
    if (profilesApi && profileInfo) {
      const cur = profilesApi.getCurrent();
      profileInfo.textContent = `${cur.name || 'Profile'} (${cur.role || 'user'})`;
      if (!profilesApi.isOwner() && ownerSection) {
        ownerSection.style.display = 'none';
      }
    } else if (ownerSection) {
      ownerSection.style.display = 'none';
    }

    if (renameBtn && profilesApi) {
      renameBtn.addEventListener('click', function () {
        const cur = profilesApi.getCurrent();
        const currentName = (cur && cur.name) || 'Profile';
        const next = prompt('New name for this profile:', currentName);
        if (!next) return;
        const updated = profilesApi.renameCurrent(next);
        if (updated && profileInfo) {
          profileInfo.textContent = `${updated.name} (${updated.role || 'user'})`;
        }
              if (window.koreToast) { koreToast('Profile name updated.'); }
      else if (window.koreToast) { koreToast('Profile name updated.'); }
      if (statusEl) { statusEl.textContent = 'Profile name updated.'; }
      });
    }

    // Theme toggle (dark/light)
    const toggleThemeBtn = document.getElementById('toggleThemeBtn');
    if (toggleThemeBtn) {
      toggleThemeBtn.addEventListener('click', function () {
        const currentTheme = (document.body.dataset.theme || 'dark');
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.dataset.theme = nextTheme;
        try {
          localStorage.setItem('theme', nextTheme);
        } catch (e) {
          // ignore
        }
              if (window.koreToast) { koreToast('Theme updated.'); }
      else if (window.koreToast) { koreToast('Theme updated.'); }
      if (statusEl) { statusEl.textContent = 'Theme updated.'; }
      });
    }

    // Apply persisted theme on load
    try {
      const savedTheme = localStorage.getItem('theme');
      document.body.dataset.theme = savedTheme || 'dark';
    } catch (e) {
      // ignore
    }

    
    // Profile avatar wiring
    const avatarImg = document.getElementById('settingsProfileAvatar');
    const avatarInput = document.getElementById('profilePhotoInput');
    const clearAvatarBtn = document.getElementById('clearProfilePhotoBtn');

    if (avatarImg) {
      try {
        const stored = localStorage.getItem('koreProfileAvatar');
        if (stored) {
          avatarImg.src = stored;
        } else {
          avatarImg.removeAttribute('src');
        }
      } catch (e) {
        avatarImg.removeAttribute('src');
      }
    }

    if (avatarInput) {
      avatarInput.addEventListener('change', function () {
        const file = avatarInput.files && avatarInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function () {
          const dataUrl = reader.result;
          try {
            localStorage.setItem('koreProfileAvatar', dataUrl);
          } catch (e) {
            // ignore
          }
          if (avatarImg) avatarImg.src = dataUrl;
          // Also update nav avatar immediately
          const navAvatar = document.getElementById('navProfileAvatar');
          if (navAvatar) navAvatar.src = dataUrl;
        };
        reader.readAsDataURL(file);
      });
    }

    if (clearAvatarBtn) {
      clearAvatarBtn.addEventListener('click', function () {
        try {
          localStorage.removeItem('koreProfileAvatar');
        } catch (e) {
          // ignore
        }
        if (avatarImg) avatarImg.removeAttribute('src');
        const navAvatar = document.getElementById('navProfileAvatar');
        if (navAvatar) navAvatar.removeAttribute('src');
      });
    }


    // Homepage message wiring (owner only)
    const homeInput = document.getElementById('homeMessageInput');
    const saveHomeBtn = document.getElementById('saveHomeMessageBtn');
    if (homeInput) {
      try {
        const current = localStorage.getItem('koreHomepageMessage') || '';
        if (current) homeInput.value = current;
      } catch (e) {
        // ignore
      }
    }
    if (saveHomeBtn && homeInput) {
      saveHomeBtn.addEventListener('click', function () {
        try {
          localStorage.setItem('koreHomepageMessage', homeInput.value || '');
        } catch (e) {
          // ignore
        }
        showSettingsToast('Homepage message saved. Opening Home...');
        setTimeout(function(){ try { window.location.href = 'index.html'; } catch(e) {} }, 650);
      });
    }

    // Work Tracker options (Request Type & Account dropdowns)
    const typeOptionsEl = document.getElementById('workTypeOptions');
    const accountOptionsEl = document.getElementById('workAccountOptions');
    const saveWorkOptionsBtn = document.getElementById('saveWorkOptionsBtn');


    // Home shortcuts wiring
    const appsLabelInput = document.getElementById('homeAppsLabel');
    const appsHrefInput = document.getElementById('homeAppsHref');
    const workLabelInput = document.getElementById('homeWorkLabel');
    const workHrefInput = document.getElementById('homeWorkHref');
    const docsLabelInput = document.getElementById('homeDocsLabel');
    const docsHrefInput = document.getElementById('homeDocsHref');
    const saveHomeShortcutsBtn = document.getElementById('saveHomeShortcutsBtn');

    const HOME_SHORTCUTS_KEY = 'koreHomeShortcuts';

    function loadHomeShortcuts() {
      const defaults = {
        apps: { label: 'Apps & Tools', href: 'apps.html' },
        work: { label: 'Work Queue', href: 'work.html' },
        docs: { label: 'Docs Library', href: 'docs.html' },
      };
      try {
        const raw = localStorage.getItem(HOME_SHORTCUTS_KEY);
        if (!raw) return defaults;
        const parsed = JSON.parse(raw);
        return {
          apps: Object.assign({}, defaults.apps, parsed.apps || {}),
          work: Object.assign({}, defaults.work, parsed.work || {}),
          docs: Object.assign({}, defaults.docs, parsed.docs || {}),
        };
      } catch (e) {
        return defaults;
      }
    }

    function saveHomeShortcuts(cfg) {
      try {
        localStorage.setItem(HOME_SHORTCUTS_KEY, JSON.stringify(cfg));
      } catch (e) {
        // ignore
      }
    }

    if (
      appsLabelInput && appsHrefInput &&
      workLabelInput && workHrefInput &&
      docsLabelInput && docsHrefInput
    ) {
      const current = loadHomeShortcuts();
      appsLabelInput.value = current.apps.label;
      appsHrefInput.value = current.apps.href;
      workLabelInput.value = current.work.label;
      workHrefInput.value = current.work.href;
      docsLabelInput.value = current.docs.label;
      docsHrefInput.value = current.docs.href;

      if (saveHomeShortcutsBtn) {
        saveHomeShortcutsBtn.addEventListener('click', function () {
          const updated = {
            apps: {
              label: appsLabelInput.value.trim() || 'Apps & Tools',
              href: appsHrefInput.value.trim() || 'apps.html',
            },
            work: {
              label: workLabelInput.value.trim() || 'Work Queue',
              href: workHrefInput.value.trim() || 'work.html',
            },
            docs: {
              label: docsLabelInput.value.trim() || 'Docs Library',
              href: docsHrefInput.value.trim() || 'docs.html',
            },
          };
          saveHomeShortcuts(updated);
                if (window.koreToast) { koreToast('Home shortcuts saved. Refresh the Home tab to see changes.'); }
      else if (window.koreToast) { koreToast('Home shortcuts saved. Refresh the Home tab to see changes.'); }
      if (statusEl) { statusEl.textContent = 'Home shortcuts saved. Refresh the Home tab to see changes.'; }
        });
      }
    }

    function loadWorkConfig() {
      const defaults = {
        types: [
          'Content Change',
          'New Page',
          'Bug Fix',
          'Access Issue',
          'General IT',
        ],
        accounts: [
          'General',
          'Internal',
          'External',
        ],
      };

      try {
        const raw = localStorage.getItem('workConfig');
        if (!raw) return defaults;
        const parsed = JSON.parse(raw);
        const types = Array.isArray(parsed.types) ? parsed.types.filter(Boolean) : [];
        const accounts = Array.isArray(parsed.accounts) ? parsed.accounts.filter(Boolean) : [];
        return {
          types: types.length ? types : defaults.types,
          accounts: accounts.length ? accounts : defaults.accounts,
        };
      } catch (e) {
        return defaults;
      }
    }

    function persistWorkConfig(cfg) {
      try {
        localStorage.setItem('workConfig', JSON.stringify(cfg));
      } catch (e) {
        // ignore
      }
    }

    if (typeOptionsEl && accountOptionsEl) {
      const cfg = loadWorkConfig();
      typeOptionsEl.value = (cfg.types || []).join('\n');
      accountOptionsEl.value = (cfg.accounts || []).join('\n');
    }

    if (saveWorkOptionsBtn && typeOptionsEl && accountOptionsEl) {
      saveWorkOptionsBtn.addEventListener('click', function () {
        const types = typeOptionsEl.value
          .split(/\\r?\\n/)
          .map(function (s) { return s.trim(); })
          .filter(function (s) { return s.length > 0; });
        const accounts = accountOptionsEl.value
          .split(/\\r?\\n/)
          .map(function (s) { return s.trim(); })
          .filter(function (s) { return s.length > 0; });

        const cfg = {
          types: types.length ? types : undefined,
          accounts: accounts.length ? accounts : undefined,
        };

        const merged = loadWorkConfig();
        if (cfg.types) merged.types = cfg.types;
        if (cfg.accounts) merged.accounts = cfg.accounts;

        persistWorkConfig(merged);
              if (window.koreToast) { koreToast('Work Tracker options saved. Refresh the Work tab to see changes.'); }
      else if (window.koreToast) { koreToast('Work Tracker options saved. Refresh the Work tab to see changes.'); }
      if (statusEl) { statusEl.textContent = 'Work Tracker options saved. Refresh the Work tab to see changes.'; }
      });
    }

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSettings);
  } else {
    initSettings();
  }
})();


// ------------------------
// Appearance: Default UI Theme (dropdown + Apply)
// ------------------------
(function initThemeAppearanceSettings() {
  function applyTheme(themeValue) {
    if (!themeValue) return;
    document.body.dataset.theme = themeValue;
    try {
      // Save under both keys so older backups/settings remain compatible
      localStorage.setItem('theme', themeValue);
      localStorage.setItem('koreUiStyle', themeValue);
    } catch (e) {
      // ignore storage errors
    }
  }

  function init() {
    var select = document.getElementById('uiThemeSelect');
    var applyBtn = document.getElementById('applyThemeBtn');
    var label = document.getElementById('currentThemeLabel');
    var statusEl = document.getElementById('settingsStatus');

    if (!select || !applyBtn) return;

    // On load, sync select with saved theme or current body theme
    var saved = null;
    try {
      saved = localStorage.getItem('theme');
    } catch (e) {
      saved = null;
    }
    var initial = saved || (document.body.dataset.theme || select.value);

    // If the saved/initial value exists in the dropdown, select it
    var hasInitial = false;
    for (var i = 0; i < select.options.length; i++) {
      if (select.options[i].value === initial) {
        hasInitial = true;
        break;
      }
    }
    if (hasInitial) {
      select.value = initial;
    } else {
      initial = select.value;
    }

    applyTheme(initial);

    if (label) {
      var selectedText = select.options[select.selectedIndex].textContent || '';
      label.innerHTML = '<strong>Current:</strong> ' + selectedText;
    }

    applyBtn.addEventListener('click', function () {
      var value = select.value;
      applyTheme(value);

      if (label) {
        var txt = select.options[select.selectedIndex].textContent || '';
        label.innerHTML = '<strong>Current:</strong> ' + txt;
      }
      if (window.koreToast) { koreToast('Theme updated.'); }
      if (statusEl) { statusEl.textContent = 'Theme updated.'; }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

