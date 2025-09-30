// api/early.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Método no permitido" });
  }

  try {
    const {
      name,
      user_id,
      utm_source,
      utm_campaign,
      q1, q2, q3, q4s, q5s, q4b, q6, q7, q8, q9, q10,
      user_agent,
      ts,
    } = req.body;

    if (!q1 || !q2 || !q3 || !q10) {
      return res.status(400).json({ ok: false, error: "Campos obligatorios faltantes" });
    }

    // URL de Make (crea un webhook específico para Early)
    const MAKE_WEBHOOK_URL = process.env.MAKE_EARLY_WEBHOOK;

    const payload = {
      source: "web-early",
      name: name || "anon",
      user_id: user_id || "",
      utm_source: utm_source || "",
      utm_campaign: utm_campaign || "",
      q1, q2, q3, q4s, q5s, q4b, q6, q7, q8, q9, q10,
      user_agent: user_agent || "",
      ts: ts || new Date().toISOString(),
    };

    const resp = await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    return res.status(200).json({ ok: true, forwarded: true, status: resp.status, body: text });

  } catch (err) {
    console.error("❌ Error en /api/early:", err);
    return res.status(500).json({ ok: false, error: "Error interno en servidor" });
  }
}
