import { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";
import path from "path";

const spreadsheetId = "17pmRdk83dCvA12nGxRRCNemtH2VDX5UIwwtHKllz1qQ";
const sheetName = "Página1";

// Use o arquivo JSON local
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(process.cwd(), "service-account.json"), // garante pegar da raiz
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const sheets = google.sheets({ version: "v4", auth });

    const prisaoData = req.body; // deve ser um array de objetos
    if (!Array.isArray(prisaoData) || prisaoData.length === 0) {
      return res
        .status(400)
        .json({ error: "Nenhuma informação de prisão recebida" });
    }

    // Transformar em array de arrays para o Sheets
    const values = prisaoData.map((p) => [
      p.qra,
      p.patente,
      p.nomePreso,
      p.rg,
      p.data,
    ]);

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    return res
      .status(200)
      .json({
        success: true,
        message: "Prisão registrada!",
        result: response.data,
      });
  } catch (err: any) {
    console.error("Erro detalhado:", err.response?.data || err);
    return res.status(500).json({
      error: "Falha ao salvar prisão",
      detail: err.response?.data || err.message || err,
    });
  }
}
