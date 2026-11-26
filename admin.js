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

function addEmbed(it = {}) {
  const d = document.createElement("div");
  d.className = "embed-item";
  d.innerHTML =
    '<input class="e-title" placeholder="Naam (button/heading par dikhega)">' +
    '<input class="e-url" placeholder="https://...">' +
    '<div class="grid">' +
    '<label>System<select class="e-mode"><option value="inline">Page par (inline)</option><option value="popup">Button se popup</option><option value="tab">Naye tab mein</option></select></label>' +
    '<label>Chaudai<div class="pair"><input class="e-w" type="number"><select class="e-unit"><option value="%">%</option><option value="px">px</option></select></div></label>' +
    '<label>Unchai (px)<input class="e-h" type="number"></label>' +
    '<label>Zoom (%)<input class="e-zoom" type="number"></label>' +
    '<label>Upar se chhupayein (px)<input class="e-oy" type="number"></label>' +
    '<label>Baayen se chhupayein (px)<input class="e-ox" type="number"></label>' +
    '</div>' +
    '<button class="btn light e-prev-btn" type="button">Preview</button> ' +
    '<button class="btn light e-del" type="button">Hatayein</button>' +
    '<div class="e-prev"></div>';
  const q = (c) => d.querySelector(c);
  q(".e-title").value = it.title || "";
  q(".e-url").value = it.url || "";
  q(".e-mode").value = it.mode || "inline";
  q(".e-w").value = it.width ?? 100;
  q(".e-unit").value = it.unit || "%";
  q(".e-h").value = it.height ?? 400;
  q(".e-zoom").value = it.zoom ?? 100;
  q(".e-oy").value = it.oy ?? 0;
  q(".e-ox").value = it.ox ?? 0;
  q(".e-del").onclick = () => d.remove();
  q(".e-prev-btn").onclick = () => {
    const box = q(".e-prev");
    const item = readEmbed(d);
    box.innerHTML = "";
    if (!/^https:\/\//i.test(item.url)) { box.textContent = "Pehle https:// wala link likhein."; return; }
    box.appendChild(buildFrame(item, false));
  };
  $("embedRows").appendChild(d);
}

function readEmbed(d) {
  const q = (c) => d.querySelector(c);
  return {
    title: q(".e-title").value.trim(),
    url: q(".e-url").value.trim(),
    mode: q(".e-mode").value,
    width: q(".e-w").value,
    unit: q(".e-unit").value,
    height: q(".e-h").value,
    zoom: q(".e-zoom").value,
    oy: q(".e-oy").value,
    ox: q(".e-ox").value,
  };
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
    $("embedRows").innerHTML = "";
    (cur.embeds || []).forEach((e) => addEmbed(e));
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
  const embeds = [...document.querySelectorAll("#embedRows .embed-item")].map(readEmbed).filter((e) => e.url);
  if (embeds.find((e) => !/^https:\/\//i.test(e.url))) {
    $("saveStatus").textContent = "Website ka link https:// se shuru hona chahiye.";
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
        embeds,
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
$("addEmbed").onclick = () => addEmbed();
$("saveBtn").onclick = save;
