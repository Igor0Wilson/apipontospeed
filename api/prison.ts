import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json", // ou use variáveis de ambiente
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// IDs diferentes se você quiser planilhas separadas
const SPREADSHEETS = {
  prisao: "17pmRdk83dCvA12nGxRRCNemtH2VDX5UIwwtHKllz1qQ",
  prison: "OUTRO_SPREADSHEET_ID",
};

interface PrisonData {
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
    const { tipo, data } = req.body as {
      tipo: "prisao" | "prison";
      data: PrisonData[];
    };

    if (!tipo || !SPREADSHEETS[tipo]) {
      return res.status(400).json({ error: "Tipo inválido" });
    }

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "Nenhuma informação recebida" });
    }

    const sheets = google.sheets({ version: "v4", auth });

    const values: string[][] = data.map((row) => [
      row.qra || "",
      row.patente || "",
      row.nomePreso || "",
      row.rg || "",
      row.data || "",
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEETS[tipo],
      range: "Página1!A3",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    res.status(200).json({ success: true, rowsAdded: values.length, tipo });
  } catch (err) {
    console.error("Erro ao salvar prisão:", err);
    res.status(500).json({ error: "Falha ao salvar prisão" });
  }
}
