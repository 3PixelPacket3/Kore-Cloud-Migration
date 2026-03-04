(function () {
  const scratch = document.getElementById('notesScratch');
  const list = document.getElementById('notesChecklist');
  const newInput = document.getElementById('notesNewItem');
  const addBtn = document.getElementById('notesAddBtn');

  if (!scratch || !list || !newInput || !addBtn) return;

  const SCRATCH_KEY = 'koreNotesScratch';
  const LIST_KEY = 'koreNotesChecklist';

  function loadScratch() {
    try {
      scratch.value = localStorage.getItem(SCRATCH_KEY) || '';
    } catch (e) {
      scratch.value = '';
    }
  }

  function saveScratch() {
    try {
      localStorage.setItem(SCRATCH_KEY, scratch.value || '');
    } catch (e) {
      // ignore
    }
  }

  function loadList() {
    try {
      const raw = localStorage.getItem(LIST_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function saveList(items) {
    try {
      localStorage.setItem(LIST_KEY, JSON.stringify(items));
    } catch (e) {
      // ignore
    }
  }

  function renderList() {
    const items = loadList();
    list.innerHTML = '';
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'notes-empty';
      empty.textContent = 'No tasks yet. Add a few quick items to track.';
      list.appendChild(empty);
      return;
    }
    items.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'notes-item';
      if (item.done) row.classList.add('notes-item-done');

      const left = document.createElement('label');
      left.className = 'notes-item-main';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = !!item.done;
      cb.addEventListener('change', () => {
        const current = loadList();
        if (!current[idx]) return;
        current[idx].done = cb.checked;
        saveList(current);
        renderList();
      });

      const span = document.createElement('span');
      span.textContent = item.text;

      left.appendChild(cb);
      left.appendChild(span);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'notes-item-remove';
      removeBtn.textContent = '×';
      removeBtn.title = 'Remove item';
      removeBtn.addEventListener('click', () => {
        const current = loadList();
        current.splice(idx, 1);
        saveList(current);
        renderList();
      });

      row.appendChild(left);
      row.appendChild(removeBtn);
      list.appendChild(row);
    });
  }

  function addItem() {
    const text = (newInput.value || '').trim();
    if (!text) return;
    const items = loadList();
    items.push({ text, done: false });
    saveList(items);
    newInput.value = '';
    renderList();
  }

  loadScratch();
  renderList();

  scratch.addEventListener('input', saveScratch);
  addBtn.addEventListener('click', addItem);
  newInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  });
})();
