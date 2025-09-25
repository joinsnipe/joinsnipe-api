export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const data = req.body;

    // Aquí luego conectaremos con Make o Notion
    console.log("Datos recibidos:", data);

    res.status(200).json({ ok: true, recibido: data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
