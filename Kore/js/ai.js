/*
  Kore Offline Assistant (No-Model)
  --------------------------------
  - Works from file:// without fetch()
  - Deterministic intent + keyword scoring
  - Uses data/kore_kb.js if present

  Optional: When served over http(s), it can still fall back to fetch-based search
  if you decide to keep data/index.json and data/pages/*.txt for richer snippets.
*/

(() => {
  // NOTE: Many Kore pages place the Ask Kore widget near the end of <body>.
  // If scripts load before the widget markup, querySelector calls will fail.
  // Initialize only after DOM is ready.

  function init() {
    const chatBtn = document.getElementById("chat-btn");
    const chatBox = document.getElementById("chat-box");
    const chatClose = document.getElementById("chat-close");
    const chatOutput = document.getElementById("chat-output");
    const chatInput = document.getElementById("chat-input");

    if (!chatBtn || !chatBox || !chatOutput || !chatInput) return;

    const state = {
      turns: 0,
      lastTopicId: null,
    };

    function escHtml(str) {
      return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    function normalize(text) {
      return String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    function tokens(text) {
      const t = normalize(text);
      if (!t) return [];
      return t.split(" ").filter(Boolean);
    }

    function stripTags(html) {
      return String(html || "")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    function getCurrentProfileId() {
      try {
        const current = localStorage.getItem("koreCurrentProfileId");
        if (current) return current;
        const raw = localStorage.getItem("koreProfiles");
        if (!raw) return null;
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length) return arr[0].id || null;
      } catch (e) {
        // ignore
      }
      return null;
    }

    function randomPick(arr) {
      if (!Array.isArray(arr) || arr.length === 0) return "";
      return arr[Math.floor(Math.random() * arr.length)];
    }

    function scoreMatch(queryTokens, candidateText) {
      const cand = normalize(candidateText);
      if (!cand) return 0;

      // Token overlap scoring + phrase bonus
      let score = 0;
      for (const qt of queryTokens) {
        if (qt.length <= 2) continue;
        if (cand.includes(qt)) score += 2;
      }

      // Bonus: exact phrase match (normalized)
      const phrase = queryTokens.join(" ");
      if (phrase && cand.includes(phrase)) score += 6;

      return score;
    }

    function buildSources(sources) {
      if (!sources || sources.length === 0) return "";

      // Clean + dedupe
      const cleaned = [];
      const seen = new Set();
      (sources || []).forEach((s) => {
        const val = (s || "").toString().trim();
        if (!val) return;
        if (seen.has(val)) return;
        seen.add(val);
        cleaned.push(val);
      });

      if (!cleaned.length) return "";

      const links = cleaned
        .map((s) => {
          const match = s.match(/\(([^)]+\.html)\)/i);
          const href = match ? match[1] : (s.toLowerCase().endsWith(".html") ? s : "");
          if (href) {
            return `<a href="${escHtml(href)}">${escHtml(s)}</a>`;
          }
          return `<span>${escHtml(s)}</span>`;
        })
        .join(" · ");

      return `<div class="ai-sources"><strong>Sources:</strong> ${links}</div>`;
    }

    
    function renderAssistantMessage(html) {
      const wrapper = document.createElement("div");
      wrapper.className = "ai-msg ai-msg--assistant";
      wrapper.innerHTML = html;
      chatOutput.appendChild(wrapper);
      chatOutput.scrollTop = chatOutput.scrollHeight;
    }

    function renderUserMessage(text) {
      const wrapper = document.createElement("div");
      wrapper.className = "ai-msg ai-msg--user";
      wrapper.innerHTML = `<div class="ai-bubble ai-bubble--user">${escHtml(text)}</div>`;
      chatOutput.appendChild(wrapper);
      chatOutput.scrollTop = chatOutput.scrollHeight;
    }

    function offlineAnswer(userText) {
      const kb = window.KORE_ASSISTANT_KB;
      // Fast-path intents for very generic inputs (improves "Help" / "What do I do?" / "Error" queries)
      const tinyRaw = (userText || "").toString().trim().toLowerCase();
      if (tinyRaw.length && tinyRaw.length <= 16) {
        if (tinyRaw === "help" || tinyRaw === "what do i do" || tinyRaw === "what do i do?" || tinyRaw === "where do i start" || tinyRaw === "start" || tinyRaw === "getting started") {
          return {
            text:
              "Start on the Home page, then pick the area that matches what you're doing: Work Tracker (track requests), Docs Library (store references), Info Hub (write guides), and Settings (profiles, time zone, Home buttons, backup/restore). If you tell me which area you're working in, I can give exact click-by-click steps.",
            sources: ["Home (index.html)", "Work Tracker (work.html)", "Docs Library (docs.html)", "Info Hub (info-hub.html)", "Settings (settings.html)"],
          };
        }
        if (tinyRaw === "error" || tinyRaw === "not working" || tinyRaw === "broken") {
          return {
            text:
              "Troubleshooting checklist: (1) Confirm you opened Kore from the current 'Kore' folder, (2) hard refresh the page (Ctrl+Shift+R), (3) check Settings > Restore Mode if you recently restored a backup, and (4) identify which page/tool is failing. Tell me the page and what you clicked, and I will pinpoint the fix.",
            sources: ["Settings (settings.html)", "About (about.html)"],
          };
        }
      }

      // Explicit intent for "How does Kore work" / "What is Kore"
      const qLower = (userText || "").toString().trim().toLowerCase();
      if (qLower.includes("how does kore work") || qLower.includes("how does kore 3.5 work") || qLower === "what is kore" || qLower === "what is kore 3.5") {
        return {
          text:
            "Kore is a local-first work and knowledge system. You open index.html from the Kore folder, and everything runs offline in your browser. Your data is stored in localStorage, not on a server. The main pieces are: Home (clock, shortcuts, hero and message), Work Tracker (requests + reports), Docs Library (reference items), Info Hub (your how-to pages), Apps & Tools (launch tiles), Settings (profiles, time zone, theme, backup/restore), and Ask Kore (this assistant). Use backup to export a JSON file so you can move Kore or protect your data.",
          sources: ["README.txt", "About (about.html)", "Home (index.html)", "Work Tracker (work.html)", "Docs Library (docs.html)", "Info Hub (info-hub.html)", "Settings (settings.html)"],
        };
      }

      const qt = tokens(userText);

      if (!kb || !kb.faq || !kb.pages) {
        return {
          text:
            "Offline assistant dataset is missing or failed to load. Ensure data/kore_kb.js loads successfully (file exists and is included before js/ai.js). If you renamed folders, keep the /data path intact.",
          sources: [],
        };
      }

      const scopeSelect = document.getElementById("askScope");
      const scope = scopeSelect ? scopeSelect.value : "all";
      const allowKb = scope === "all" || scope === "kb";
      const allowGuides = scope === "all" || scope === "info";
      const includeTools = scope === "all"; // Tools are considered part of the full corpus

      // 1) Score FAQ entries (highest priority)
      let best = { type: "", id: null, score: 0, text: "", sources: [] };

      if (allowKb) {
        for (const entry of kb.faq) {
          const qList = Array.isArray(entry.q) ? entry.q : [entry.q];
          let entryScore = 0;
          for (const q of qList) {
            entryScore = Math.max(entryScore, scoreMatch(qt, q));
          }
          // Also score against the answer text to catch broader queries
          entryScore += Math.floor(scoreMatch(qt, entry.a) / 2);

          if (entryScore > best.score) {
            best = {
              type: "faq",
              id: entry.id,
              score: entryScore,
              text: entry.a,
              sources: entry.sources || [],
            };
          }
        }
      }

      // 2) Score core Kore pages (secondary)
      let bestPage = { id: null, score: 0, page: null };
      if (allowKb) {
        for (const p of kb.pages) {
          const tagText = (p.tags || []).join(" ");
          const combined = `${p.title} ${tagText} ${p.summary}`;
          const s = scoreMatch(qt, combined);
          if (s > bestPage.score) {
            bestPage = { id: p.id, score: s, page: p };
          }
        }
      }

      // 3) Score Info Hub user pages (guides) — dynamic, stored in localStorage
      let bestGuide = { id: null, score: 0, page: null };
      if (allowGuides) {
        try {
          const raw = localStorage.getItem("infoPages");
          const pages = raw ? JSON.parse(raw) : [];
          const currentProfileId = getCurrentProfileId();
          if (Array.isArray(pages)) {
            for (const g of pages) {
              if (!g || g.archived) continue;
              const visibility = g.visibility || "personal";
              if (
                visibility === "personal" &&
                currentProfileId &&
                g.ownerProfileId &&
                g.ownerProfileId !== currentProfileId
              ) {
                continue;
              }
              // Search title/summary/content/tags
              const textBlob = [
                stripTags(g.titleHtml || g.title),
                stripTags(g.summaryHtml || g.summary),
                stripTags(g.contentHtml),
                (g.tags || []).join(" "),
              ].join(" \n");
              const s = scoreMatch(qt, textBlob);
              if (s > bestGuide.score) bestGuide = { id: g.id, score: s, page: g };
            }
          }
        } catch (e) {
          // ignore
        }
      }

      // 3b) Homepage message (owner-defined, HTML allowed)
      let bestHome = { score: 0, html: "" };
      if (allowKb) {
        try {
          const homeHtml = localStorage.getItem("koreHomepageMessage") || "";
          const homeText = stripTags(homeHtml);
          if (homeText) {
            const s = scoreMatch(qt, homeText);
            if (s > 0) {
              bestHome = { score: s, html: homeHtml || homeText };
            }
          }
        } catch (e) {
          // ignore
        }
      }

      // 3c) Tools data (Apps, Work, Docs) – best single match
      let bestTool = { kind: null, score: 0, label: "", pageHref: "" };
      if (includeTools) {
        try {
          // Apps
          const appsRaw = localStorage.getItem("apps");
          const apps = appsRaw ? JSON.parse(appsRaw) : [];
          if (Array.isArray(apps)) {
            for (const a of apps) {
              if (!a) continue;
              const name = a.name || "";
              const desc = a.description || "";
              const url = a.url || "";
              const blob = `${name} ${desc} ${url}`;
              const s = scoreMatch(qt, blob);
              if (s > bestTool.score) {
                bestTool = {
                  kind: "Apps",
                  score: s,
                  label: name || url || "App shortcut",
                  pageHref: "apps.html",
                };
              }
            }
          }
        } catch (e) {
          // ignore
        }

        try {
          // Work items
          const workRaw = localStorage.getItem("work");
          const work = workRaw ? JSON.parse(workRaw) : [];
          if (Array.isArray(work)) {
            for (const w of work) {
              if (!w) continue;
              const title = w.title || w.name || "";
              const notes = w.notes || w.desc || "";
              const status = w.status || "";
              const type = w.type || "";
              const priority = w.priority || "";
              const blob = `${title} ${notes} ${status} ${type} ${priority}`;
              const s = scoreMatch(qt, blob);
              if (s > bestTool.score) {
                bestTool = {
                  kind: "Work Tracker",
                  score: s,
                  label: title || "Work item",
                  pageHref: "work.html",
                };
              }
            }
          }
        } catch (e) {
          // ignore
        }

        try {
          // Docs
          const docsRaw = localStorage.getItem("docs");
          const docs = docsRaw ? JSON.parse(docsRaw) : [];
          if (Array.isArray(docs)) {
            for (const d of docs) {
              if (!d) continue;
              const title = d.title || d.name || "";
              const desc = d.description || "";
              const type = d.fileType || "";
              const category = d.category || "";
              const blob = `${title} ${desc} ${type} ${category}`;
              const s = scoreMatch(qt, blob);
              if (s > bestTool.score) {
                bestTool = {
                  kind: "Docs",
                  score: s,
                  label: title || "Document",
                  pageHref: "docs.html",
                };
              }
            }
          }
        } catch (e) {
          // ignore
        }
      }

      // 4) Decide response
      const opener = randomPick(kb.tone?.openers || []);

      // Light short-term memory: if user repeats the same topic, be more direct.
      const repeated = best.id && best.id === state.lastTopicId;

      // Thresholding: tuned a bit lower so we surface "closest" matches more often
      const minFaqScore = 3;
      const minPageScore = 3;
      const minGuideScore = 3;
      const minHomeScore = 3;
      const minToolScore = 3;

      if (allowKb && best.score >= minFaqScore) {
        state.lastTopicId = best.id;
        const followUp = repeated ? "" : randomPick(kb.tone?.followUps || []);
        return {
          text: `${opener} ${best.text}${followUp ? " " + followUp : ""}`,
          sources: best.sources,
        };
      }

      if (allowKb && bestHome.score >= minHomeScore) {
        const followUp = repeated ? "" : randomPick(kb.tone?.followUps || []);
        return {
          text: `${opener} I found something in your homepage message that might help:<div style="margin-top:8px;">${bestHome.html}</div>${
            followUp ? " " + followUp : ""
          }`,
          sources: [],
        };
      }

      if (allowKb && bestPage.page && bestPage.score >= minPageScore) {
        state.lastTopicId = bestPage.id;
        const p = bestPage.page;
        const followUp = repeated ? "" : randomPick(kb.tone?.followUps || []);
        return {
          text: `${opener} ${p.summary} You can open <a href="${escHtml(
            p.page
          )}"><strong>${escHtml(p.title)}</strong></a> for the full interface.${
            followUp ? " " + followUp : ""
          }`,
          sources: [p.page],
        };
      }

      if (allowGuides && bestGuide.page && bestGuide.score >= minGuideScore) {
        state.lastTopicId = bestGuide.id;
        const g = bestGuide.page;
        const titleText = stripTags(g.titleHtml || g.title) || "Untitled Page";
        const summaryText = stripTags(g.summaryHtml || g.summary) || "";
        // Lightweight snippet from content
        const bodyText = stripTags(g.contentHtml || "");
        const snippet = bodyText
          ? bodyText.slice(0, 220) + (bodyText.length > 220 ? "…" : "")
          : "";
        const followUp = repeated ? "" : randomPick(kb.tone?.followUps || []);
        return {
          text: `${opener} I found a matching Info Hub guide: <a href="info-page.html?id=${escHtml(
            g.id
          )}"><strong>${escHtml(titleText)}</strong></a>.${
            summaryText ? " " + summaryText : ""
          }${
            snippet
              ? `<div style="margin-top:8px; opacity:0.95;"><em>Preview:</em> ${escHtml(
                  snippet
                )}</div>`
              : ""
          }${followUp ? " " + followUp : ""}`,
          sources: ["info-hub.html"],
        };
      }

      if (includeTools && bestTool.kind && bestTool.score >= minToolScore) {
        const followUp = randomPick(kb.tone?.followUps || []);
        return {
          text: `${opener} I found something in your ${escHtml(
            bestTool.kind
          )} that looks related: <strong>${escHtml(
            bestTool.label
          )}</strong>. Open <a href="${escHtml(
            bestTool.pageHref
          )}">${escHtml(bestTool.kind)}</a> to view or edit it.${
            followUp ? " " + followUp : ""
          }`,
          sources: [bestTool.pageHref],
        };
      }

      // 5) Not found: offer likely destinations
      const notFound = randomPick(kb.tone?.notFound || []);
      const suggestions = kb.pages
        .map((p) => ({ p, s: scoreMatch(qt, `${p.title} ${(p.tags || []).join(" ")}`) }))
        .sort((a, b) => b.s - a.s)
        .slice(0, 3)
        .filter((x) => x.s > 0)
        .map(
          (x) =>
            `<li><a href="${escHtml(x.p.page)}">${escHtml(x.p.title)}</a> — ${escHtml(
              x.p.summary
            )}</li>`
        )
        .join("");

      const suggestBlock = suggestions
        ? `<div style="margin-top:8px;">Closest pages I can point you to:<ul style="margin:6px 0 0 18px;">${suggestions}</ul></div>`
        : "";

      return {
        text: `${opener} ${notFound}${suggestBlock}\n\n**Kore limitations (offline assistant):**\n- Offline only (no web browsing).\n- Answers come from built-in help + your saved Kore content.\n\n**Tip:** Include the page/tool name and the exact step or error.`,
        sources: [],
      };
    }

    function handleSubmit() {
      const raw = chatInput.value;
      const text = String(raw || "").trim();
      if (!text) return;

      state.turns += 1;

      // Clear input early
      chatInput.value = "";

      // Render user message
      renderUserMessage(text);

      // Render thinking
      const thinking = document.createElement("div");
      thinking.className = "ai-msg ai-msg--assistant";
      thinking.innerHTML = `<div class="ai-bubble ai-bubble--assistant">Thinking…</div>`;
      chatOutput.appendChild(thinking);
      chatOutput.scrollTop = chatOutput.scrollHeight;

      // Produce response
      const res = offlineAnswer(text) || { text: "", sources: [] };

      // Normalise and guard against empty answers
      let answerText = (res.text || "").trim();
      const answerSources = Array.isArray(res.sources) ? res.sources : [];

      if (!answerText) {
        answerText =
          "I couldn't find a strong match in Kore's offline knowledge for that question.\n\n**Kore limitations (offline assistant):**\n- Ask Kore runs fully offline and does not browse the internet.\n- It can only answer from Kore’s built-in help + your saved content (Info Hub pages, Work items, Docs entries, Apps/Tools labels).\n- Vague prompts (e.g., “what do I do?”) work best when you add context.\n\n**How to get better answers:**\n1) Include the page/tool name: Home, Work Tracker, Docs Library, Info Hub, Reports, Settings, Password Tools.\n2) Describe the goal and what you clicked.\n3) If there’s an error, paste the exact message.\n\nExample: “Work Tracker — I added a request but it’s not showing in Reports. What should I check?”";
      }

      // Replace thinking bubble
      thinking.innerHTML = `
      <div class="ai-bubble ai-bubble--assistant">${answerText}</div>
      ${buildSources(answerSources)}
    `;

      chatOutput.scrollTop = chatOutput.scrollHeight;
    }

    // Toggle widget
    chatBtn.addEventListener("click", () => {
      const current = getComputedStyle(chatBox).display;
      chatBox.style.display = current === "none" ? "flex" : "none";
      if (chatBox.style.display === "flex") chatInput.focus();
    });

    // Close button inside the chat box
    if (chatClose) {
      chatClose.addEventListener("click", () => {
        chatBox.style.display = "none";
      });
    }

    // Esc closes the chat
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const current = getComputedStyle(chatBox).display;
        if (current !== "none") chatBox.style.display = "none";
      }
    });

    // Submit on Enter
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    });

    // Welcome message (only once per page load)
    renderAssistantMessage(
      `<div class="ai-bubble ai-bubble--assistant"><strong>Kore Assistant (offline)</strong><br>Ask me where things are, how to use a feature, or what Kore does. I’ll answer using the built-in dataset plus your Info Hub guides and Tools.</div>`
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
