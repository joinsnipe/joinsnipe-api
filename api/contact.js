// api/contact.js
export default async function handler(req, res) {
  // CORS básico
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Método no permitido" });
  }

  try {
    const { name, email, message, source, ...rest } = req.body || {};
    const src = (source || "web-support").toLowerCase();

    // ✅ Validación según tipo
    if (src === "web-early") {
      if (!name || !message) {
        return res.status(400).json({ ok: false, error: "Faltan name o message (web-early)" });
      }
    } else {
      if (!name || !email || !message) {
        return res.status(400).json({
          ok: false,
          error: "Faltan campos obligatorios: name, email y message",
        });
      }
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!emailOk) {
        return res.status(400).json({ ok: false, error: "Email no válido" });
      }
    }

    // 🔗 Webhook Make desde ENV
    const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL ?? "https://hook.eu2.make.com/ohwzymng9o4j8bx48xeons4x5dztzy4h";
    if (!MAKE_WEBHOOK_URL) {
      return res.status(500).json({ ok: false, error: "Config faltante: MAKE_WEBHOOK_URL" });
    }

    // Payload (preservamos todo)
    const payload = {
      source: src,              // web-support | web-contact | web-early
      name,
      email,
      message,                  // en Early, aquí viaja JSON con q1..q10 (string u objeto)
      ...rest,                  // category, phone, consent, attachmentUrl, ip, etc.
      ua: rest.ua || req.headers["user-agent"] || undefined,
      ts: new Date().toISOString(),
    };

    // Reenviar a Make
    try {
      await fetch(MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("❌ Error enviando a Make:", err);
    }

    return res.status(200).json({
      ok: true,
      received: { name, email, source: src },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Error interno" });
  }
}
