const chat = document.getElementById("chat");
const form = document.getElementById("form");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const clearBtn = document.getElementById("clearBtn");
const empty = document.getElementById("empty");

let history = [];

function addMessage(text, type) {
  if (empty) empty.style.display = "none";
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
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    });
    const data = await res.json();
    typing.remove();
    if (!res.ok) throw new Error(data.error || "Server error");
    history.push({ role: "assistant", content: data.reply });
    addMessage(data.reply, "bot");
  } catch (err) {
    typing.remove();
    history.pop();
    addMessage("Jawab nahi aa saka: " + err.message + ". Dobara koshish karein.", "error");
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
