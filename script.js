
const chat = document.getElementById("chat");
const prompt = document.getElementById("prompt");
const send = document.getElementById("send");
const newChat = document.getElementById("newChat");

const systemMessage = {
  role: "system",
  content: "You are MyAI, a helpful assistant. Understand and reply in English, Urdu and Roman Urdu. Be friendly and accurate."
};

let messages = [systemMessage];

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

  messages.push({
    role: "user",
    content: question
  });

  send.disabled = true;
  const loading = addMessage("MyAI is thinking...", "bot");

  try {
    const response = await puter.ai.chat(messages);

    const answer = response.message.content;
    const finalAnswer = typeof answer === "string"
      ? answer
      : JSON.stringify(answer);

    loading.textContent = finalAnswer;

    messages.push({
      role: "assistant",
      content: finalAnswer
    });

  } catch (error) {
    loading.textContent = "Error: " + error.message;
    messages.pop();
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
  messages = [systemMessage];
  chat.innerHTML = `
    <div class="welcome">
      <h1>Welcome to MyAI</h1>
      <p>What can I help you with today?</p>
    </div>
  `;
});

