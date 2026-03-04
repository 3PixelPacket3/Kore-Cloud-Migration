(function () {
  function esc(s) {
    return String(s || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function setText(el, text) {
    if (el) el.textContent = text || '';
  }

  function currentId() {
    try {
      return localStorage.getItem('koreCurrentProfileId') || '';
    } catch (e) {
      return '';
    }
  }

  function renderList() {
    const list = document.getElementById('profilesList');
    if (!list || !window.KoreProfiles) return;

    const profiles = window.KoreProfiles.getAll();
    const curId = currentId();

    const rows = profiles
      .map((p) => {
        const isCurrent = p.id === curId;
        const roleLabel = p.role === 'owner' ? 'Owner' : 'User';
        const lockLabel = p.pinHash ? 'PIN set' : 'No PIN';
        return `
          <div class="settings-subcard" style="margin-top:0.75rem;">
            <div style="display:flex; justify-content:space-between; gap:0.75rem; flex-wrap:wrap; align-items:center;">
              <div>
                <div style="font-weight:700; font-size:1.05rem;">${esc(p.name)}${isCurrent ? ' (current)' : ''}</div>
                <div class="settings-hint" style="margin-top:0.25rem;">Role: ${esc(roleLabel)} · ${esc(lockLabel)}</div>
              </div>
              <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                <button type="button" class="secondary-btn" data-action="switch" data-id="${esc(p.id)}" ${isCurrent ? 'disabled' : ''}>Switch</button>
                <button type="button" class="danger-btn" data-action="delete" data-id="${esc(p.id)}" ${p.role === 'owner' ? 'disabled' : ''}>Delete</button>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    list.innerHTML = rows || `<p class="settings-hint">No profiles found.</p>`;

    list.querySelectorAll('[data-action="switch"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        try {
          // If target has PIN, prompt for it.
          const target = window.KoreProfiles.getAll().find((x) => x.id === id);
          let pin = '';
          if (target && target.pinHash) {
            const v = prompt(`Enter PIN for ${target.name}:`);
            if (v === null) return;
            pin = v;
          }
          await window.KoreProfiles.switchTo(id, pin);
          location.reload();
        } catch (e) {
          alert(e && e.message ? e.message : 'Unable to switch profiles.');
        }
      });
    });

    list.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const target = window.KoreProfiles.getAll().find((x) => x.id === id);
        if (!target) return;
        const ok = confirm(`Delete profile "${target.name}"? This only removes the local profile record.\n\nNote: Your content (Info Hub pages, apps, work, docs) is stored separately and will remain unless you clear it.`);
        if (!ok) return;
        try {
          window.KoreProfiles.delete(id);
          renderList();
        } catch (e) {
          alert(e && e.message ? e.message : 'Unable to delete profile.');
        }
      });
    });
  }

  function wireCreate() {
    const nameInput = document.getElementById('newProfileName');
    const btn = document.getElementById('createProfileBtn');
    const status = document.getElementById('createProfileStatus');
    if (!btn || !nameInput || !status || !window.KoreProfiles) return;

    btn.addEventListener('click', async () => {
      const name = String(nameInput.value || '').trim();
      if (!name) {
        setText(status, 'Please enter a profile name.');
        return;
      }
      try {
        await window.KoreProfiles.create(name, 'user');
        nameInput.value = '';
        setText(status, 'Profile created. Use Switch to activate it.');
        renderList();
      } catch (e) {
        setText(status, e && e.message ? e.message : 'Unable to create profile.');
      }
    });
  }

  function wirePin() {
    const pinInput = document.getElementById('pinInput');
    const btn = document.getElementById('savePinBtn');
    const status = document.getElementById('pinStatus');
    if (!pinInput || !btn || !status || !window.KoreProfiles) return;

    btn.addEventListener('click', async () => {
      const cur = window.KoreProfiles.getCurrent();
      const pin = String(pinInput.value || '').trim();
      try {
        await window.KoreProfiles.setPin(cur.id, pin);
        pinInput.value = '';
        setText(status, pin ? 'PIN saved.' : 'PIN removed.');
        renderList();
      } catch (e) {
        setText(status, e && e.message ? e.message : 'Unable to update PIN.');
      }
    });
  }

  function init() {
    if (!window.KoreProfiles) return;
    wireCreate();
    wirePin();
    renderList();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
