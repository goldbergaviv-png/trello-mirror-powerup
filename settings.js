const t = window.TrelloPowerUp.iframe();

async function loadBoards(){

const board = await t.board("id","name");

const mirror=document.getElementById("mirrorBoard");
const source=document.getElementById("sourceBoards");

let o1=document.createElement("option");
o1.value=board.id;
o1.text=board.name;
mirror.appendChild(o1);

let o2=document.createElement("option");
o2.value=board.id;
o2.text=board.name;
source.appendChild(o2);

}

async function loadLists(){

const lists=await t.lists("name");

const listSelect=document.getElementById("lists");

lists.forEach(l=>{

let opt=document.createElement("option");
opt.value=l.name;
opt.text=l.name;

listSelect.appendChild(opt);

});

}

async function saveConfig(){

const mirrorBoardId=document.getElementById("mirrorBoard").value;

const sourceBoards=
Array.from(document.getElementById("sourceBoards").selectedOptions)
.map(o=>o.value);

const lists=
Array.from(document.getElementById("lists").selectedOptions)
.map(o=>o.value);

for(const sourceBoardId of sourceBoards){

await fetch(
"https://trello-mirror-worker.goldberg-aviv.workers.dev/config",
{
method:"POST",
headers:{
"Content-Type":"application/json",
"x-webhook-secret":"mirror-v1-2026-goldberg-sync"
},
body:JSON.stringify({
mirrorBoardId,
sourceBoardId,
mirroredLists:lists
})
}
);

}

alert("Mirror configuration saved");

}

document.addEventListener("DOMContentLoaded",async()=>{

await loadBoards();
await loadLists();

document.getElementById("saveBtn")
.addEventListener("click",saveConfig);

});
