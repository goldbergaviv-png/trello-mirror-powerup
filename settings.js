const t = window.TrelloPowerUp.iframe();
const BACKEND = "https://trello-mirror-worker.goldberg-aviv.workers.dev";
const SECRET = "mirror-v1-2026-goldberg-sync";

function setStatus(msg, type = "") {
  const el = document.getElementById("status");
  el.textContent = msg || "";
  el.className = "";
  if (type) el.classList.add(type);
}

function setPreview(data) {
  document.getElementById("configPreview").value =
    typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

async function api(path, options = {}) {
  const res = await fetch(`${BACKEND}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      "x-webhook-secret": SECRET
    }
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch (_) { data = text; }
  if (!res.ok) throw new Error(typeof data === "string" ? data : JSON.stringify(data));
  return data;
}

function selectedBoardIds() {
  return Array.from(document.querySelectorAll('input[name="sourceBoard"]:checked')).map(x => x.value);
}

function selectedListNames() {
  return Array.from(document.querySelectorAll('input[name="syncList"]:checked')).map(x => x.value);
}

function renderBoards(boards, saved = []) {
  const box = document.getElementById("sourceBoardsBox");
  box.innerHTML = "";
  boards.forEach(board => {
    const row = document.createElement("label");
    row.className = "check-row";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = "sourceBoard";
    input.value = board.id;
    if (saved.includes(board.id)) input.checked = true;
    const span = document.createElement("span");
    span.textContent = board.name;
    row.appendChild(input);
    row.appendChild(span);
    box.appendChild(row);
  });
}

function renderLists(lists, saved = []) {
  const box = document.getElementById("listsBox");
  box.innerHTML = "";
  lists.forEach(list => {
    const row = document.createElement("label");
    row.className = "check-row";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = "syncList";
    input.value = list.name;
    if (saved.includes(list.name)) input.checked = true;
    const span = document.createElement("span");
    span.textContent = list.name;
    row.appendChild(input);
    row.appendChild(span);
    box.appendChild(row);
  });
}

async function loadBoards() {
  const mirrorSelect = document.getElementById("mirrorBoard");
  mirrorSelect.innerHTML = "";
  const data = await api("/boards");
  const boards = data.items || [];
  boards.forEach(board => {
    const opt = document.createElement("option");
    opt.value = board.id;
    opt.textContent = board.name;
    mirrorSelect.appendChild(opt);
  });

  const saved = await t.get("board", "shared", "amgMirrorConfig");
  if (saved?.mirrorBoardId) mirrorSelect.value = saved.mirrorBoardId;
  renderBoards(boards, saved?.sourceBoards || []);

  mirrorSelect.addEventListener("change", loadListsForMirror);
  if (mirrorSelect.value) await loadListsForMirror();
}

async function loadListsForMirror() {
  const mirrorBoardId = document.getElementById("mirrorBoard").value;
  if (!mirrorBoardId) return;
  const saved = await t.get("board", "shared", "amgMirrorConfig");
  const data = await api(`/boards/${mirrorBoardId}/lists`);
  renderLists(data.items || [], saved?.lists || []);
}

async function loadSavedConfigs() {
  try {
    const data = await api("/config");
    setPreview(data.items || []);
  } catch (e) {
    setPreview("Failed to load saved configurations");
  }
}

function validateForm(mirrorBoardId, sourceBoards, lists) {
  if (!mirrorBoardId) throw new Error("צריך לבחור Mirror Board");
  if (!sourceBoards.length) throw new Error("צריך לבחור לפחות Source Board אחד");
  if (!lists.length) throw new Error("צריך לבחור לפחות רשימה אחת לסנכרון");
  if (sourceBoards.includes(mirrorBoardId)) throw new Error("Mirror Board לא יכול להיות גם Source Board");
}

async function saveConfig() {
  try {
    setStatus("Saving configuration...");
    const mirrorEl = document.getElementById("mirrorBoard");
    const mirrorBoardId = mirrorEl.value;
    const mirrorBoardName = mirrorEl.options[mirrorEl.selectedIndex]?.text || "";
    const allBoardOptions = Array.from(mirrorEl.options);
    const sourceBoards = selectedBoardIds();
    const lists = selectedListNames();

    validateForm(mirrorBoardId, sourceBoards, lists);

    for (const sourceBoardId of sourceBoards) {
      const sourceBoardName = allBoardOptions.find(o => o.value === sourceBoardId)?.text || sourceBoardId;

      await api("/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mirrorBoardId,
          mirrorBoardName,
          sourceBoardId,
          sourceBoardName,
          mirroredLists: lists
        })
      });

      await api("/webhooks/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boardId: sourceBoardId,
          description: `Source board webhook - ${sourceBoardName}`
        })
      });
    }

    await api("/webhooks/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boardId: mirrorBoardId,
        description: `Mirror board webhook - ${mirrorBoardName}`
      })
    });

    await t.set("board", "shared", "amgMirrorConfig", {
      mirrorBoardId,
      mirrorBoardName,
      sourceBoards,
      lists
    });

    setStatus("Configuration saved and webhooks registered.", "ok");
    await loadSavedConfigs();
  } catch (err) {
    console.error(err);
    setStatus("שגיאה בשמירה: " + err.message, "error");
  }
}

async function runFullSync() {
  try {
    setStatus("Running full sync...");
    await api("/sync/bootstrap", { method: "POST" });
    setStatus("Full sync completed.", "ok");
    await loadSavedConfigs();
  } catch (err) {
    console.error(err);
    setStatus("Full sync failed: " + err.message, "error");
  }
}

function bindToolbar() {
  document.getElementById("selectAllBoardsBtn").addEventListener("click", () => {
    document.querySelectorAll('input[name="sourceBoard"]').forEach(x => x.checked = true);
  });
  document.getElementById("clearBoardsBtn").addEventListener("click", () => {
    document.querySelectorAll('input[name="sourceBoard"]').forEach(x => x.checked = false);
  });
  document.getElementById("selectAllListsBtn").addEventListener("click", () => {
    document.querySelectorAll('input[name="syncList"]').forEach(x => x.checked = true);
  });
  document.getElementById("clearListsBtn").addEventListener("click", () => {
    document.querySelectorAll('input[name="syncList"]').forEach(x => x.checked = false);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("saveBtn").addEventListener("click", saveConfig);
  document.getElementById("runSyncBtn").addEventListener("click", runFullSync);
  bindToolbar();

  try {
    await loadBoards();
    await loadSavedConfigs();
    setStatus("Ready.", "ok");
  } catch (err) {
    console.error(err);
    setStatus("טעינת הנתונים נכשלה: " + err.message, "error");
  }
});
