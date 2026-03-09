const t = window.TrelloPowerUp.iframe();

async function loadBoards() {

  const boards = await t.boards('name','id');

  const mirrorSelect =
    document.getElementById("mirrorBoard");

  const sourceSelect =
    document.getElementById("sourceBoards");

  boards.forEach(b => {

    let opt1 = document.createElement("option");
    opt1.value = b.id;
    opt1.text = b.name;
    mirrorSelect.appendChild(opt1);

    let opt2 = document.createElement("option");
    opt2.value = b.id;
    opt2.text = b.name;
    sourceSelect.appendChild(opt2);

  });

}

async function loadLists() {

  const lists = await t.lists('name');

  const listSelect =
    document.getElementById("lists");

  lists.forEach(l => {

    let opt = document.createElement("option");
    opt.value = l.name;
    opt.text = l.name;

    listSelect.appendChild(opt);

  });

}

async function saveConfig() {

  const mirrorBoardId =
    document.getElementById("mirrorBoard").value;

  const sourceBoards =
    Array.from(
      document.getElementById("sourceBoards").selectedOptions
    ).map(o => o.value);

  const lists =
    Array.from(
      document.getElementById("lists").selectedOptions
    ).map(o => o.value);

  for (const sourceBoardId of sourceBoards) {

    await fetch(
      "https://trello-mirror-worker.goldberg-aviv.workers.dev/config",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret": "YOUR_SECRET"
        },
        body: JSON.stringify({
          mirrorBoardId,
          sourceBoardId,
          mirroredLists: lists
        })
      }
    );

  }

  alert("Mirror configuration saved");

}

loadBoards();
loadLists();
