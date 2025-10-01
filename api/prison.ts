// /api/prison.ts
import { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";

const spreadsheetId = "17pmRdk83dCvA12nGxRRCNemtH2VDX5UIwwtHKllz1qQ";
const sheetName = "Página1";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    // Parse da service account do JSON em linha única
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT!);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Verifica se o corpo da requisição está correto
    if (!req.body || !Array.isArray(req.body) || req.body.length === 0) {
      return res
        .status(400)
        .json({ error: "Nenhuma informação de prisão recebida" });
    }

    // Mapear os dados recebidos para a planilha
    const values: string[][] = req.body.map((item: any) => [
      item.qra || "",
      item.patente || "",
      item.nomePreso || "",
      item.rg || "",
      item.data || new Date().toISOString(),
    ]);

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
      error: "Falha ao salvar prisão",
      detail: err.response?.data || err.message || err,
    });
  }
}
