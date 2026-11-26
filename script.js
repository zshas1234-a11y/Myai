const chat = document.getElementById("chat");
const form = document.getElementById("form");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const clearBtn = document.getElementById("clearBtn");
const empty = document.getElementById("empty");
const linksBox = document.getElementById("links");

/* Default AI script (admin se badla ja sakta hai) */
const DEFAULT_URL = "https://js.puter.com/v2/";
const DEFAULT_CODE = `const r = await puter.ai.chat(messages);
if (typeof r === "string") return r;
const c = r && r.message && r.message.content;
if (typeof c === "string") return c;
if (Array.isArray(c)) return c.map((p) => p.text || "").join("");
return String(r);`;

const DEFAULT_LINKS = [
  { label: "Twitter", url: "https://twitter.com" },
  { label: "Instagram", url: "https://instagram.com" },
  { label: "YouTube", url: "https://youtube.com" },
];

let history = [];
let askAI = null;
let setupError = "";

function renderLinks(list) {
  linksBox.innerHTML = "";
  list.forEach((l) => {
    if (!/^https?:\/\//i.test(l.url)) return;
    const a = document.createElement("a");
    a.href = l.url;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = l.label;
    linksBox.appendChild(a);
  });
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error("AI script load nahi hui"));
    document.head.appendChild(s);
  });
}

async function setup() {
  let cfg = {};
  renderLinks(DEFAULT_LINKS);
  try {
    cfg = await (await fetch("/api/links")).json();
    if (Array.isArray(cfg.links) && cfg.links.length) renderLinks(cfg.links);
    if (Array.isArray(cfg.embeds)) renderEmbeds(cfg.embeds, document.getElementById("embeds"));
  } catch (e) {}

  if (cfg.mode === "api") {
    askAI = async (messages) => {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server error");
      return data.reply;
    };
    return;
  }

  const url = cfg.script_url || DEFAULT_URL;
  const code = cfg.script_code || DEFAULT_CODE;
  try {
    await loadScript(url);
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    askAI = new AsyncFunction("messages", code);
  } catch (e) {
    setupError = e.message || "AI setup nahi hua";
  }
}
const ready = setup();

/* ---------- Chat ---------- */
function addMessage(text, type) {
  empty.style.display = "none";
  const div = document.createElement("div");
  div.className = "msg " + type;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}

function addTyping() {
  const div = addMessage("", "bot");
  div.classList.add("typing");
  div.innerHTML = "<span></span><span></span><span></span>";
  return div;
}

async function sendMessage(text) {
  history.push({ role: "user", content: text });
  addMessage(text, "user");
  const typing = addTyping();
  sendBtn.disabled = true;

  try {
    await ready;
    if (!askAI) throw new Error(setupError || "AI taiyar nahi hai");
    const messages = [
      {
        role: "system",
        content:
          "You are a helpful, friendly AI assistant. Reply in the same language the user writes in. If the user writes Roman Urdu, reply in Roman Urdu. Keep answers clear and not too long.",
      },
      ...history.slice(-20),
    ];
    const reply = String(await askAI(messages));
    typing.remove();
    history.push({ role: "assistant", content: reply });
    addMessage(reply, "bot");
  } catch (err) {
    typing.remove();
    history.pop();
    addMessage("Jawab nahi aa saka: " + (err.message || "error") + ". Admin panel mein settings check karein.", "error");
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text || sendBtn.disabled) return;
  input.value = "";
  input.style.height = "auto";
  sendMessage(text);
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 140) + "px";
});

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => sendMessage(chip.textContent));
});

clearBtn.addEventListener("click", () => {
  history = [];
  chat.querySelectorAll(".msg").forEach((m) => m.remove());
  empty.style.display = "";
});
