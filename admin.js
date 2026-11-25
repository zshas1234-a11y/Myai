const $ = (id) => document.getElementById(id);
let password = "";

const DEFAULT_URL = "https://js.puter.com/v2/";
const DEFAULT_CODE = `// Model chahiye to: puter.ai.chat(messages, { model: "gpt-6-luna" })
const r = await puter.ai.chat(messages);
if (typeof r === "string") return r;
const c = r && r.message && r.message.content;
if (typeof c === "string") return c;
if (Array.isArray(c)) return c.map((p) => p.text || "").join("");
return String(r);`;

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

function getMode() {
  return document.querySelector('input[name="mode"]:checked').value;
}
function showMode() {
  const api = getMode() === "api";
  $("apiBox").hidden = !api;
  $("scriptBox").hidden = api;
}
document.querySelectorAll('input[name="mode"]').forEach((r) => r.addEventListener("change", showMode));

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
    document.querySelector('input[name="mode"][value="' + (cur.mode === "api" ? "api" : "script") + '"]').checked = true;
    $("aUrl").value = cur.api_url || "https://api.openai.com/v1/chat/completions";
    $("aModel").value = cur.api_model || "gpt-4o-mini";
    $("aKey").value = "";
    $("aKey").placeholder = cur.api_set ? "Key save hai (badalne ke liye nayi likhein)" : "sk-...";
    showMode();
    $("sUrl").value = cur.script_url || DEFAULT_URL;
    $("sCode").value = cur.script_code || DEFAULT_CODE;
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
  let script_url = $("sUrl").value.trim();
  let script_code = $("sCode").value.trim();
  if (script_url === DEFAULT_URL && script_code === DEFAULT_CODE) {
    script_url = "";
    script_code = "";
  }
  $("saveStatus").textContent = "Save ho raha hai...";
  $("saveStatus").className = "status";
  try {
    const res = await fetch("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password,
        links,
        script_url,
        script_code,
        mode: getMode(),
        api_url: $("aUrl").value.trim(),
        api_model: $("aModel").value.trim(),
        api_key: $("aKey").value.trim(),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error");
    if ($("aKey").value.trim()) {
      $("aKey").value = "";
      $("aKey").placeholder = "Key save hai (badalne ke liye nayi likhein)";
    }
    $("saveStatus").textContent = "Save ho gaya. Website par naya system lag gaya.";
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
