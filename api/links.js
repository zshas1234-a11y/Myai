// Links aur AI script ko Supabase mein save/load karta hai.
// Password aur keys sirf Vercel ke environment variables mein hain.
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
      const r = await fetch(url + "?key=in.(links,script_url,script_code)&select=key,value", { headers });
      const rows = await r.json();
      const out = { links: [], script_url: "", script_code: "" };
      (Array.isArray(rows) ? rows : []).forEach((row) => {
        if (row.key === "links" && Array.isArray(row.value)) out.links = row.value;
        if (row.key === "script_url" && typeof row.value === "string") out.script_url = row.value;
        if (row.key === "script_code" && typeof row.value === "string") out.script_code = row.value;
      });
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json(out);
    } catch (e) {
      return res.status(500).json({ error: "Load nahi hua" });
    }
  }

  if (req.method === "POST") {
    const { password, links, script_url, script_code, check } = req.body || {};
    if (password !== adminPw) return res.status(401).json({ error: "Wrong password" });
    if (check) return res.status(200).json({ ok: true });

    if (!Array.isArray(links) || links.length > 20) {
      return res.status(400).json({ error: "Links galat hain" });
    }
    const clean = [];
    for (const l of links) {
      const label = String(l.label || "").trim().slice(0, 40);
      const u = String(l.url || "").trim().slice(0, 500);
      if (!label || !/^https?:\/\//i.test(u)) {
        return res.status(400).json({ error: "Har link http:// ya https:// se shuru ho" });
      }
      clean.push({ label, url: u });
    }

    const sUrl = String(script_url || "").trim();
    if (sUrl && !/^https:\/\/[^\s"'<>]{1,300}$/.test(sUrl)) {
      return res.status(400).json({ error: "Script link https:// se shuru hona chahiye" });
    }
    const sCode = String(script_code || "");
    if (sCode.length > 20000) {
      return res.status(400).json({ error: "Code bohot lamba hai" });
    }

    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { ...headers, Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify([
          { key: "links", value: clean },
          { key: "script_url", value: sUrl },
          { key: "script_code", value: sCode },
        ]),
      });
      if (!r.ok) return res.status(500).json({ error: "Database error" });
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: "Save nahi hua" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
};
