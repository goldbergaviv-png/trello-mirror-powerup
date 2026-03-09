const t = window.TrelloPowerUp.iframe();
const BACKEND = "https://trello-mirror-worker.goldberg-aviv.workers.dev";
const SECRET = "mirror-v1-2026-goldberg-sync";

function setStatus(msg) {
  document.getElementById("status").textContent = msg || "";
}

function setPreview(data) {
  const box = document.getElementById("configPreview");
  box.value = typeof data === "string" ? data : JSON.stringify(data, null, 2);
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
  let data = null;
  try { data = JSON.parse(text); } catch (_) { data = text; }
  if (!res.ok) throw new Error(typeof data === "string" ? data : JSON.stringify(data));
  return data;
}

async function loadBoards() {
  const mirrorSelect = document.getElementById("mirrorBoard");
  const sourceSelect = document.getElementById("sourceBoards");
  mirrorSelect.innerHTML = "";
  sourceSelect.innerHTML = "";

  try {
    const data = await api("/boards");
    const boards = data.items || [];

    boards.forEach(board => {
      const opt1 = document.createElement("option");
      opt1.value = board.id;
      opt1.text = board.name;
      mirrorSelect.appendChild(opt1);

      const opt2 = document.createElement("option");
      opt2.value = board.id;
      opt2.text = board.name;
      sourceSelect.appendChild(opt2);
    });

    const saved = await t.get("board", "shared", "amgMirrorConfig");
    if (saved?.mirrorBoardId) {
      mirrorSelect.value = saved.mirrorBoardId;
    }
    if (Array.isArray(saved?.sourceBoards)) {
      Array.from(sourceSelect.options).forEach(opt => {
        opt.selected = saved.sourceBoards.includes(opt.value);
      });
    }

    mirrorSelect.addEventListener("change", loadListsForMirror);
    if (mirrorSelect.value) {
      await loadListsForMirror();
    }
  } catch (err) {
    console.error(err);
    setStatus("לא הצלחתי לטעון את רשימת הבורדים. צריך להוסיף backend endpoint /boards.");
  }
}

async function loadListsForMirror() {
  const mirrorBoardId = document.getElementById("mirrorBoard").value;
  const listSelect = document.getElementById("lists");
  listSelect.innerHTML = "";

  if (!mirrorBoardId) return;

  try {
    const data = await api(`/boards/${mirrorBoardId}/lists`);
    const lists = data.items || [];

    lists.forEach(l => {
      const opt = document.createElement("option");
      opt.value = l.name;
      opt.text = l.name;
      listSelect.appendChild(opt);
    });

    const saved = await t.get("board", "shared", "amgMirrorConfig");
    if (Array.isArray(saved?.lists)) {
      Array.from(listSelect.options).forEach(opt => {
        opt.selected = saved.lists.includes(opt.value);
      });
    }
  } catch (err) {
    console.error(err);
    setStatus("לא הצלחתי לטעון את רשימות הבורד. צריך להוסיף backend endpoint /boards/:id/lists.");
  }
}

async function loadSavedConfigs() {
  try {
    const data = await api("/config", { method: "GET" });
    setPreview(data.items || []);
  } catch (err) {
    console.error(err);
    setPreview("Failed to load saved configurations");
  }
}

async function saveConfig() {
  try {
    const mirrorBoardEl = document.getElementById("mirrorBoard");
    const sourceBoardsEl = document.getElementById("sourceBoards");
    const listsEl = document.getElementById("lists");

    const mirrorBoardId = mirrorBoardEl.value;
    const mirrorBoardName = mirrorBoardEl.options[mirrorBoardEl.selectedIndex]?.text || "";

    const sourceBoards = Array.from(sourceBoardsEl.selectedOptions).map(o => ({
      id: o.value,
      name: o.text
    }));

    const lists = Array.from(listsEl.selectedOptions).map(o => o.value);

    if (!mirrorBoardId || sourceBoards.length === 0 || lists.length === 0) {
      setStatus("בחר mirror board, לפחות source board אחד ולפחות רשימה אחת.");
      return;
    }

    for (const source of sourceBoards) {
      await api("/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mirrorBoardId,
          mirrorBoardName,
          sourceBoardId: source.id,
          sourceBoardName: source.name,
          mirroredLists: lists
        })
      });

      await api("/webhooks/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          boardId: source.id,
          description: `Source board webhook - ${source.name}`
        })
      });
    }

    await api("/webhooks/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        boardId: mirrorBoardId,
        description: `Mirror board webhook - ${mirrorBoardName}`
      })
    });

    await t.set("board", "shared", "amgMirrorConfig", {
      mirrorBoardId,
      mirrorBoardName,
      sourceBoards: sourceBoards.map(s => s.id),
      lists
    });

    setStatus("Configuration saved and webhooks registered.");
    await loadSavedConfigs();
  } catch (err) {
    console.error(err);
    setStatus("שגיאה בשמירה: " + err.message);
  }
}

async function runFullSync() {
  try {
    setStatus("Running full sync...");
    await api("/sync/bootstrap", { method: "POST" });
    setStatus("Full sync completed.");
  } catch (err) {
    console.error(err);
    setStatus("Full sync failed: " + err.message);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("saveBtn").addEventListener("click", saveConfig);
  document.getElementById("runSyncBtn").addEventListener("click", runFullSync);

  await loadBoards();
  await loadSavedConfigs();
});
