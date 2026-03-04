(function () {
  function parseLines(text) {
    if (!text) return [];
    return String(text)
      .split(/[\r\n,]+/)
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length > 0; });
  }

  function initWorkOptions() {
    var typesArea = document.getElementById('workTypeOptions');
    var accountsArea = document.getElementById('workAccountOptions');
    var saveBtn = document.getElementById('saveWorkOptionsBtn');
    var statusEl = document.getElementById('settingsStatus');

    // Prefill from simple stored values, if present
    try {
      if (typesArea) {
        var storedTypes = JSON.parse(localStorage.getItem('koreWorkTypes') || '[]');
        if (Array.isArray(storedTypes) && storedTypes.length) {
          typesArea.value = storedTypes.join('\n');
        }
      }
    } catch (e) {
      // ignore
    }

    try {
      if (accountsArea) {
        var storedAccounts = JSON.parse(localStorage.getItem('koreWorkAccounts') || '[]');
        if (Array.isArray(storedAccounts) && storedAccounts.length) {
          accountsArea.value = storedAccounts.join('\n');
        }
      }
    } catch (e) {
      // ignore
    }

    if (!saveBtn || !typesArea || !accountsArea) return;

    saveBtn.addEventListener('click', function () {
      var types = parseLines(typesArea.value);
      var accounts = parseLines(accountsArea.value);

      try {
        localStorage.setItem('koreWorkTypes', JSON.stringify(types));
        localStorage.setItem('koreWorkAccounts', JSON.stringify(accounts));
        // Also provide a simple combined config other scripts can use
        localStorage.setItem('workConfigSimple', JSON.stringify({ types: types, accounts: accounts }));
      } catch (e) {
        // ignore storage errors
      }

      if (window.koreToast) { koreToast('Work Tracker options saved. Work dropdowns will use these values.'); }
      if (statusEl) { statusEl.textContent = 'Work Tracker options saved. Work dropdowns will use these values.'; }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWorkOptions);
  } else {
    initWorkOptions();
  }
})();
