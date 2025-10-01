// /api/prison.ts
import { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Permitir GET apenas para debug
  if (req.method === "GET") {
    return res.status(200).json({
      GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL ?? "undefined",
      GOOGLE_PRIVATE_KEY_SET: !!process.env.GOOGLE_PRIVATE_KEY,
    });
  }

  // POST normal
  if (req.method === "POST") {
    return res.status(200).json({ message: "POST recebido" });
  }

  return res.status(405).json({ error: "Método não permitido" });
}
