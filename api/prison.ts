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
    // Lê o JSON da service account da variável de ambiente
    if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
      return res
        .status(500)
        .json({ error: "Variável GOOGLE_SERVICE_ACCOUNT não configurada" });
    }

    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Pega os dados enviados no POST
    const prisaoData = req.body; // já vem como array

    if (!Array.isArray(prisaoData) || prisaoData.length === 0) {
      return res
        .status(400)
        .json({ error: "Nenhuma informação de prisão recebida" });
    }

    const values: string[][] = prisaoData.map((item) => [
      item.qra,
      item.patente,
      item.nomePreso,
      item.rg,
      item.data,
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("Erro detalhado:", err.response?.data || err);
    return res.status(500).json({
      error: "Falha ao salvar prisão",
      detail: err.response?.data || err.message || err,
    });
  }
}
