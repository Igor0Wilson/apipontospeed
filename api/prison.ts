// /api/prison.ts
import { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;

    return res.status(200).json({
      GOOGLE_CLIENT_EMAIL: clientEmail ? clientEmail : "undefined",
      GOOGLE_PRIVATE_KEY_SET: privateKey ? true : false,
    });
  } catch (err) {
    return res.status(500).json({ error: err });
  }
}
