// api/contact.js
export default function handler(req, res) {
  // CORS básico (si luego tienes dominio propio, cámbialo aquí)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end(); // preflight

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Método no permitido" });
  }

  try {
    const { name, email, message } = req.body || {};
// Ver lo que llega tal cual
console.log("📩 RAW BODY:", req.body);

// Si "message" es un JSON en texto (como hicimos), lo intento leer para verlo bonito
try {
  const parsed = typeof message === "string" ? JSON.parse(message) : message;
  console.log("🧩 PARSED MESSAGE:", parsed);
} catch (e) {
  console.log("⚠️ No se pudo parsear 'message' como JSON");
}


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

    // aquí iría tu lógica real (guardar, enviar email, etc.)
    return res.status(200).json({
      ok: true,
      received: { name, email, message },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Error interno" });
  }
}
