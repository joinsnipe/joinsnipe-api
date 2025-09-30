
// api/contact.js
export default async function handler(req, res) {
  // CORS básico
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end(); // preflight

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Método no permitido" });
  }

  try {
    const { name, email, message, source, ...rest } = req.body || {};

    console.log("📩 RAW BODY:", req.body);

    // validaciones simples
    if (!name || !email || !message) {
      return res.status(400).json({
        ok: false,
        error: "Faltan campos obligatorios: name, email y message",
      });
    }

    // validación básica de email
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return res.status(400).json({ ok: false, error: "Email no válido" });
    }

    // 🔗 Reenviar a Make (webhook)
    const MAKE_WEBHOOK_URL = "https://hook.eu2.make.com/ohwzymng9o4j8bx48xeons4x5dztzy4h"; // <-- pega tu webhook aquí

    try {
      const payload = {
        // si no viene `source` desde el formulario, forzamos "web-support"
        source: source || "web-support",
        name,
        email,
        message,
        ...rest,
        ts: new Date().toISOString(),
      };

      const resp = await fetch(MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("➡️ Enviado a Make, status:", resp.status);
    } catch (err) {
      console.error("❌ Error enviando a Make:", err);
    }

    // Respuesta al navegador
    return res.status(200).json({
      ok: true,
      received: { name, email, message, source: source || "web-support" },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Error interno" });
  }
};

