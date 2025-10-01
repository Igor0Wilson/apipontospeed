// /api/prison.ts
import { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";

const spreadsheetId = "17pmRdk83dCvA12nGxRRCNemtH2VDX5UIwwtHKllz1qQ";
const sheetName = "Página1";

// Configura GoogleAuth usando variáveis de ambiente
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const sheets = google.sheets({ version: "v4", auth });

    // Linha de teste
    const values: string[][] = [["TESTE", "API", new Date().toISOString()]];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    return res.status(200).json({ success: true, result: response.data });
  } catch (err: any) {
    console.error("Erro detalhado:", err.response?.data || err);

    return res.status(500).json({
      error: "Falha ao salvar linha de teste",
      detail: err.response?.data || err.message || err,
    });
  }
}
