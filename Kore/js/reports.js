// Reports Page for Work Tracker
// --------------------------------
console.log("Kore Reports: script loaded");
// --------------------------------
(function () {
  const STORAGE_KEY = "work";

  const totalEl = document.getElementById("repTotalRequests");
  const openEl = document.getElementById("repOpenRequests");
  const completedEl = document.getElementById("repCompletedRequests");
  const overdueEl = document.getElementById("repOverdueRequests");
  const avgAgeOpenEl = document.getElementById("repAvgAgeOpen");
  const maxAgeOpenEl = document.getElementById("repMaxAgeOpen");

  const byTypeBody = document.getElementById("repByTypeBody");
  const byAccountBody = document.getElementById("repByAccountBody");
  const agingBody = document.getElementById("repAgingBody");

  const statusCanvas = document.getElementById("statusChart");
  const priorityCanvas = document.getElementById("priorityChart");
  const agingCanvas = document.getElementById("agingChart");

  // If core summary elements are missing, do not proceed.
  if (!totalEl && !openEl && !completedEl && !overdueEl) {
    console.warn("Kore Reports: core summary elements not found; aborting init.");
    return;
  }

  const exportWorkBtn = document.getElementById("exportWorkCsvBtn");
  const exportSummaryBtn = document.getElementById("exportSummaryCsvBtn");
  const refreshBtn = document.getElementById("refreshReportsBtn");
  const updatedEl = document.getElementById("reportsUpdatedAt");
  function loadWorkConfigTypesAndAccounts() {
    const DEFAULT_TYPES = [
      "Content Change",
      "New Page",
      "Bug Fix",
      "Access Issue",
      "General IT",
    ];
    const DEFAULT_ACCOUNTS = [
      "General",
      "Internal",
      "External",
    ];

    // Prefer simple config
    try {
      const simpleRaw = localStorage.getItem("workConfigSimple");
      if (simpleRaw) {
        const simple = JSON.parse(simpleRaw);
        const types = Array.isArray(simple.types) ? simple.types : [];
        const accounts = Array.isArray(simple.accounts) ? simple.accounts : [];
        if (types.length || accounts.length) {
          return {
            types: types.length ? types : DEFAULT_TYPES.slice(),
            accounts: accounts.length ? accounts : DEFAULT_ACCOUNTS.slice(),
          };
        }
      }
    } catch (e) {}

    // Fallback to koreWorkTypes / koreWorkAccounts
    try {
      const tRaw = localStorage.getItem("koreWorkTypes");
      const aRaw = localStorage.getItem("koreWorkAccounts");
      const types = tRaw ? JSON.parse(tRaw) : [];
      const accounts = aRaw ? JSON.parse(aRaw) : [];
      if (Array.isArray(types) && Array.isArray(accounts) && (types.length || accounts.length)) {
        return {
          types: types.length ? types : DEFAULT_TYPES.slice(),
          accounts: accounts.length ? accounts : DEFAULT_ACCOUNTS.slice(),
        };
      }
    } catch (e) {}

    // Legacy workConfig
    try {
      const raw = localStorage.getItem("workConfig");
      if (!raw) {
        return { types: DEFAULT_TYPES.slice(), accounts: DEFAULT_ACCOUNTS.slice() };
      }
      const parsed = JSON.parse(raw);
      const rawTypes = Array.isArray(parsed.types) ? parsed.types : [];
      const rawAccounts = Array.isArray(parsed.accounts) ? parsed.accounts : [];
      const types = rawTypes
        .flatMap(function (t) { return String(t || "").split(/[\r\n,]+/); })
        .map(function (s) { return s.trim(); })
        .filter(function (s) { return s.length > 0; });
      const accounts = rawAccounts
        .flatMap(function (t) { return String(t || "").split(/[\r\n,]+/); })
        .map(function (s) { return s.trim(); })
        .filter(function (s) { return s.length > 0; });
      return {
        types: types.length ? types : DEFAULT_TYPES.slice(),
        accounts: accounts.length ? accounts : DEFAULT_ACCOUNTS.slice(),
      };
    } catch (e) {
      return { types: DEFAULT_TYPES.slice(), accounts: DEFAULT_ACCOUNTS.slice() };
    }
  }



  function loadWorkItems() {
    try {
      if (window.KoreStore && window.KoreStore.readArray) {
        return window.KoreStore.readArray(STORAGE_KEY);
      }
      const raw = localStorage.getItem(STORAGE_KEY) || "[]";
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function isCompleted(item) {
    return String(item.status || "").toLowerCase() === "completed";
  }

  function isOpen(item) {
    const s = String(item.status || "").toLowerCase();
    return s === "new" || s === "in progress" || s === "on hold";
  }

  function isOverdue(item) {
    if (!item.dueDate || isCompleted(item)) return false;
    const today = new Date();
    const due = new Date(item.dueDate);
    if (Number.isNaN(due.getTime())) return false;
    return due < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  function summarise(items) {
    const summary = {
      total: items.length,
      open: 0,
      completed: 0,
      overdue: 0,
      byStatus: {},
      byPriority: {},
      byType: {},
      byAccount: {},
    };

    items.forEach((item) => {
      const status = String(item.status || "New");
      const priority = String(item.priority || "Medium");
      const type = String(item.type || "Unspecified");
      const account = String(item.account || "Unspecified");

      if (isOpen(item)) summary.open++;
      if (isCompleted(item)) summary.completed++;
      if (isOverdue(item)) summary.overdue++;

      summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;
      summary.byPriority[priority] = (summary.byPriority[priority] || 0) + 1;
      summary.byType[type] = (summary.byType[type] || 0) + 1;
      summary.byAccount[account] = (summary.byAccount[account] || 0) + 1;
    });

    return summary;
  }

function computeAgingStats(items) {
    const today = new Date();
    let totalDays = 0;
    let count = 0;
    let maxAge = 0;
    const buckets = {
      "0-2": 0,
      "3-7": 0,
      "8-14": 0,
      "15+": 0,
    };

    if (!Array.isArray(items)) return { avgAge: 0, maxAge: 0, buckets, count: 0 };

    items.forEach(function (item) {
      try {
        if (!item) return;

        // Exclude completed items from workload/aging
        const status = String(item.status || "").toLowerCase();
        if (status === "completed") return;

        // Prefer createdAt, but fall back to created for older records
        const createdRaw = item.createdAt || item.created;
        if (!createdRaw) return;

        const dt = new Date(createdRaw);
        if (!dt || !dt.getTime || !isFinite(dt.getTime())) return;

        const ageMs = today.getTime() - dt.getTime();
        if (!isFinite(ageMs) || ageMs < 0) return;

        const ageDays = Math.floor(ageMs / 86400000);
        totalDays += ageDays;
        count++;

        if (ageDays > maxAge) maxAge = ageDays;

        if (ageDays <= 2) buckets["0-2"]++;
        else if (ageDays <= 7) buckets["3-7"]++;
        else if (ageDays <= 14) buckets["8-14"]++;
        else buckets["15+"]++;
      } catch (e) {
        // ignore bad item
      }
    });

    const avgAge = count ? totalDays / count : 0;
    return { avgAge: avgAge, maxAge: maxAge, buckets: buckets, count: count };
  }

  function renderAging(stats) {
    if (!stats) {
      if (avgAgeOpenEl) avgAgeOpenEl.textContent = "0";
      if (maxAgeOpenEl) maxAgeOpenEl.textContent = "0";
      if (agingBody) agingBody.innerHTML = "";
      return;
    }

    if (avgAgeOpenEl) {
      avgAgeOpenEl.textContent = stats.count ? stats.avgAge.toFixed(1) : "0";
    }
    if (maxAgeOpenEl) {
      maxAgeOpenEl.textContent = stats.maxAge || 0;
    }
    if (agingBody) {
      agingBody.innerHTML = "";
      const order = ["0-2", "3-7", "8-14", "15+"];
      order.forEach(function (bucket) {
        const tr = document.createElement("tr");
        const count = stats.buckets && stats.buckets[bucket] ? stats.buckets[bucket] : 0;
        tr.innerHTML = "<td>" + bucket + " days</td><td>" + count + "</td>";
        agingBody.appendChild(tr);
      });
    }
  }

  function renderSummary(summary) {
    if (totalEl) totalEl.textContent = String(summary.total);
    if (openEl) openEl.textContent = String(summary.open);
    if (completedEl) completedEl.textContent = String(summary.completed);
    if (overdueEl) overdueEl.textContent = String(summary.overdue);
  }

  function clearTable(tbody) {
    if (!tbody) return;
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
  }

  function renderAdvanced(summary, items) {
  function buildPieData(counts) {
    var labels = Object.keys(counts || {});
    var values = labels.map(function (label) { return counts[label] || 0; });
    var total = values.reduce(function (sum, v) { return sum + v; }, 0);
    return { labels: labels, values: values, total: total };
  }

  function buildPieColors(labels) {
    return labels.map(function (_, index) {
      var hue = (index * 60) % 360;
      return "hsl(" + hue + ", 65%, 55%)";
    });
  }

  function drawPieChart(canvasId, pieData, colors) {
    var canvas = document.getElementById(canvasId);
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    if (!pieData.labels.length || !pieData.total) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    var centerX = canvas.width / 2;
    var centerY = canvas.height / 2;
    var radius = Math.min(canvas.width, canvas.height) / 2 - 10;
    var startAngle = -Math.PI / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    pieData.labels.forEach(function (label, index) {
      var value = pieData.values[index] || 0;
      if (!value) return;
      var sliceAngle = (value / pieData.total) * Math.PI * 2;
      var endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index] || "#38bdf8";
      ctx.fill();

      var percent = (value / pieData.total) * 100;
      if (percent >= 7) {
        var midAngle = startAngle + sliceAngle / 2;
        var labelRadius = radius * 0.6;
        var labelX = centerX + Math.cos(midAngle) * labelRadius;
        var labelY = centerY + Math.sin(midAngle) * labelRadius;
        ctx.fillStyle = "#020617";
        ctx.font = "12px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(Math.round(percent) + "%", labelX, labelY);
      }

      startAngle = endAngle;
    });
  }

  function renderLegend(legendId, pieData, colors) {
    var legendEl = document.getElementById(legendId);
    if (!legendEl) return;
    legendEl.innerHTML = "";
    if (!pieData.labels.length || !pieData.total) {
      return;
    }

    pieData.labels.forEach(function (label, index) {
      var value = pieData.values[index] || 0;
      if (!value) return;
      var percent = (value / pieData.total) * 100;

      var item = document.createElement("div");
      item.className = "reports-pie-legend-item";

      var swatch = document.createElement("span");
      swatch.className = "reports-pie-legend-swatch";
      swatch.style.backgroundColor = colors[index] || "#38bdf8";

      var text = document.createElement("span");
      text.className = "reports-pie-legend-label";
      text.textContent = label + " (" + value + ", " + Math.round(percent) + "%)";

      item.appendChild(swatch);
      item.appendChild(text);
      legendEl.appendChild(item);
    });
  }

  // By Type table + pie
  if (byTypeBody) {
    clearTable(byTypeBody);
    var types = Object.keys(summary.byType || {});
    if (!types.length) {
      var trEmptyType = document.createElement("tr");
      var tdEmptyType = document.createElement("td");
      tdEmptyType.colSpan = 4;
      tdEmptyType.textContent = "No data yet. Add Work Tracker items to see breakdowns.";
      trEmptyType.appendChild(tdEmptyType);
      byTypeBody.appendChild(trEmptyType);
    } else {
      types.forEach(function (label) {
        var total = 0, open = 0, completed = 0;
        items.forEach(function (item) {
          if (String(item.type || "Unspecified") !== label) return;
          total++;
          if (isOpen(item)) open++;
          if (isCompleted(item)) completed++;
        });
        var tr = document.createElement("tr");
        tr.innerHTML = "<td>" + label + "</td><td>" + total + "</td><td>" + open + "</td><td>" + completed + "</td>";
        byTypeBody.appendChild(tr);
      });
    }

    var typePie = buildPieData(summary.byType || {});
    var typeColors = buildPieColors(typePie.labels);
    drawPieChart("typePieChart", typePie, typeColors);
    renderLegend("typePieLegend", typePie, typeColors);
  }

  // By Account table + pie
  if (byAccountBody) {
    clearTable(byAccountBody);
    var accounts = Object.keys(summary.byAccount || {});
    if (!accounts.length) {
      var trEmptyAcct = document.createElement("tr");
      var tdEmptyAcct = document.createElement("td");
      tdEmptyAcct.colSpan = 4;
      tdEmptyAcct.textContent = "No data yet. Add Work Tracker items to see breakdowns.";
      trEmptyAcct.appendChild(tdEmptyAcct);
      byAccountBody.appendChild(trEmptyAcct);
    } else {
      accounts.forEach(function (label) {
        var totalA = 0, openA = 0, completedA = 0;
        items.forEach(function (item) {
          if (String(item.account || "Unspecified") !== label) return;
          totalA++;
          if (isOpen(item)) openA++;
          if (isCompleted(item)) completedA++;
        });
        var trA = document.createElement("tr");
        trA.innerHTML = "<td>" + label + "</td><td>" + totalA + "</td><td>" + openA + "</td><td>" + completedA + "</td>";
        byAccountBody.appendChild(trA);
      });
    }

    var accountPie = buildPieData(summary.byAccount || {});
    var accountColors = buildPieColors(accountPie.labels);
    drawPieChart("accountPieChart", accountPie, accountColors);
    renderLegend("accountPieLegend", accountPie, accountColors);
  }
}


function drawBarChart(canvas, counts, orderedLabels, caption) {
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var labels = orderedLabels && orderedLabels.length ? orderedLabels.slice() : Object.keys(counts || {});
  if (!labels.length) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }
  var values = labels.map(function (label) {
    return counts[label] || 0;
  });
  var maxVal = 0;
  values.forEach(function (v) {
    if (v > maxVal) maxVal = v;
  });
  if (!maxVal) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  var width = canvas.width;
  var height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  var padding = 28;
  var chartHeight = height - padding * 2;
  var chartWidth = width - padding * 2;
  var barWidth = chartWidth / (labels.length * 1.6);
  var barGap = barWidth * 0.6;
  var originX = padding + (chartWidth - (labels.length * (barWidth + barGap) - barGap)) / 2;
  var originY = height - padding;

  labels.forEach(function (label, index) {
    var value = values[index];
    var barHeight = (value / maxVal) * chartHeight;
    var x = originX + index * (barWidth + barGap);
    var y = originY - barHeight;

    var hue = (index * 75) % 360;
    ctx.fillStyle = "hsl(" + hue + ", 65%, 55%)";
    ctx.fillRect(x, y, barWidth, barHeight);

    // value label
    ctx.fillStyle = "#e5e7eb";
    ctx.font = "11px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(String(value), x + barWidth / 2, y - 2);

    // x label
    ctx.save();
    ctx.translate(x + barWidth / 2, originY + 2);
    ctx.rotate(-Math.PI / 4);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });
}

function drawStatusAndPriorityCharts(summary) {
  try {
    if (statusCanvas) {
      drawBarChart(statusCanvas, summary.byStatus || {}, ["New", "In Progress", "On Hold", "Completed"], "Status");
    }
    if (priorityCanvas) {
      drawBarChart(priorityCanvas, summary.byPriority || {}, ["Low", "Medium", "High", "Urgent"], "Priority");
    }
  } catch (e) {
    console.error("Kore Reports: error drawing status/priority charts", e);
  }
}


  function drawAgingChart(stats) {
    try {
      if (!agingCanvas) return;
      const buckets = (stats && stats.buckets) || {};
      const labels = ["0-2 days", "3-7 days", "8-14 days", "15+ days"];
      const countsMap = {
        "0-2 days": buckets["0-2"] || 0,
        "3-7 days": buckets["3-7"] || 0,
        "8-14 days": buckets["8-14"] || 0,
        "15+ days": buckets["15+"] || 0,
      };
      drawBarChart(agingCanvas, countsMap, labels, "Age Bucket");
    } catch (e) {
      console.error("Kore Reports: error drawing aging chart", e);
    }
  }





  document.addEventListener("DOMContentLoaded", function () {
    let snapshot = null;

    function snapshotAndRender() {
      const items = loadWorkItems();
      const summary = summarise(items);
      renderSummary(summary);
      renderAdvanced(summary, items);
      drawStatusAndPriorityCharts(summary);
      const aging = computeAgingStats(items);
      renderAging(aging);
      drawAgingChart(aging);

      if (updatedEl) {
        try {
          const now = new Date();
          updatedEl.textContent = now.toLocaleString();
        } catch (e) {
          updatedEl.textContent = "Just now";
        }
      }

      snapshot = { items: items, summary: summary };
      return snapshot;
    }

    function downloadCsv(filename, rows) {
      if (!rows || !rows.length) return;
      const csv = rows.map(function (row) {
        return row.map(function (cell) {
          const value = cell == null ? "" : String(cell);
          if (/[",\n]/.test(value)) {
            return '"' + value.replace(/"/g, '""') + '"';
          }
          return value;
        }).join(",");
      }).join("\r\n");

      try {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (e) {
        console.error("Kore Reports CSV download error:", e);
      }
    }

    function exportWorkItemsCsv(items) {
      if (!Array.isArray(items)) return;
      const header = [
        "Title",
        "Type",
        "Account",
        "Priority",
        "Status",
        "Requestor",
        "Created",
        "Due",
        "Notes"
      ];
      const rows = [header];

      items.forEach(function (item) {
        rows.push([
          item.title || "",
          item.type || "",
          item.account || "",
          item.priority || "",
          item.status || "",
          item.requestor || "",
          item.created || "",
          item.due || "",
          (item.notes || "").replace(/\r?\n/g, " ")
        ]);
      });

      const today = new Date();
      const stamp = today.toISOString().slice(0, 10);
      downloadCsv("kore-work-reports-" + stamp + ".csv", rows);
    }

    function exportSummaryCsv(items) {
      if (!Array.isArray(items)) return;
      const summary = summarise(items);
      const rows = [];

      rows.push(["Metric", "Value"]);
      rows.push(["Total Requests", String(summary.total || 0)]);
      rows.push(["Open Requests", String(summary.open || 0)]);
      rows.push(["Completed Requests", String(summary.completed || 0)]);
      rows.push(["Overdue Requests", String(summary.overdue || 0)]);
      rows.push([]);

      if (summary.byStatus) {
        rows.push(["Status", "Count"]);
        Object.keys(summary.byStatus).forEach(function (key) {
          rows.push([key, String(summary.byStatus[key])]);
        });
        rows.push([]);
      }

      if (summary.byPriority) {
        rows.push(["Priority", "Count"]);
        Object.keys(summary.byPriority).forEach(function (key) {
          rows.push([key, String(summary.byPriority[key])]);
        });
        rows.push([]);
      }

      const today = new Date();
      const stamp = today.toISOString().slice(0, 10);
      downloadCsv("kore-work-summary-" + stamp + ".csv", rows);
    }

    // Initial render
    try {
      snapshot = snapshotAndRender();
    } catch (e) {
      console.error("Kore Reports init error:", e);
    }

    if (refreshBtn) {
      refreshBtn.addEventListener("click", function () {
        try {
          snapshot = snapshotAndRender();
        } catch (e) {
          console.error("Kore Reports refresh error:", e);
        }
      });
    }

    if (exportWorkBtn) {
      exportWorkBtn.addEventListener("click", function () {
        try {
          const items = snapshot && Array.isArray(snapshot.items)
            ? snapshot.items
            : loadWorkItems();
          exportWorkItemsCsv(items);
        } catch (e) {
          console.error("Kore Reports export work error:", e);
        }
      });
    }

    if (exportSummaryBtn) {
      exportSummaryBtn.addEventListener("click", function () {
        try {
          const items = snapshot && Array.isArray(snapshot.items)
            ? snapshot.items
            : loadWorkItems();
          exportSummaryCsv(items);
        } catch (e) {
          console.error("Kore Reports export summary error:", e);
        }
      });
    }

  });
})();
