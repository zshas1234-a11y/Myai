// Vercel serverless function. API key sirf yahan (server par) use hoti hai.
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "OPENAI_API_KEY set nahi hai" });
  }

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Messages missing" });
  }

  // Sirf aakhri 20 messages bhejein, aur lambe messages kaat dein
  const safe = messages.slice(-20).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: String(m.content || "").slice(0, 4000),
  }));

  const systemPrompt =
    "You are a helpful, friendly AI assistant. Reply in the same language the user writes in. " +
    "If the user writes Roman Urdu, reply in Roman Urdu. Keep answers clear and not too long.";

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }, ...safe],
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({
        error: (data.error && data.error.message) || "OpenAI error",
      });
    }
    return res.status(200).json({ reply: data.choices[0].message.content });
  } catch (e) {
    return res.status(500).json({ error: "Server se connect nahi ho saka" });
  }
};
