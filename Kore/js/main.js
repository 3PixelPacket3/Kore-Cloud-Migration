// Kore Main Script (Home, Apps, Docs, Work)
// ----------------------------------------

// ------------------------
// Home Page: Clock, Date, Time Zone, Homepage Message
// ------------------------
(function initHomeWidgets() {
  const clockEl = document.getElementById('clock');
  const dateEl = document.getElementById('date');
  const tzSelect = document.getElementById('timeZoneSelect');
  const homeMsgEl = document.getElementById('homeMessage');

  // Initialise time zone from storage or browser defaults
  try {
    const storedTz = localStorage.getItem('koreHomeTimeZone');
    if (storedTz) {
      window.KORE_TIME_ZONE = storedTz;
    }
  } catch (e) {
    // ignore
  }

  function getTimeZone() {
    if (window.KORE_TIME_ZONE) return window.KORE_TIME_ZONE;
    try {
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (browserTz) {
        window.KORE_TIME_ZONE = browserTz;
        return browserTz;
      }
    } catch (e) {
      // ignore
    }
    return 'America/New_York';
  }

  function tick() {
    const tz = getTimeZone();
    const now = new Date();

    if (clockEl) {
      const timeStr = now.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: tz
      });
      clockEl.textContent = timeStr;
    }

    if (dateEl) {
      const dateStr = now.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: tz
      });
      dateEl.textContent = dateStr;
    }
  }

  if (clockEl || dateEl) {
    tick();
    setInterval(tick, 1000);
  }

  // Load homepage message (HTML allowed)
  if (homeMsgEl) {
    const stored = localStorage.getItem('koreHomepageMessage');
    if (stored) {
      homeMsgEl.innerHTML = stored;
    }
  }

  // Time zone selector persists to localStorage
  if (tzSelect) {
    // Reflect stored or detected time zone in the control
    const activeTz = getTimeZone();
    if (activeTz) {
      for (const opt of tzSelect.options) {
        if (opt.value === activeTz) {
          tzSelect.value = activeTz;
          break;
        }
      }
    }

    tzSelect.addEventListener('change', () => {
      const tz = tzSelect.value;
      window.KORE_TIME_ZONE = tz;
      try {
        localStorage.setItem('koreHomeTimeZone', tz);
      } catch (e) {
        // ignore
      }
      tick();
    });
  }

  // Home quick action buttons
  const searchBtn = document.getElementById('homeSearchBtn');
  const emailBtn = document.getElementById('homeEmailBtn');
  const appsBtn = document.getElementById('homeAppsBtn');
  const workBtn = document.getElementById('homeWorkBtn');
  const docsBtn = document.getElementById('homeDocsBtn');
  // Load customizable home shortcuts (labels + targets) if configured in Settings
  function loadHomeShortcutsConfig() {
    const defaults = {
      apps: { label: 'Apps & Tools', href: 'apps.html' },
      work: { label: 'Work Queue', href: 'work.html' },
      docs: { label: 'Docs Library', href: 'docs.html' }
    };
    try {
      const raw = localStorage.getItem('koreHomeShortcuts');
      if (!raw) return defaults;
      const parsed = JSON.parse(raw);
      return {
        apps: Object.assign({}, defaults.apps, parsed.apps || {}),
        work: Object.assign({}, defaults.work, parsed.work || {}),
        docs: Object.assign({}, defaults.docs, parsed.docs || {})
      };
    } catch (e) {
      return defaults;
    }
  }

  const homeShortcutsCfg = loadHomeShortcutsConfig();

  // Apply labels if buttons exist
  if (appsBtn && homeShortcutsCfg.apps && homeShortcutsCfg.apps.label) {
    appsBtn.textContent = homeShortcutsCfg.apps.label;
  }
  if (workBtn && homeShortcutsCfg.work && homeShortcutsCfg.work.label) {
    workBtn.textContent = homeShortcutsCfg.work.label;
  }
  if (docsBtn && homeShortcutsCfg.docs && homeShortcutsCfg.docs.label) {
    docsBtn.textContent = homeShortcutsCfg.docs.label;
  }


  const searchPanel = document.getElementById('homeSearchPanel');
  const searchInput = document.getElementById('homeSearchInput');
  const searchGoBtn = document.getElementById('homeSearchGoBtn');

  function openGoogleSearch(query) {
    const q = (query || '').trim();
    if (!q) return;
    const url = 'https://www.google.com/search?q=' + encodeURIComponent(q);
    window.open(url, '_blank');
  }

  if (searchBtn && searchPanel) {
    searchBtn.addEventListener('click', () => {
      const isHidden = searchPanel.style.display === 'none' || !searchPanel.style.display;
      searchPanel.style.display = isHidden ? 'flex' : 'none';
      if (isHidden && searchInput) {
        setTimeout(() => searchInput.focus(), 50);
      }
    });
  }

  if (searchGoBtn && searchInput) {
    searchGoBtn.addEventListener('click', () => openGoogleSearch(searchInput.value));
    searchInput.addEventListener('keydown', (evt) => {
      if (evt.key === 'Enter') {
        evt.preventDefault();
        openGoogleSearch(searchInput.value);
      }
    });
  }

  if (emailBtn) {
    emailBtn.addEventListener('click', () => {
      // Opens the default mail client; adjust to a specific webmail URL if desired.
      window.open('mailto:', '_blank', 'noopener,noreferrer');
    });
  }

  if (appsBtn) {
    appsBtn.addEventListener('click', () => {
      const target = (homeShortcutsCfg.apps && homeShortcutsCfg.apps.href) || 'apps.html';
      window.open(target, '_blank', 'noopener,noreferrer');
    });
  }

  if (workBtn) {
    workBtn.addEventListener('click', () => {
      const target = (homeShortcutsCfg.work && homeShortcutsCfg.work.href) || 'work.html';
      window.open(target, '_blank', 'noopener,noreferrer');
    });
  }

  if (docsBtn) {
    docsBtn.addEventListener('click', () => {
      const target = (homeShortcutsCfg.docs && homeShortcutsCfg.docs.href) || 'docs.html';
      window.open(target, '_blank', 'noopener,noreferrer');
    });
  }

  // Profile control now lives in the top-right nav (profile pill -> Settings)
})();

