// api/early.js
export default async function handler(req, res) {
  // Solo POST
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Método no permitido" });
  }

  try {
    const { name, message, user_agent, ts } = req.body || {};

    // Tu front manda TODAS las Q dentro de "message" (string JSON). Respetamos ese diseño.
    let data = {};
    if (typeof message === "string") {
      try { data = JSON.parse(message); } catch (e) {}
    } else if (message && typeof message === "object") {
      data = message;
    }

    // Campos clave que esperamos dentro de data (sin obligarte a cambiar el front)
    const { q1, q2, q3, q4s, q5s, q4b, q6, q7, q8, q9, q10, user_id, utm_source, utm_campaign } = data;

    // Validación mínima para evitar envíos vacíos (seguimos tu lógica de “sacar toda la info posible”)
    if (!q1 || !q2 || !q3 || !q10) {
      return res.status(400).json({ ok: false, error: "Campos obligatorios faltantes" });
    }

    // Webhook específico de Early (ponlo en Vercel → Settings → Environment Variables)
    const MAKE_EARLY_WEBHOOK = process.env.MAKE_EARLY_WEBHOOK;
    if (!MAKE_EARLY_WEBHOOK) {
      return res.status(500).json({ ok: false, error: "Config faltante: MAKE_EARLY_WEBHOOK" });
    }

    // Reenviamos a Make TODA la info como la necesitas para tu análisis y semáforo en Make
    const payload = {
      source: "web-early",
      name: name || "anon",
      user_id: user_id || "",
      utm_source: utm_source || "",
      utm_campaign: utm_campaign || "",
      q1, q2, q3, q4s, q5s, q4b, q6, q7, q8, q9, q10,
      user_agent: user_agent || req.headers["user-agent"] || "",
      ts: ts || new Date().toISOString(),
      // por si en el futuro añades más campos en "message", los preservamos:
      _raw: data
    };

    const resp = await fetch(MAKE_EARLY_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return res.status(200).json({ ok: true, status: resp.status });
  } catch (err) {
    console.error("❌ /api/early:", err);
    return res.status(500).json({ ok: false, error: "Error interno" });
  }
}
