(function () {
  const VERSION = "v3.14.8";

  // Expose for other modules (backup, About, etc.)
  window.KORE_VERSION = VERSION;

  function applyVersion() {
    const spans = document.querySelectorAll(".kore-version");
    spans.forEach((el) => {
      el.textContent = VERSION;
    });
  }

  function applyThemeFromStorage() {
    var style = 'dark';
    try {
      // Prefer the unified 'theme' key; fall back to legacy 'koreUiStyle'
      var stored = localStorage.getItem('theme');
      if (!stored) {
        stored = localStorage.getItem('koreUiStyle');
      }
      if (stored) {
        style = stored;
      }
    } catch (e) {
      style = 'dark';
    }
    var allowed = ['dark', 'light', 'slate', 'terminal', 'aurora'];
    if (allowed.indexOf(style) === -1) {
      style = 'dark';
    }
    document.body.dataset.theme = style;
    // Normalize storage so everything uses the same values going forward
    try {
      localStorage.setItem('theme', style);
      localStorage.setItem('koreUiStyle', style);
    } catch (e) {}
  }

  // ------------------------------------------------------------------
  // Kore Storage Helpers (Work Tracker quota-safe saves)
  // ------------------------------------------------------------------
  // Some pages (Work New Request / Reports / Archive) do not load main.js.
  // We define KoreStore here so all pages can read/write Work data safely.
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
      try {
        localStorage.setItem(key, json);
        return true;
      } catch (e) {
        if (!options.compressOnQuota || !isQuotaError(e)) return false;
      }
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

  function initKoreShell() {
    applyVersion();
    applyThemeFromStorage();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initKoreShell);
  } else {
    initKoreShell();
  }
})();