// ------------------------
// Hero Image Upload (Home)
// ------------------------
const heroImage = document.getElementById('heroImage');
const imageUpload = document.getElementById('imageUpload');

if (heroImage && localStorage.heroImage) heroImage.src = localStorage.heroImage;

if (imageUpload) {
  imageUpload.addEventListener('change', () => {
    const file = imageUpload.files && imageUpload.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (heroImage) heroImage.src = reader.result;
      localStorage.heroImage = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// ------------------------
// Home Quick Links (Home page)
// ------------------------
(function () {
  const container = document.getElementById('homeQuickLinks');
  const editBtn = document.getElementById('editQuickLinksBtn');
  if (!container) return; // not on Home

  const STORAGE_KEY = 'koreHomeQuickLinks';

  function loadCustomLinks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.slice(0, 3) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCustomLinks(links) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(links.slice(0, 3)));
    } catch (e) {
      // ignore
    }
  }

  function getFixedLinks() {
    return [
      { label: 'Work Tracker', href: 'work.html', description: 'Queue of requests and tasks.' },
      { label: 'Docs Library', href: 'docs.html', description: 'Reference files and links.' },
      { label: 'Apps & Tools', href: 'apps.html', description: 'External app shortcuts.' },
    ];
  }

  function render() {
    const fixed = getFixedLinks();
    const custom = loadCustomLinks();
    container.innerHTML = '';

    const all = [
      ...fixed.map((f) => ({ ...f, kind: 'fixed' })),
      ...custom.map((c, idx) => ({ ...c, kind: 'custom', slot: idx })),
    ];

    all.forEach((link) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'app-card quick-link-card';
      card.addEventListener('click', () => {
        if (!link.href) return;
        if (link.href.startsWith('http')) {
          window.open(link.href, '_blank');
        } else {
          window.location.href = link.href;
        }
      });
      const label = document.createElement('div');
      label.className = 'app-card-title';
      label.textContent = link.label || 'Quick Link';
      const desc = document.createElement('div');
      desc.className = 'app-card-desc';
      desc.textContent = link.description || (link.href || '');
      card.appendChild(label);
      card.appendChild(desc);
      container.appendChild(card);
    });
  }

  function editLinks() {
    const current = loadCustomLinks();
    const updated = [];
    for (let i = 0; i < 3; i++) {
      const existing = current[i] || {};
      const label = window.prompt(`Quick Link ${i + 1} name (leave blank to clear)`, existing.label || '');
      if (!label) {
        updated.push({ label: '', href: '', description: '' });
        continue;
      }
      const href = window.prompt('URL or Kore page (e.g. https://..., work.html, docs.html)', existing.href || '');
      if (!href) {
        updated.push({ label: '', href: '', description: '' });
        continue;
      }
      const desc = window.prompt('Short description (optional)', existing.description || '');
      updated.push({ label: label.trim(), href: href.trim(), description: (desc || '').trim() });
    }
    // Remove empty entries that don't have both a label and href
    const cleaned = updated.filter((l) => l.label && l.href);
    saveCustomLinks(cleaned);
    render();
  }

  render();
  if (editBtn) editBtn.addEventListener('click', editLinks);
})();

