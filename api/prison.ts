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

interface PrisaoData {
  qra?: string;
  patente?: string;
  nomePreso?: string;
  rg?: string;
  data?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const body: PrisaoData[] = req.body;

    if (!Array.isArray(body) || body.length === 0) {
      return res
        .status(400)
        .json({ error: "Nenhuma informação de prisão recebida" });
    }

    const sheets = google.sheets({ version: "v4", auth });

    // Transformar o body em linhas para a planilha
    const values: string[][] = body.map((row) => [
      row.qra || "",
      row.patente || "",
      row.nomePreso || "",
      row.rg || "",
      row.data || "",
    ]);

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A3`, // começa na linha 3
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    return res
      .status(200)
      .json({ success: true, rowsAdded: values.length, result: response.data });
  } catch (err: any) {
    console.error("Erro detalhado:", err.response?.data || err);

    return res.status(500).json({
      error: "Falha ao salvar prisão",
      detail: err.response?.data || err.message || err,
    });
  }
}
