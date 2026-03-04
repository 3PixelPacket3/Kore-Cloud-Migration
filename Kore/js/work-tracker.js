let workItems = JSON.parse(localStorage.workItems || "[]");
const table = document.getElementById("workTable");

function save() {
  localStorage.workItems = JSON.stringify(workItems);
}

function render() {
  table.innerHTML = "";
  workItems.forEach((item, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td contenteditable>${item.name}</td>
      <td contenteditable>${item.desc}</td>
      <td contenteditable>${item.category}</td>
      <td>
        <input type="range" min="0" max="100" value="${item.progress}"
          oninput="updateProgress(${i}, this.value)">
        ${item.progress}%
      </td>
      <td contenteditable>${item.account}</td>
      <td><input type="date" value="${item.start}"></td>
      <td><input type="date" value="${item.due}"></td>
      <td contenteditable>${item.notes}</td>
      <td contenteditable>${item.attachments}</td>
      <td>
        <button onclick="deleteItem(${i})">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    table.appendChild(row);
  });
}

function addItem() {
  workItems.push({
    name: "New Item",
    desc: "",
    category: "",
    progress: 0,
    account: "",
    start: "",
    due: "",
    notes: "",
    attachments: ""
  });
  save();
  render();
}

function updateProgress(i, value) {
  workItems[i].progress = value;
  save();
  render();
}

function deleteItem(i) {
  if (confirm("Delete this item?")) {
    workItems.splice(i, 1);
    save();
    render();
  }
}

document.getElementById("addItemBtn").onclick = addItem;

document.getElementById("exportBtn").onclick = () => {
  const blob = new Blob([JSON.stringify(workItems, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "work-tracker.json";
  a.click();
};

document.getElementById("importFile").onchange = e => {
  const reader = new FileReader();
  reader.onload = () => {
    workItems = JSON.parse(reader.result);
    save();
    render();
  };
  reader.readAsText(e.target.files[0]);
};

render();