// ------------------------
// Legacy Apps quick-links block removed in Kore 2.8 (apps now uses apps.js)
// ------------------------

// ------------------------
// Docs Page Upload / Preview / Delete (Docs page)
// ------------------------
let docs = [];
try {
  docs = JSON.parse(localStorage.getItem('docs') || '[]');
  if (!Array.isArray(docs)) docs = [];
} catch (e) {
  docs = [];
}

const docList = document.getElementById('docList');
const uploadInput = document.getElementById('upload');

function saveDocs() {
  try {
    localStorage.setItem('docs', JSON.stringify(docs));
  } catch (e) {
    console.warn('Failed to save docs', e);
  }
}

function renderDocs() {
  if (!docList) return;
  docList.innerHTML = '';
  docs.forEach((doc, i) => {
    const div = document.createElement('div');
    div.className = 'doc-item';
    div.innerHTML = `
      <span>${doc.name}</span>
      <div>
        <button onclick="previewDoc(${i})">Preview</button>
        <button onclick="deleteDoc(${i})">Delete</button>
      </div>
    `;
    docList.appendChild(div);
  });
}

function deleteDoc(index) {
  if (confirm('Are you sure you want to delete this document?')) {
    docs.splice(index, 1);
    saveDocs();
    renderDocs();
  }
}

function previewDoc(index) {
  const doc = docs[index];
  if (!doc) return;
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(`<iframe src="${doc.content}" style="width:100%; height:100vh;" frameborder="0"></iframe>`);
    win.document.title = doc.name;
  }
}

if (uploadInput) {
  uploadInput.addEventListener('change', () => {
    const files = Array.from(uploadInput.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        docs.push({ name: file.name, content: reader.result });
        saveDocs();
        renderDocs();
      };
      reader.readAsDataURL(file);
    });
    uploadInput.value = '';
  });
}

renderDocs();

// ------------------------

