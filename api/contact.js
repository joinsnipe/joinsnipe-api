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
    const { name, email, message, source, consent, policy_version, ...rest } = req.body || {};
    const src = String(source || "web-support").toLowerCase();

    // Logs útiles (no imprimen payload completo)
    console.log("→ source:", src);
    console.log("→ hasMessage:", !!message, "email:", !!email, "consent:", consent, "policy:", policy_version);

    // Normaliza message si viene como objeto
    const normMessage = typeof message === "object" ? JSON.stringify(message) : message;

    // ✅ Validaciones por tipo de fuente
    if (src === "web-early") {
      if (!name || !normMessage) {
        return res.status(400).json({ ok: false, error: "Faltan name o message (web-early)" });
      }
      // email opcional en early
    } else {
      // web-support / web-contact (puedes añadir otros)
      if (!name || !email || !normMessage) {
        return res.status(400).json({ ok: false, error: "Faltan name, email o message" });
      }
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!emailOk) return res.status(400).json({ ok: false, error: "Email no válido" });

      // 👇 Consentimiento obligatorio (sí o sí)
      const consentBool = consent === true || consent === "true" || consent === 1 || consent === "1";
      if (!consentBool) return res.status(400).json({ ok: false, error: "Debes aceptar la política de privacidad" });
      if (!policy_version) {
        return res.status(400).json({ ok: false, error: "Falta policy_version (ej. 'PP-2025-10-01')" });
      }
    }

    // 👇 IP del cliente (Vercel/NGINX/CDN)
    const ip = getClientIp(req);

    // 🔗 Webhook Make desde ENV (sin fallback)
    const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL;
    if (!MAKE_WEBHOOK_URL) {
      return res.status(500).json({ ok: false, error: "Config faltante: MAKE_WEBHOOK_URL" });
    }

    // Payload preservando campos extra
    const payload = {
      source: src,              // web-support | web-contact | web-early
      name,
      email,
      message: normMessage,     // si venía objeto, va stringificado
      ...rest,                  // category, phone, attachmentUrl, etc.
      consent: rest?.consent ?? consent ?? undefined,
      policy_version: rest?.policy_version ?? policy_version ?? undefined,
      ua: rest?.ua || req.headers["user-agent"] || undefined,
      ip,
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
      // Respondemos OK igualmente para no romper UX
    }

    return res.status(200).json({
      ok: true,
      received: { name, email: !!email ? email : undefined, source: src, ip },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Error interno" });
  }
}

/**
 * IP del cliente desde cabeceras comunes y fallback a socket.
 */
function getClientIp(req) {
  const cf = req.headers["cf-connecting-ip"];
  if (cf) return normalizeIp(cf);

  const xri = req.headers["x-real-ip"];
  if (xri) return firstIp(xri);

  const xff = req.headers["x-forwarded-for"];
  if (xff) return firstIp(xff);

  const fwd = req.headers["forwarded"];
  if (fwd) {
    const m = /for="?(\[?[^;\s,"\]]+\]?)/i.exec(String(fwd));
    if (m && m[1]) return normalizeIp(stripBrackets(m[1]));
  }

  const ra = req.socket?.remoteAddress || req.connection?.remoteAddress || "";
  return normalizeIp(ra);
}

function firstIp(v) {
  const ip = String(v).split(",")[0].trim();
  return normalizeIp(ip);
}
function stripBrackets(v) {
  return String(v).replace(/^\[|\]$/g, "");
}
function normalizeIp(ip) {
  return stripBrackets(String(ip).replace(/^::ffff:/, ""));
}

