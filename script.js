// Agar Puter ka koi khaas model chahiye to yahan naam likhein, warna khali rehne dein.
const MODEL = "";

const chat = document.getElementById("chat");
const form = document.getElementById("form");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const clearBtn = document.getElementById("clearBtn");
const empty = document.getElementById("empty");
const linksBox = document.getElementById("links");

let history = [];

/* ---------- Website links (admin se edit hote hain) ---------- */
const DEFAULT_LINKS = [
  { label: "Twitter", url: "https://twitter.com" },
  { label: "Instagram", url: "https://instagram.com" },
  { label: "YouTube", url: "https://youtube.com" },
];

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

async function loadLinks() {
  renderLinks(DEFAULT_LINKS);
  try {
    const res = await fetch("/api/links");
    const data = await res.json();
    if (Array.isArray(data.links) && data.links.length) renderLinks(data.links);
  } catch (e) {}
}

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

function extractReply(r) {
  if (typeof r === "string") return r;
  const c = r && r.message && r.message.content;
  if (typeof c === "string") return c;
  if (Array.isArray(c)) return c.map((p) => p.text || "").join("");
  return String(r);
}

async function sendMessage(text) {
  history.push({ role: "user", content: text });
  addMessage(text, "user");
  const typing = addTyping();
  sendBtn.disabled = true;

  try {
    const messages = [
      {
        role: "system",
        content:
          "You are a helpful, friendly AI assistant. Reply in the same language the user writes in. If the user writes Roman Urdu, reply in Roman Urdu. Keep answers clear and not too long.",
      },
      ...history.slice(-20),
    ];
    const opts = MODEL ? { model: MODEL } : {};
    const reply = extractReply(await puter.ai.chat(messages, opts));
    typing.remove();
    history.push({ role: "assistant", content: reply });
    addMessage(reply, "bot");
  } catch (err) {
    typing.remove();
    history.pop();
    addMessage("Jawab nahi aa saka. Dobara koshish karein.", "error");
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

loadLinks();