/*
  Kore Storage Helpers
  --------------------
  Why: Some browsers enforce a tight localStorage quota. When Work Tracker
  requests (and/or other tools) grow, a new save can silently fail, which
  looks like the "Complete" button does nothing.

  Fix: Provide a resilient JSON storage wrapper that attempts a normal
  JSON save first, and if quota is exceeded, falls back to a lightweight
  LZ-based UTF-16 compression string.

  Notes:
  - Backwards compatible: existing plain JSON is still readable.
  - The compressed format is stored as: "LZ:" + <utf16-compressed>
*/
(function () {
  if (window.KoreStore) return;

  // Minimal, embedded LZString (MIT) subset: compressToUTF16 / decompressFromUTF16
  // Based on pieroxy/lz-string (https://github.com/pieroxy/lz-string)
  const LZ = (function () {
    const f = String.fromCharCode;

    function _compress(uncompressed, bitsPerChar, getCharFromInt) {
      if (uncompressed == null) return "";
      let i, value;
      const context_dictionary = {};
      const context_dictionaryToCreate = {};
      let context_c = "";
      let context_wc = "";
      let context_w = "";
      let context_enlargeIn = 2;
      let context_dictSize = 3;
      let context_numBits = 2;
      let context_data = [];
      let context_data_val = 0;
      let context_data_position = 0;

      for (i = 0; i < uncompressed.length; i += 1) {
        context_c = uncompressed.charAt(i);
        if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
          context_dictionary[context_c] = context_dictSize++;
          context_dictionaryToCreate[context_c] = true;
        }

        context_wc = context_w + context_c;
        if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
          context_w = context_wc;
        } else {
          if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
            if (context_w.charCodeAt(0) < 256) {
              for (let j = 0; j < context_numBits; j++) {
                context_data_val = (context_data_val << 1);
                if (context_data_position === bitsPerChar - 1) {
                  context_data_position = 0;
                  context_data.push(getCharFromInt(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
              }
              value = context_w.charCodeAt(0);
              for (let j = 0; j < 8; j++) {
                context_data_val = (context_data_val << 1) | (value & 1);
                if (context_data_position === bitsPerChar - 1) {
                  context_data_position = 0;
                  context_data.push(getCharFromInt(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value >>= 1;
              }
            } else {
              value = 1;
              for (let j = 0; j < context_numBits; j++) {
                context_data_val = (context_data_val << 1) | value;
                if (context_data_position === bitsPerChar - 1) {
                  context_data_position = 0;
                  context_data.push(getCharFromInt(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = 0;
              }
              value = context_w.charCodeAt(0);
              for (let j = 0; j < 16; j++) {
                context_data_val = (context_data_val << 1) | (value & 1);
                if (context_data_position === bitsPerChar - 1) {
                  context_data_position = 0;
                  context_data.push(getCharFromInt(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value >>= 1;
              }
            }
            context_enlargeIn--;
            if (context_enlargeIn === 0) {
              context_enlargeIn = Math.pow(2, context_numBits);
              context_numBits++;
            }
            delete context_dictionaryToCreate[context_w];
          } else {
            value = context_dictionary[context_w];
            for (let j = 0; j < context_numBits; j++) {
              context_data_val = (context_data_val << 1) | (value & 1);
              if (context_data_position === bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value >>= 1;
            }
          }

          context_enlargeIn--;
          if (context_enlargeIn === 0) {
            context_enlargeIn = Math.pow(2, context_numBits);
            context_numBits++;
          }

          context_dictionary[context_wc] = context_dictSize++;
          context_w = String(context_c);
        }
      }

      if (context_w !== "") {
        if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
          if (context_w.charCodeAt(0) < 256) {
            for (let j = 0; j < context_numBits; j++) {
              context_data_val = (context_data_val << 1);
              if (context_data_position === bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
            }
            value = context_w.charCodeAt(0);
            for (let j = 0; j < 8; j++) {
              context_data_val = (context_data_val << 1) | (value & 1);
              if (context_data_position === bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value >>= 1;
            }
          } else {
            value = 1;
            for (let j = 0; j < context_numBits; j++) {
              context_data_val = (context_data_val << 1) | value;
              if (context_data_position === bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = 0;
            }
            value = context_w.charCodeAt(0);
            for (let j = 0; j < 16; j++) {
              context_data_val = (context_data_val << 1) | (value & 1);
              if (context_data_position === bitsPerChar - 1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value >>= 1;
            }
          }
          context_enlargeIn--;
          if (context_enlargeIn === 0) {
            context_enlargeIn = Math.pow(2, context_numBits);
            context_numBits++;
          }
          delete context_dictionaryToCreate[context_w];
        } else {
          value = context_dictionary[context_w];
          for (let j = 0; j < context_numBits; j++) {
            context_data_val = (context_data_val << 1) | (value & 1);
            if (context_data_position === bitsPerChar - 1) {
              context_data_position = 0;
              context_data.push(getCharFromInt(context_data_val));
              context_data_val = 0;
            } else {
              context_data_position++;
            }
            value >>= 1;
          }
        }

        context_enlargeIn--;
        if (context_enlargeIn === 0) {
          context_enlargeIn = Math.pow(2, context_numBits);
          context_numBits++;
        }
      }

      // Mark the end of the stream
      value = 2;
      for (let j = 0; j < context_numBits; j++) {
        context_data_val = (context_data_val << 1) | (value & 1);
        if (context_data_position === bitsPerChar - 1) {
          context_data_position = 0;
          context_data.push(getCharFromInt(context_data_val));
          context_data_val = 0;
        } else {
          context_data_position++;
        }
        value >>= 1;
      }

      // Flush the last char
      while (true) {
        context_data_val = (context_data_val << 1);
        if (context_data_position === bitsPerChar - 1) {
          context_data.push(getCharFromInt(context_data_val));
          break;
        } else context_data_position++;
      }
      return context_data.join("");
    }

    function _decompress(length, resetValue, getNextValue) {
      const dictionary = [];
      let next;
      let enlargeIn = 4;
      let dictSize = 4;
      let numBits = 3;
      let entry = "";
      const result = [];
      let i;
      let w;
      let bits, resb, maxpower, power;
      let c;
      const data = { val: getNextValue(0), position: resetValue, index: 1 };

      for (i = 0; i < 3; i += 1) {
        dictionary[i] = i;
      }

      bits = 0;
      maxpower = Math.pow(2, 2);
      power = 1;
      while (power !== maxpower) {
        resb = data.val & data.position;
        data.position >>= 1;
        if (data.position === 0) {
          data.position = resetValue;
          data.val = getNextValue(data.index++);
        }
        bits |= (resb > 0 ? 1 : 0) * power;
        power <<= 1;
      }

      switch (next = bits) {
        case 0:
          bits = 0;
          maxpower = Math.pow(2, 8);
          power = 1;
          while (power !== maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position === 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb > 0 ? 1 : 0) * power;
            power <<= 1;
          }
          c = f(bits);
          break;
        case 1:
          bits = 0;
          maxpower = Math.pow(2, 16);
          power = 1;
          while (power !== maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position === 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb > 0 ? 1 : 0) * power;
            power <<= 1;
          }
          c = f(bits);
          break;
        case 2:
          return "";
      }
      dictionary[3] = c;
      w = c;
      result.push(c);

      while (true) {
        if (data.index > length) return "";

        bits = 0;
        maxpower = Math.pow(2, numBits);
        power = 1;
        while (power !== maxpower) {
          resb = data.val & data.position;
          data.position >>= 1;
          if (data.position === 0) {
            data.position = resetValue;
            data.val = getNextValue(data.index++);
          }
          bits |= (resb > 0 ? 1 : 0) * power;
          power <<= 1;
        }

        switch (c = bits) {
          case 0:
            bits = 0;
            maxpower = Math.pow(2, 8);
            power = 1;
            while (power !== maxpower) {
              resb = data.val & data.position;
              data.position >>= 1;
              if (data.position === 0) {
                data.position = resetValue;
                data.val = getNextValue(data.index++);
              }
              bits |= (resb > 0 ? 1 : 0) * power;
              power <<= 1;
            }
            dictionary[dictSize++] = f(bits);
            c = dictSize - 1;
            enlargeIn--;
            break;
          case 1:
            bits = 0;
            maxpower = Math.pow(2, 16);
            power = 1;
            while (power !== maxpower) {
              resb = data.val & data.position;
              data.position >>= 1;
              if (data.position === 0) {
                data.position = resetValue;
                data.val = getNextValue(data.index++);
              }
              bits |= (resb > 0 ? 1 : 0) * power;
              power <<= 1;
            }
            dictionary[dictSize++] = f(bits);
            c = dictSize - 1;
            enlargeIn--;
            break;
          case 2:
            return result.join("");
        }

        if (enlargeIn === 0) {
          enlargeIn = Math.pow(2, numBits);
          numBits++;
        }

        if (dictionary[c]) {
          entry = dictionary[c];
        } else {
          if (c === dictSize) {
            entry = w + w.charAt(0);
          } else {
            return null;
          }
        }
        result.push(entry);

        // Add w+entry[0] to the dictionary.
        dictionary[dictSize++] = w + entry.charAt(0);
        enlargeIn--;
        w = entry;

        if (enlargeIn === 0) {
          enlargeIn = Math.pow(2, numBits);
          numBits++;
        }
      }
    }

    function compressToUTF16(input) {
      if (input == null) return "";
      return _compress(input, 15, function (a) { return f(a + 32); }) + " ";
    }

    function decompressFromUTF16(compressed) {
      if (compressed == null) return "";
      if (compressed === "") return null;
      return _decompress(compressed.length, 16384, function (index) {
        return compressed.charCodeAt(index) - 32;
      });
    }

    return { compressToUTF16, decompressFromUTF16 };
  })();

  const PREFIX = "LZ:";

  function isQuotaError(err) {
    if (!err) return false;
    const name = String(err.name || "").toLowerCase();
    const msg = String(err.message || "").toLowerCase();
    return name.includes("quota") || name.includes("ns_error_dom_quota") || msg.includes("quota");
  }

  function decodeMaybeCompressed(raw) {
    if (!raw || typeof raw !== "string") return "";
    if (raw.startsWith(PREFIX)) {
      try {
        return LZ.decompressFromUTF16(raw.slice(PREFIX.length)) || "";
      } catch (e) {
        return "";
      }
    }
    return raw;
  }

  function parseArrayFromRaw(raw) {
    try {
      const json = decodeMaybeCompressed(raw);
      if (!json) return [];
      const arr = JSON.parse(json);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function writeArray(key, arr, opts) {
    const options = opts || {};
    const json = JSON.stringify(Array.isArray(arr) ? arr : []);

    // 1) Try normal JSON first
    try {
      localStorage.setItem(key, json);
      return true;
    } catch (e) {
      if (!options.compressOnQuota || !isQuotaError(e)) return false;
    }

    // 2) Quota fallback: compress JSON and retry
    try {
      const compressed = PREFIX + LZ.compressToUTF16(json);
      localStorage.setItem(key, compressed);
      return true;
    } catch (e2) {
      return false;
    }
  }

  window.KoreStore = {
    PREFIX,
    decodeMaybeCompressed,
    parseArrayFromRaw,
    readArray: function (key) {
      try {
        return parseArrayFromRaw(localStorage.getItem(key));
      } catch (e) {
        return [];
      }
    },
    writeArray: function (key, arr) {
      return writeArray(key, arr, { compressOnQuota: true });
    },
  };
})();

