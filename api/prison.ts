// /api/prison.ts
import { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "GET" && req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    // Debug das variáveis de ambiente
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;

    return res.status(200).json({
      method: req.method,
      GOOGLE_CLIENT_EMAIL: clientEmail ? clientEmail : "undefined",
      GOOGLE_PRIVATE_KEY_SET: privateKey ? true : false,
    });
  } catch (err) {
    return res.status(500).json({ error: err });
  }
}
