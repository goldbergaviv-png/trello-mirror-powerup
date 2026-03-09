const t = window.TrelloPowerUp.iframe();
const BACKEND = "https://trello-mirror-worker.goldberg-aviv.workers.dev";
const SECRET = "mirror-v1-2026-goldberg-sync";

function setStatus(msg) {
  document.getElementById("status").textContent = msg || "";
}

async function loadBoards() {
  try {
    const board = await t.board("id", "name");
    const mirror = document.getElementById("mirrorBoard");
    const source = document.getElementById("sourceBoards");

    mirror.innerHTML = "";
    source.innerHTML = "";

    const o1 = document.createElement("option");
    o1.value = board.id;
    o1.text = board.name;
    mirror.appendChild(o1);

    const o2 = document.createElement("option");
    o2.value = board.id;
    o2.text = board.name;
    o2.selected = true;
    source.appendChild(o2);
  } catch (e) {
    console.error(e);
    setStatus("Failed to load board info");
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
  } catch (e) {
    console.error(e);
    setStatus("Failed to load lists");
  }
}

async function saveConfig() {
  try {
    const mirrorBoardId = document.getElementById("mirrorBoard").value;
    const sourceBoards = Array.from(document.getElementById("sourceBoards").selectedOptions).map(o => o.value);
    const lists = Array.from(document.getElementById("lists").selectedOptions).map(o => o.value);

    if (!mirrorBoardId || !sourceBoards.length || !lists.length) {
      setStatus("Choose board and lists first");
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
        throw new Error(await res.text());
      }
    }

    setStatus("Configuration saved");
  } catch (e) {
    console.error(e);
    setStatus("Failed to save configuration");
  }
}

async function runFullSync() {
  try {
    const res = await fetch(`${BACKEND}/sync/bootstrap`, {
      method: "POST",
      headers: {
        "x-webhook-secret": SECRET
      }
    });
    if (!res.ok) throw new Error(await res.text());
    setStatus("Full sync completed");
  } catch (e) {
    console.error(e);
    setStatus("Full sync failed");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadBoards();
  await loadLists();
  document.getElementById("saveBtn").addEventListener("click", saveConfig);
  document.getElementById("runSyncBtn").addEventListener("click", runFullSync);
});
