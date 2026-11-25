const $ = (id) => document.getElementById(id);
let password = "";

function addRow(label = "", url = "") {
  const row = document.createElement("div");
  row.className = "row";
  row.innerHTML =
    '<input class="l" placeholder="Naam (Twitter)" aria-label="Link name">' +
    '<input class="u" placeholder="https://..." aria-label="Link URL">' +
    '<button class="btn light del" type="button" aria-label="Delete">X</button>';
  row.querySelector(".l").value = label;
  row.querySelector(".u").value = url;
  row.querySelector(".del").onclick = () => row.remove();
  $("rows").appendChild(row);
}

function collect() {
  return [...document.querySelectorAll("#rows .row")]
    .map((r) => ({
      label: r.querySelector(".l").value.trim(),
      url: r.querySelector(".u").value.trim(),
    }))
    .filter((l) => l.label && l.url);
}

async function login() {
  password = $("pw").value;
  $("loginStatus").textContent = "Check ho raha hai...";
  $("loginStatus").className = "status";
  try {
    const res = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, check: true }),
    });
    if (!res.ok) throw new Error();
    const cur = await (await fetch("/api/links")).json();
    $("rows").innerHTML = "";
    (cur.links && cur.links.length ? cur.links : [{}]).forEach((l) => addRow(l.label, l.url));
    $("loginBox").hidden = true;
    $("panel").hidden = false;
  } catch (e) {
    $("loginStatus").textContent = "Password galat hai.";
    $("loginStatus").className = "status bad";
  }
}

async function save() {
  const links = collect();
  const bad = links.find((l) => !/^https?:\/\//i.test(l.url));
  if (bad) {
    $("saveStatus").textContent = "Har link http:// ya https:// se shuru hona chahiye.";
    $("saveStatus").className = "status bad";
    return;
  }
  $("saveStatus").textContent = "Save ho raha hai...";
  $("saveStatus").className = "status";
  try {
    const res = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, links }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error");
    $("saveStatus").textContent = "Save ho gaya. Website par links badal gaye.";
    $("saveStatus").className = "status ok";
  } catch (e) {
    $("saveStatus").textContent = "Save nahi hua: " + e.message;
    $("saveStatus").className = "status bad";
  }
}

$("loginBtn").onclick = login;
$("pw").addEventListener("keydown", (e) => { if (e.key === "Enter") login(); });
$("addBtn").onclick = () => addRow();
$("saveBtn").onclick = save;
