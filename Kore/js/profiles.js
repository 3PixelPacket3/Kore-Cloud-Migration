(function () {
  const STORAGE_KEY = 'koreProfile';

  function loadProfile() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          // Ensure required fields exist
          return {
            name: parsed.name || 'User',
            role: parsed.role || 'user'
          };
        }
      }
    } catch (e) {
      // ignore and fall through to default
    }
    // Default single profile with full permissions
    return { name: 'User', role: 'user' };
  }

  function saveProfile(profile) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        name: profile.name || 'User',
        role: profile.role || 'user'
      }));
    } catch (e) {
      // ignore
    }
  }

  function syncNav(profile) {
    const navNameEl = document.getElementById('navCurrentProfileName');
    if (navNameEl && profile) {
      navNameEl.textContent = profile.name || 'User';
    }

    const avatarImg = document.getElementById('navProfileAvatar');
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
  }

  function applyThemeFromStorage() {
    // Use koreUiStyle (new global theme key). Keep backward compatibility with legacy 'theme'.
    let style = 'dark';
    try {
      const stored = localStorage.getItem('koreUiStyle');
      if (stored) {
        style = stored;
      } else {
        const legacy = localStorage.getItem('theme');
        if (legacy === 'light' || legacy === 'dark') {
          style = legacy;
          localStorage.setItem('koreUiStyle', style);
        }
      }
    } catch (e) {
      style = 'dark';
    }

    const allowed = ['dark', 'light', 'slate', 'terminal', 'aurora'];
    if (allowed.indexOf(style) === -1) style = 'dark';

    document.body.dataset.theme = style;
  }

  function wireNavBackupButton() {
    const btn = document.getElementById('navBackupBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (window.KoreBackup && typeof window.KoreBackup.downloadBackup === 'function') {
        window.KoreBackup.downloadBackup();
      }
    });
  }

  function initSingleProfile() {
    applyThemeFromStorage();
    const profile = loadProfile();
    syncNav(profile);
    wireNavBackupButton();

    // Expose a very small API for settings.js and any future code
    window.KoreProfiles = {
      getCurrent() {
        return loadProfile();
      },
      renameCurrent(newName) {
        const trimmed = (newName || '').trim();
        if (!trimmed) return loadProfile();
        const updated = { ...loadProfile(), name: trimmed };
        saveProfile(updated);
        syncNav(updated);
        return updated;
      },
      // Offline single-user mode: treat this profile as having all permissions
      isOwner() {
        return true;
      },
      // Legacy helpers kept as no-ops for compatibility with older pages
      getAll() {
        return [loadProfile()];
      },
      async create() {
        // Single-profile mode: just return the existing profile
        return loadProfile();
      },
      async switchTo() {
        // Single-profile mode: nothing to switch
        return loadProfile();
      },
      delete() {
        // Do nothing; we always keep one profile
      },
      async setPin() {
        // Pins are not used in single-profile mode
        return loadProfile();
      }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSingleProfile);
  } else {
    initSingleProfile();
  }
})();
