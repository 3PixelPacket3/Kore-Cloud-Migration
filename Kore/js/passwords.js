(function () {
  const lengthInput = document.getElementById('pwLength');
  const lengthValue = document.getElementById('pwLengthValue');
  const includeLower = document.getElementById('pwIncludeLower');
  const includeUpper = document.getElementById('pwIncludeUpper');
  const includeNumbers = document.getElementById('pwIncludeNumbers');
  const includeSymbols = document.getElementById('pwIncludeSymbols');
  const output = document.getElementById('pwOutput');
  const generateBtn = document.getElementById('pwGenerateBtn');
  const copyBtn = document.getElementById('pwCopyBtn');

  if (!lengthInput || !lengthValue || !output || !generateBtn) return;

  function syncLengthLabel() {
    lengthValue.textContent = lengthInput.value;
  }

  function buildCharset() {
    let chars = '';
    if (includeLower && includeLower.checked) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (includeUpper && includeUpper.checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers && includeNumbers.checked) chars += '0123456789';
    if (includeSymbols && includeSymbols.checked) chars += '!@#$%^&*()-_=+[]{};:,.<>/?';
    return chars;
  }

  function generatePassword() {
    const length = parseInt(lengthInput.value, 10) || 16;
    const charset = buildCharset();
    if (!charset) {
      alert('Select at least one character set (lowercase, uppercase, numbers, or symbols).');
      return;
    }
    let pw = '';
    for (let i = 0; i < length; i++) {
      const idx = Math.floor(Math.random() * charset.length);
      pw += charset.charAt(idx);
    }
    output.value = pw;
  }

  function copyPassword() {
    if (!output.value) return;
    output.select();
    try {
      const ok = document.execCommand('copy');
      if (!ok) {
        // Fallback: use clipboard API when available
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(output.value).catch(() => {});
        }
      }
    } catch (e) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(output.value).catch(() => {});
      }
    }
  }

  syncLengthLabel();
  lengthInput.addEventListener('input', syncLengthLabel);
  generateBtn.addEventListener('click', generatePassword);
  if (copyBtn) copyBtn.addEventListener('click', copyPassword);
})();
