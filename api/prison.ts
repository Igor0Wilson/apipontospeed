// /api/prison.ts
import { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";
import path from "path";

const spreadsheetId = "17pmRdk83dCvA12nGxRRCNemtH2VDX5UIwwtHKllz1qQ";
const sheetName = "Página1";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const sheets = google.sheets({
      version: "v4",
      auth: new google.auth.GoogleAuth({
        keyFile: path.join(__dirname, "../service-account.json"),
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      }),
    });

    const prisaoData = req.body; // já deve ser array de objetos
    if (!Array.isArray(prisaoData) || prisaoData.length === 0) {
      return res
        .status(400)
        .json({ error: "Nenhuma informação de prisão recebida" });
    }

    // Transformando os dados em array de arrays
    const values = prisaoData.map((item) => [
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

    return res
      .status(200)
      .json({ success: true, message: "Prisão registrada!" });
  } catch (err: any) {
    console.error("Erro detalhado:", err.response?.data || err);

    return res.status(500).json({
      error: "Falha ao salvar prisão",
      detail: err.response?.data || err.message || err,
    });
  }
}
