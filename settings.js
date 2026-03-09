const t = window.TrelloPowerUp.iframe();
const BACKEND = "https://trello-mirror-worker.goldberg-aviv.workers.dev";
const SECRET = "mirror-v1-2026-goldberg-sync";

function setStatus(msg) {
  const el = document.getElementById("status");
  el.textContent = msg || "";
}

async function loadBoards() {
  try {
    const board = await t.board("id", "name");
    const mirrorSelect = document.getElementById("mirrorBoard");
    const sourceSelect = document.getElementById("sourceBoards");

    mirrorSelect.innerHTML = "";
    sourceSelect.innerHTML = "";

    // Current board is always available
    const opt1 = document.createElement("option");
    opt1.value = board.id;
    opt1.text = board.name;
    mirrorSelect.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = board.id;
    opt2.text = board.name;
    sourceSelect.appendChild(opt2);

    // Try to restore previous saved values for this board
    const saved = await t.get("board", "shared", "amgMirrorConfig");
    if (saved?.mirrorBoardId) {
      mirrorSelect.value = saved.mirrorBoardId;
    }
    if (Array.isArray(saved?.sourceBoards)) {
      Array.from(sourceSelect.options).forEach(opt => {
        opt.selected = saved.sourceBoards.includes(opt.value);
      });
    }
  } catch (err) {
    console.error("loadBoards error", err);
    setStatus("Failed to load boards.");
  }
}

async function loadLists() {
  try {
    const lists = await t.lists("name");
    const listSelect = document.getElementById("lists");
    listSelect.innerHTML = "";

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
    console.error("loadLists error", err);
    setStatus("Failed to load lists.");
  }
}

async function saveConfig() {
  try {
    const mirrorBoardId = document.getElementById("mirrorBoard").value;
    const sourceBoards = Array.from(
      document.getElementById("sourceBoards").selectedOptions
    ).map(o => o.value);

    const lists = Array.from(
      document.getElementById("lists").selectedOptions
    ).map(o => o.value);

    if (!mirrorBoardId || sourceBoards.length === 0 || lists.length === 0) {
      setStatus("Choose mirror board, at least one source board, and at least one list.");
      return;
    }

    for (const sourceBoardId of sourceBoards) {
      const res = await fetch(`${BACKEND}/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret": SECRET
        },
        body: JSON.stringify({
          mirrorBoardId,
          sourceBoardId,
          mirroredLists: lists
        })
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Config save failed: ${res.status} ${txt}`);
      }
    }

    await t.set("board", "shared", "amgMirrorConfig", {
      mirrorBoardId,
      sourceBoards,
      lists
    });

    setStatus("Configuration saved.");
  } catch (err) {
    console.error("saveConfig error", err);
    setStatus("Failed to save configuration.");
  }
}

async function runFullSync() {
  try {
    setStatus("Running full sync...");
    const res = await fetch(`${BACKEND}/sync/bootstrap`, {
      method: "POST",
      headers: {
        "x-webhook-secret": SECRET
      }
    });

    const txt = await res.text();
    if (!res.ok) {
      throw new Error(txt);
    }
    setStatus("Full sync completed.");
  } catch (err) {
    console.error("runFullSync error", err);
    setStatus("Full sync failed.");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadBoards();
  await loadLists();
  document.getElementById("saveBtn").addEventListener("click", saveConfig);
  document.getElementById("runSyncBtn").addEventListener("click", runFullSync);
});
