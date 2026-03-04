
// LOD Validation Tool
// Client-side validator for LOD / PALOD CSV files.
// Runs completely offline in the browser with no backend.

(function () {
  var fileInput = document.getElementById('lodFileInput');
  var validateBtn = document.getElementById('lodValidateBtn');
  var modeSelect = document.getElementById('lodMode');
  var stopOnFatalCheckbox = document.getElementById('lodStopOnFatal');
  var statusEl = document.getElementById('lodStatus');

  var totalRowsEl = document.getElementById('lodTotalRows');
  var errorRowCountEl = document.getElementById('lodErrorRowCount');
  var totalIssuesEl = document.getElementById('lodTotalIssues');

  var noErrorsMessageEl = document.getElementById('lodNoErrorsMessage');
  var errorsContainerEl = document.getElementById('lodErrorsContainer');
  var errorsTableBodyEl = document.getElementById('lodErrorsTableBody');

  var downloadErrorCsvBtn = document.getElementById('lodDownloadErrorCsvBtn');
  var downloadHtmlReportBtn = document.getElementById('lodDownloadHtmlReportBtn');
  var copyResultsBtn = document.getElementById('lodCopyResultsBtn');

  var lastValidation = null;

  if (!fileInput || !validateBtn) {
    // Page not present / DOM not ready; bail gracefully.
    return;
  }

  validateBtn.addEventListener('click', function () {
    if (!fileInput.files || !fileInput.files[0]) {
      setStatus('Please choose a LOD / PALOD CSV file first.', true);
      return;
    }

    var file = fileInput.files[0];
    var reader = new FileReader();

    setStatus('Reading file "' + file.name + '"…', false);

    reader.onload = function (e) {
      try {
        var text = e.target.result || '';
        var mode = (modeSelect && modeSelect.value) || 'lod';
        var stopOnFatal = !!(stopOnFatalCheckbox && stopOnFatalCheckbox.checked);

        var result = validateLodCsv(text, mode, stopOnFatal);
        lastValidation = result;
        renderValidation(result);
        setStatus('Validation complete.', false);
      } catch (err) {
        console.error(err);
        lastValidation = null;
        renderEmpty();
        setStatus('Validation failed: ' + (err && err.message ? err.message : String(err)), true);
      }
    };

    reader.onerror = function () {
      setStatus('Unable to read the file. Please try again or use a different browser.', true);
    };

    reader.readAsText(file);
  });

  if (downloadErrorCsvBtn) {
    downloadErrorCsvBtn.addEventListener('click', function () {
      if (!lastValidation || !lastValidation.issues || !lastValidation.issues.length) {
        setStatus('No issues to export. Run validation first.', true);
        return;
      }
      var csv = buildIssueCsv(lastValidation);
      downloadTextFile(csv, buildSuggestedFilename(lastValidation, 'lod-validation-issues.csv'), 'text/csv');
    });
  }

  if (downloadHtmlReportBtn) {
    downloadHtmlReportBtn.addEventListener('click', function () {
      if (!lastValidation || !lastValidation.rows || !lastValidation.rows.length) {
        setStatus('Nothing to export. Run validation first.', true);
        return;
      }
      var html = buildHtmlReport(lastValidation);
      downloadTextFile(html, buildSuggestedFilename(lastValidation, 'lod-validation-report.html'), 'text/html');
    });
  }

  if (copyResultsBtn) {
    copyResultsBtn.addEventListener('click', function () {
      if (!lastValidation) {
        setStatus('Nothing to copy. Run validation first.', true);
        return;
      }
      var text = buildClipboardSummary(lastValidation);
      if (!text) {
        setStatus('Nothing to copy. Run validation first.', true);
        return;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(function () {
            setStatus('Validation results copied to clipboard.', false);
          })
          .catch(function (err) {
            console.error(err);
            fallbackCopyText(text);
          });
      } else {
        fallbackCopyText(text);
      }
    });
  }

  function setStatus(message, isError) {
    if (!statusEl) return;
    statusEl.textContent = message || '';
    if (isError) {
      statusEl.classList.add('lod-status-error');
    } else {
      statusEl.classList.remove('lod-status-error');
    }
  }

  function renderEmpty() {
    if (totalRowsEl) totalRowsEl.textContent = '0';
    if (errorRowCountEl) errorRowCountEl.textContent = '0';
    if (totalIssuesEl) totalIssuesEl.textContent = '0';
    if (noErrorsMessageEl) noErrorsMessageEl.style.display = 'none';
    if (errorsContainerEl) errorsContainerEl.style.display = 'none';
    if (errorsTableBodyEl) errorsTableBodyEl.innerHTML = '';
  }

  function renderValidation(result) {
    if (!result) {
      renderEmpty();
      return;
    }

    if (totalRowsEl) totalRowsEl.textContent = String(result.dataRowCount || 0);
    if (errorRowCountEl) errorRowCountEl.textContent = String(result.errorRowCount || 0);
    if (totalIssuesEl) totalIssuesEl.textContent = String(result.issues.length || 0);

    if (!result.issues.length) {
      if (noErrorsMessageEl) noErrorsMessageEl.style.display = 'block';
      if (errorsContainerEl) errorsContainerEl.style.display = 'none';
      if (errorsTableBodyEl) errorsTableBodyEl.innerHTML = '';
      return;
    }

    if (noErrorsMessageEl) noErrorsMessageEl.style.display = 'none';
    if (errorsContainerEl) errorsContainerEl.style.display = 'block';

    if (!errorsTableBodyEl) return;
    var rowsHtml = [];
    for (var i = 0; i < result.issues.length; i++) {
      var issue = result.issues[i];
      rowsHtml.push(
        '<tr>' +
          '<td>' + escapeHtml(String(issue.row)) + '</td>' +
          '<td>' + escapeHtml(issue.columnName || '') + '</td>' +
          '<td>' + escapeHtml(issue.value == null ? '' : String(issue.value)) + '</td>' +
          '<td><span class="lod-error-pill">' + escapeHtml(issue.message || '') + '</span></td>' +
        '</tr>'
      );
    }
    errorsTableBodyEl.innerHTML = rowsHtml.join('');
  }

  // ------------- Core Validation -------------

  // Very small CSV parser that supports quoted fields and commas inside quotes.
  function parseCsv(text) {
    var rows = [];
    var row = [];
    var cur = '';
    var inQuotes = false;

    for (var i = 0; i < text.length; i++) {
      var ch = text[i];

      if (inQuotes) {
        if (ch === '"') {
          var peek = text[i + 1];
          if (peek === '"') {
            // Escaped "
            cur += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          cur += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          row.push(cur);
          cur = '';
        } else if (ch === '\r') {
          // ignore
        } else if (ch === '\n') {
          row.push(cur);
          rows.push(row);
          row = [];
          cur = '';
        } else {
          cur += ch;
        }
      }
    }

    if (cur.length || row.length) {
      row.push(cur);
      rows.push(row);
    }

    // Drop trailing empty rows
    var cleaned = [];
    for (var r = 0; r < rows.length; r++) {
      var cells = rows[r];
      var allEmpty = true;
      for (var c = 0; c < cells.length; c++) {
        if (String(cells[c]).trim() !== '') {
          allEmpty = false;
          break;
        }
      }
      if (!allEmpty) {
        cleaned.push(cells);
      }
    }

    return cleaned;
  }

  function validateLodCsv(text, mode, stopOnFatal) {
    var rows = parseCsv(text || '');
    if (!rows.length) {
      throw new Error('The file appears to be empty.');
    }

    var header = rows[0];
    var dataRows = rows.slice(1);
    var EXPECTED_COLUMNS = 28;

    if (header.length !== EXPECTED_COLUMNS) {
      if (stopOnFatal) {
        throw new Error('Unexpected column layout. Expected ' + EXPECTED_COLUMNS +
          ' columns but found ' + header.length + '. Check that you are using the standard LOD template.');
      }
    }

    var DISPLAY_COLUMN_NAMES = [
      'Group Code',
      'Customer #',
      'Item Number',
      'Quantity',
      'Customer PO',
      'Name',
      'Ship-to-Address 1',
      'Ship-to Address 2',
      'Ship-to Address 3',
      'City',
      'State',
      'ZIP',
      'Country',
      'Contact name',
      'Contact',
      'Order Type',
      'Service Level of Shipment',
      'Allocation Rule',
      'Customer In Hands Date',
      'On or Before Indicator (O or B)',
      'Must Ship Date',
      'Address Over-Ride',
      'Carrier',
      'Ship From Warehouse',
      'GL-Code',
      'Confirmation Email',
      'Ship Confirmation Email',
      'Site'
    ];

    function getColName(index) {
      if (header[index] && String(header[index]).trim()) {
        return String(header[index]).trim();
      }
      return DISPLAY_COLUMN_NAMES[index] || ('Column ' + (index + 1));
    }

    var issues = [];
    var errorRowSet = {};

    function addIssue(rowIndex, colIndex, message, value) {
      issues.push({
        row: rowIndex,
        columnIndex: colIndex,
        columnName: getColName(colIndex),
        message: message,
        value: value
      });
      errorRowSet[rowIndex] = true;
    }

    // Map of Customer PO -> normalized address key
    var poAddressMap = {};

    for (var i = 0; i < dataRows.length; i++) {
      var row = dataRows[i] || [];
      var rowIndex = i + 2; // account for header row

      // Skip if the row is completely blank
      var nonEmpty = false;
      for (var c = 0; c < row.length; c++) {
        if (String(row[c] || '').trim() !== '') {
          nonEmpty = true;
          break;
        }
      }
      if (!nonEmpty) {
        continue;
      }

      function val(idx) {
        return (row[idx] == null ? '' : String(row[idx])).trim();
      }

      // 0 - Group Code: must be all caps, non-empty
      (function () {
        var v = val(0);
        if (!v) {
          addIssue(rowIndex, 0, 'Group Code is required.', v);
        } else if (v !== v.toUpperCase()) {
          addIssue(rowIndex, 0, 'Group Code must be uppercase.', v);
        }
      })();

      // 1 - Customer #: numeric, must not end in "00"
      (function () {
        var v = val(1);
        if (!v) {
          addIssue(rowIndex, 1, 'Customer # is required.', v);
          return;
        }
        if (!/^\d+$/.test(v)) {
          addIssue(rowIndex, 1, 'Customer # must be numeric.', v);
        }
        if (v.slice(-2) === '00') {
          addIssue(rowIndex, 1, 'Customer # must be a valid ship-to and cannot end in "00".', v);
        }
      })();

      // 2 - Item Number: required
      (function () {
        var v = val(2);
        if (!v) {
          addIssue(rowIndex, 2, 'Item Number is required.', v);
        }
      })();

      // 3 - Quantity: must be a positive number
      (function () {
        var v = val(3);
        if (!v) {
          addIssue(rowIndex, 3, 'Quantity is required.', v);
          return;
        }
        if (!/^\d+$/.test(v)) {
          addIssue(rowIndex, 3, 'Quantity must be a whole number.', v);
        } else if (parseInt(v, 10) <= 0) {
          addIssue(rowIndex, 3, 'Quantity must be greater than zero.', v);
        }
      })();

      // 4 - Customer PO
      (function () {
        var v = val(4);
        if (!v) {
          addIssue(rowIndex, 4, 'Customer PO is required.', v);
          return;
        }
        if (v.length > 20) {
          addIssue(rowIndex, 4, 'Customer PO must be 20 characters or fewer.', v);
        }

        var orderType = val(15);

        if (mode === 'palod') {
          if (v.indexOf('1NAPR') !== 0) {
            addIssue(rowIndex, 4, 'PALOD requires Customer PO to start with 1NAPR.', v);
          }
        } else {
          // Standard LOD: only enforce 1NAPR for PA orders per the rules doc
          if (orderType === 'PA' && v.indexOf('1NAPR') !== 0) {
            addIssue(rowIndex, 4, 'PA orders must have Customer PO starting with 1NAPR.', v);
          }
        }

        // PO uniqueness by address
        var addrKeyParts = [
          val(1),  // Customer #
          val(5),  // Name
          val(6),  // Ship-to-Address 1
          val(7),  // Ship-to Address 2
          val(8),  // Ship-to Address 3
          val(9),  // City
          val(10), // State
          val(11), // ZIP
          val(12)  // Country
        ];
        var addrKey = addrKeyParts.join('|').toUpperCase();

        if (v) {
          if (poAddressMap[v] && poAddressMap[v] !== addrKey) {
            addIssue(rowIndex, 4, 'Customer PO is reused for a different address. Each address must have a unique PO.', v);
          } else if (!poAddressMap[v]) {
            poAddressMap[v] = addrKey;
          }
        }
      })();

      // 5 - Name: required
      (function () {
        var v = val(5);
        if (!v) {
          addIssue(rowIndex, 5, 'Customer name is required.', v);
        }
      })();

      // 6 - Ship-to-Address 1: max 35 chars if present
      (function () {
        var v = val(6);
        if (v && v.length > 35) {
          addIssue(rowIndex, 6, 'Ship-to Address 1 must be 35 characters or fewer.', v);
        }
      })();

      // 7 - Ship-to Address 2: required
      (function () {
        var v = val(7);
        if (!v) {
          addIssue(rowIndex, 7, 'Ship-to Address 2 (street / PO Box) is required.', v);
          return;
        }
        // Rudimentary check for two addresses separated by a comma, e.g., "PO Box 508, 2101 Claire Ct."
        if (/PO\s*BOX/i.test(v) && /,/.test(v) && /\d/.test(v.split(',')[1] || '')) {
          addIssue(rowIndex, 7, 'Ship-to Address 2 appears to contain two addresses. Use only one street or PO Box.', v);
        }
      })();

      // 8 - Ship-to Address 3: optional, no strict validation

      // 9 - City: required
      (function () {
        var v = val(9);
        if (!v) {
          addIssue(rowIndex, 9, 'City is required.', v);
        }
      })();

      // 10 - State: must be 2 uppercase letters
      (function () {
        var v = val(10);
        if (!v) {
          addIssue(rowIndex, 10, 'State is required.', v);
          return;
        }
        if (!/^[A-Z]{2}$/.test(v)) {
          addIssue(rowIndex, 10, 'State must be two uppercase letters (e.g., NY).', v);
        }
      })();

      // 11 - ZIP: numeric, typically 5 or 9 digits (with optional dash).
      // Some CSV/Excel exports may drop a leading zero; in that case, treat the value as valid.
      (function () {
        var v = val(11);
        if (!v) {
          addIssue(rowIndex, 11, 'ZIP is required.', v);
          return;
        }
        var cleaned = String(v).replace(/-/g, '').trim();
        if (!/^\d+$/.test(cleaned)) {
          addIssue(rowIndex, 11, 'ZIP must be numeric.', v);
          return;
        }
        // If we have 4 or 8 digits, assume a leading zero was dropped by Excel/CSV and virtually pad it.
        if (cleaned.length === 4 || cleaned.length === 8) {
          cleaned = '0' + cleaned;
        }
        if (!(cleaned.length === 5 || cleaned.length === 9)) {
          addIssue(rowIndex, 11, 'ZIP should be 5 or 9 digits long.', v);
        }
      })();

      // 12 - Country: must be 2 uppercase letters (e.g., US)
      (function () {
        var v = val(12);
        if (!v) {
          addIssue(rowIndex, 12, 'Country is required.', v);
          return;
        }
        if (!/^[A-Z]{2}$/.test(v)) {
          addIssue(rowIndex, 12, 'Country must be a two-letter uppercase code (e.g., US).', v);
        }
      })();

      // 14 - Contact: 10 digits, no spaces or dashes
      (function () {
        var v = val(14);
        if (!v) return;
        var digits = v.replace(/\D/g, '');
        if (digits.length !== 10) {
          addIssue(rowIndex, 14, 'Contact phone must be 10 digits with no spaces or dashes.', v);
        }
      })();

      // 15 - Order Type: must be GO, GR, PA, or DO
      (function () {
        var v = val(15);
        if (!v) {
          addIssue(rowIndex, 15, 'Order Type is required.', v);
          return;
        }
        var allowed = { GO: true, GR: true, PA: true, DO: true };
        if (!allowed[v]) {
          addIssue(rowIndex, 15, 'Order Type must be GO, GR, PA, or DO.', v);
        }
      })();

      // 16 - Service Level of Shipment: must be uppercase if present
      (function () {
        var v = val(16);
        if (!v) return;
        if (v !== v.toUpperCase()) {
          addIssue(rowIndex, 16, 'Service Level must be uppercase (e.g., BEST, NEXT, 2DAY, 3DAY, MAIL).', v);
        }
      })();

      // 17 - Allocation Rule: must be "O"
      (function () {
        var v = val(17);
        if (!v) {
          addIssue(rowIndex, 17, 'Allocation Rule is required and should be "O".', v);
          return;
        }
        if (v !== 'O') {
          addIssue(rowIndex, 17, 'Allocation Rule must be "O" for LODs.', v);
        }
      })();

      // 18 - Customer In Hands Date: required unless Must Ship Date is provided; format 04.12.2013
      (function () {
        var inHands = val(18);
        var mustShip = val(20);
        if (!inHands) {
          // If there is no In Hands Date but we do have a Must Ship Date, treat as valid
          if (!mustShip) {
            addIssue(rowIndex, 18, 'Customer In Hands Date is required when Must Ship Date is not provided.', inHands);
          }
          return;
        }
        if (!/^\d{2}\.\d{2}\.\d{4}$/.test(inHands)) {
          addIssue(rowIndex, 18, 'Customer In Hands Date must be in format MM.DD.YYYY.', inHands);
        }
      })();

      // 19 - On or Before Indicator: must be O or B
      (function () {
        var v = val(19);
        if (!v) {
          addIssue(rowIndex, 19, 'On or Before Indicator is required (O or B).', v);
          return;
        }
        if (!(v === 'O' || v === 'B')) {
          addIssue(rowIndex, 19, 'On or Before Indicator must be "O" or "B".', v);
        }
      })();

      // 20 - Must Ship Date: optional, but if present must be a valid date format
      (function () {
        var v = val(20);
        if (!v) return;
        if (!/^\d{2}\.\d{2}\.\d{4}$/.test(v)) {
          addIssue(rowIndex, 20, 'Must Ship Date must be in format MM.DD.YYYY.', v);
        }
      })();

      // 21 - Address Over-Ride: must be Y or N
      (function () {
        var v = val(21);
        if (!v) {
          addIssue(rowIndex, 21, 'Address Over-Ride must be Y or N.', v);
          return;
        }
        if (!(v === 'Y' || v === 'N')) {
          addIssue(rowIndex, 21, 'Address Over-Ride must be Y or N.', v);
        }
      })();

      // 23 - Ship From Warehouse: should typically be blank
      (function () {
        var v = val(23);
        if (v) {
          addIssue(rowIndex, 23, 'Ship From Warehouse should be blank for standard LOD processing.', v);
        }
      })();

      // 25 - Confirmation Email
      // 26 - Ship Confirmation Email
      (function () {
        var conf = val(25);
        var shipConf = val(26);
        var site = val(27);

        function validateEmailField(v, colIndex) {
          if (!v) return;
          var parts = v.split(';');
          for (var j = 0; j < parts.length; j++) {
            var email = parts[j].trim();
            if (!email) continue;
            if (email.indexOf(' ') !== -1) {
              addIssue(rowIndex, colIndex, 'Email addresses should not contain spaces.', email);
            }
            if (email.indexOf(',com') !== -1) {
              addIssue(rowIndex, colIndex, 'Email appears to contain ",com" instead of ".com".', email);
            }
            if (email.indexOf('@') === -1) {
              addIssue(rowIndex, colIndex, 'Email address is missing "@".', email);
            }
            var atIndex = email.indexOf('@');
            if (atIndex !== -1 && email.indexOf('.', atIndex) === -1) {
              addIssue(rowIndex, colIndex, 'Email domain must contain a dot after "@".', email);
            }
          }
        }

        validateEmailField(conf, 25);
        validateEmailField(shipConf, 26);

        if ((conf || shipConf) && !site) {
          addIssue(rowIndex, 27, 'Site is required when using confirmation emails.', site);
        }
      })();
    }

    var errorRowCount = Object.keys(errorRowSet).length;

    return {
      mode: mode,
      header: header,
      rows: rows,
      dataRows: dataRows,
      dataRowCount: dataRows.length,
      errorRowCount: errorRowCount,
      issues: issues
    };
  }

  function buildClipboardSummary(result) {
    if (!result) return '';
    var lines = [];

    lines.push('LOD Validation Results');
    lines.push('Mode: ' + (result.mode || 'LOD'));
    lines.push('Total data rows: ' + (result.dataRowCount || 0));
    lines.push('Rows with issues: ' + (result.errorRowCount || 0));
    lines.push('Total issues: ' + ((result.issues && result.issues.length) || 0));
    lines.push('');

    if (!result.issues || !result.issues.length) {
      lines.push('No issues found. File passed validation.');
      return lines.join('\n');
    }

    lines.push('Issues:');

    for (var i = 0; i < result.issues.length; i++) {
      var issue = result.issues[i];
      var line = 'Row ' + issue.row + ' – ' +
        (issue.columnName || ('Column ' + (issue.columnIndex + 1))) +
        ' – ' + issue.message;

      if (issue.value != null && String(issue.value).trim() !== '') {
        line += ' (Value: ' + String(issue.value) + ')';
      }

      lines.push(line);
    }

    return lines.join('\n');
  }

  function fallbackCopyText(text) {
    try {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      var succeeded = false;
      try {
        succeeded = document.execCommand('copy');
      } catch (err) {
        console.error(err);
      }

      document.body.removeChild(textarea);

      if (succeeded) {
        setStatus('Validation results copied to clipboard.', false);
      } else {
        setStatus('Unable to copy to clipboard in this browser.', true);
      }
    } catch (err) {
      console.error(err);
      setStatus('Unable to copy to clipboard.', true);
    }
  }


  // ------------- Export helpers -------------

  function buildIssueCsv(result) {
    var lines = [];
    lines.push('Row,Column,Value,Issue');
    for (var i = 0; i < result.issues.length; i++) {
      var issue = result.issues[i];
      var cols = [
        String(issue.row),
        csvQuote(issue.columnName || ''),
        csvQuote(issue.value == null ? '' : String(issue.value)),
        csvQuote(issue.message || '')
      ];
      lines.push(cols.join(','));
    }
    return lines.join('\r\n');
  }

  function csvQuote(value) {
    var v = String(value == null ? '' : value);
    if (/[",\r\n]/.test(v)) {
      return '"' + v.replace(/"/g, '""') + '"';
    }
    return v;
  }

  function buildHtmlReport(result) {
    var header = result.header || [];
    var rows = result.rows || [];
    var issues = result.issues || [];

    var badCellMap = {};
    for (var i = 0; i < issues.length; i++) {
      var key = issues[i].row + ':' + issues[i].columnIndex;
      badCellMap[key] = true;
    }

    var html = [];
    html.push('<!DOCTYPE html>');
    html.push('<html lang="en">');
    html.push('<head>');
    html.push('<meta charset="UTF-8">');
    html.push('<title>LOD Validation Report</title>');
    html.push('<style>');
    html.push('body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background:#f9fafb; color:#111827; margin:0; padding:1.5rem; }');
    html.push('h1 { margin-top:0; font-size:1.5rem; color:#111827; }');
    html.push('.metrics { display:flex; flex-wrap:wrap; gap:1rem; margin-bottom:1rem; }');
    html.push('.metric { padding:0.5rem 0.75rem; background:#eff6ff; border-radius:0.5rem; border:1px solid #bfdbfe; }');
    html.push('.metric-label { font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; color:#6b7280; }');
    html.push('.metric-value { font-size:1.1rem; font-weight:600; display:block; margin-top:0.15rem; color:#111827; }');
    html.push('table { width:100%; border-collapse:collapse; margin-top:1rem; font-size:0.85rem; background:#ffffff; border-radius:0.5rem; overflow:hidden; }');
    html.push('th, td { border:1px solid #e5e7eb; padding:0.35rem 0.5rem; text-align:left; }');
    html.push('th { background:#1f2937; color:#f9fafb; }');
    html.push('tr:nth-child(even) td { background:#f9fafb; }');
    html.push('td.bad-cell { background:#fef2f2; color:#991b1b; font-weight:600; }');
    html.push('th.line-col, td.line-col { width:3rem; text-align:right; font-variant-numeric:tabular-nums; }');html.push('</style>');
    html.push('</head>');
    html.push('<body>');
    html.push('<h1>LOD Validation Report</h1>');
    html.push('<div class="metrics">');
    html.push('<div class="metric"><span class="metric-label">Mode</span><span class="metric-value">' + escapeHtml(result.mode || 'LOD') + '</span></div>');
    html.push('<div class="metric"><span class="metric-label">Data rows</span><span class="metric-value">' + String(result.dataRowCount || 0) + '</span></div>');
    html.push('<div class="metric"><span class="metric-label">Rows with issues</span><span class="metric-value">' + String(result.errorRowCount || 0) + '</span></div>');
    html.push('<div class="metric"><span class="metric-label">Total issues</span><span class="metric-value">' + String(result.issues.length || 0) + '</span></div>');
    html.push('</div>');

    html.push('<table>');
    // header row
    html.push('<thead><tr>');
    html.push('<th class="line-col">Line</th>');
    for (var h = 0; h < header.length; h++) {
      html.push('<th>' + escapeHtml(String(header[h] || '')) + '</th>');
    }
    html.push('</tr></thead>');
    html.push('<tbody>');

    for (var r = 1; r < rows.length; r++) {
      var row = rows[r] || [];
      var rowIndex = r + 1; // row 1 is header; first data row is 2
      html.push('<tr>');
      // Line number column (CSV row index)
      html.push('<td class="line-col">' + String(rowIndex) + '</td>');
      for (var c = 0; c < header.length; c++) {
        var key = (rowIndex) + ':' + c;
        var isBad = !!badCellMap[key];
        var cellRaw = row[c];
        var cellValue = cellRaw == null ? '' : String(cellRaw);
        // Strip non-printable characters that often render as "?" in HTML reports
        cellValue = cellValue.replace(/[\uFFFD]/g, '').replace(/[^\x20-\x7E]/g, '');
        var tdClass = isBad ? ' class="bad-cell"' : '';
        html.push('<td' + tdClass + '>' + escapeHtml(cellValue) + '</td>');
      }
      html.push('</tr>');
    }

html.push('</tbody>');
    html.push('</table>');
    html.push('</body></html>');

    return html.join('');
  }

  function downloadTextFile(content, filename, mimeType) {
    var blob = new Blob([content], { type: mimeType || 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename || 'download.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function buildSuggestedFilename(result, fallback) {
    // We do not directly know the original filename here, so just include the mode.
    var mode = result && result.mode ? String(result.mode).toUpperCase() : 'LOD';
    return mode + '-' + fallback;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
