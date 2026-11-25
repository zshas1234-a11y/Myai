// Website ki settings (links, script, API) Supabase mein save/load karta hai.
// API key kabhi GET se wapas nahi bheji jati.
module.exports = async (req, res) => {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  const adminPw = process.env.ADMIN_PASSWORD;
  if (!base || !key || !adminPw) {
    return res.status(500).json({ error: "Server settings poori nahi hain" });
  }
  const headers = { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" };
  const url = base + "/rest/v1/site_settings";

  if (req.method === "GET") {
    try {
      const keys = "links,script_url,script_code,mode,api_url,api_model,api_key";
      const r = await fetch(url + "?key=in.(" + keys + ")&select=key,value", { headers });
      const rows = await r.json();
      const m = {};
      (Array.isArray(rows) ? rows : []).forEach((row) => (m[row.key] = row.value));
      const str = (v) => (typeof v === "string" ? v : "");
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json({
        links: Array.isArray(m.links) ? m.links : [],
        script_url: str(m.script_url),
        script_code: str(m.script_code),
        mode: m.mode === "api" ? "api" : "script",
        api_url: str(m.api_url),
        api_model: str(m.api_model),
        api_set: !!str(m.api_key), // sirf yes/no, key nahi
      });
    } catch (e) {
      return res.status(500).json({ error: "Load nahi hua" });
    }
  }

  if (req.method === "POST") {
    const b = req.body || {};
    if (b.password !== adminPw) return res.status(401).json({ error: "Wrong password" });
    if (b.check) return res.status(200).json({ ok: true });

    if (!Array.isArray(b.links) || b.links.length > 20) {
      return res.status(400).json({ error: "Links galat hain" });
    }
    const clean = [];
    for (const l of b.links) {
      const label = String(l.label || "").trim().slice(0, 40);
      const u = String(l.url || "").trim().slice(0, 500);
      if (!label || !/^https?:\/\//i.test(u)) {
        return res.status(400).json({ error: "Har link http:// ya https:// se shuru ho" });
      }
      clean.push({ label, url: u });
    }

    const sUrl = String(b.script_url || "").trim();
    if (sUrl && !/^https:\/\/[^\s"'<>]{1,300}$/.test(sUrl)) {
      return res.status(400).json({ error: "Script link https:// se shuru hona chahiye" });
    }
    const sCode = String(b.script_code || "");
    if (sCode.length > 20000) return res.status(400).json({ error: "Code bohot lamba hai" });

    const mode = b.mode === "api" ? "api" : "script";
    const aUrl = String(b.api_url || "").trim();
    if (aUrl && !/^https:\/\/[^\s"'<>]{1,300}$/.test(aUrl)) {
      return res.status(400).json({ error: "API link https:// se shuru hona chahiye" });
    }
    const aModel = String(b.api_model || "").trim();
    if (aModel && !/^[A-Za-z0-9._:\/-]{1,80}$/.test(aModel)) {
      return res.status(400).json({ error: "Model ka naam galat hai" });
    }

    const rowsOut = [
      { key: "links", value: clean },
      { key: "script_url", value: sUrl },
      { key: "script_code", value: sCode },
      { key: "mode", value: mode },
      { key: "api_url", value: aUrl },
      { key: "api_model", value: aModel },
    ];
    // API key sirf tab update hoti hai jab admin nayi key likhe
    const aKey = String(b.api_key || "").trim();
    if (aKey) {
      if (aKey.length > 300 || /\s/.test(aKey)) {
        return res.status(400).json({ error: "API key galat lag rahi hai" });
      }
      rowsOut.push({ key: "api_key", value: aKey });
    }

    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { ...headers, Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify(rowsOut),
      });
      if (!r.ok) return res.status(500).json({ error: "Database error" });
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: "Save nahi hua" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
