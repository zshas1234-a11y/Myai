// API mode: admin ki save ki hui key se AI ko call karta hai (key server par hi rehti hai).
module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST allowed" });

  const base = process.env.SUPABASE_URL;
  const skey = process.env.SUPABASE_SERVICE_KEY;
  if (!base || !skey) return res.status(500).json({ error: "Server settings poori nahi hain" });

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Messages missing" });
  }
  const safe = messages.slice(-20).map((m) => ({
    role: m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user",
    content: String(m.content || "").slice(0, 4000),
  }));

  try {
    const sr = await fetch(base + "/rest/v1/site_settings?key=in.(api_url,api_model,api_key)&select=key,value", {
      headers: { apikey: skey, Authorization: "Bearer " + skey },
    });
    const rows = await sr.json();
    const m = {};
    (Array.isArray(rows) ? rows : []).forEach((r) => (m[r.key] = r.value));
    if (!m.api_key) return res.status(400).json({ error: "Admin ne abhi API key nahi daali" });

    const r = await fetch(m.api_url || "https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + m.api_key },
      body: JSON.stringify({ model: m.api_model || "gpt-4o-mini", messages: safe }),
    });
    const data = await r.json();
    if (!r.ok) {
      return res.status(502).json({ error: (data.error && data.error.message) || "AI provider error" });
    }
    return res.status(200).json({ reply: data.choices[0].message.content });
  } catch (e) {
    return res.status(500).json({ error: "AI se connect nahi ho saka" });
  }
};
