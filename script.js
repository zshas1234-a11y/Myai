
const chat = document.getElementById("chat");
const prompt = document.getElementById("prompt");
const send = document.getElementById("send");
const newChat = document.getElementById("newChat");

function addMessage(text, type) {
  const div = document.createElement("div");
  div.className = "message " + type;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}

async function sendMessage() {
  const question = prompt.value.trim();

  if (!question || send.disabled) return;

  const welcome = chat.querySelector(".welcome");
  if (welcome) welcome.remove();

  prompt.value = "";
  addMessage(question, "user");

  send.disabled = true;
  const loading = addMessage("MyAI is thinking...", "bot");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: question })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong");
    }

    loading.textContent = data.reply || "No response received.";

  } catch (error) {
    loading.textContent = "Error: " + error.message;
  } finally {
    send.disabled = false;
    prompt.focus();
  }
}

send.addEventListener("click", sendMessage);

prompt.addEventListener("keydown", function(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

newChat.addEventListener("click", function() {
  chat.innerHTML = `
    <div class="welcome">
      <h1>Welcome to MyAI</h1>
      <p>What can I help you with today?</p>
    </div>
  `;
});
