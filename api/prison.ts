import express, { Request, Response } from "express";
import { google } from "googleapis";

const router = express.Router();

const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const spreadsheetId = "17pmRdk83dCvA12nGxRRCNemtH2VDX5UIwwtHKllz1qQ";
const sheetName = "Página1";

interface PrisaoData {
  qra?: string;
  patente?: string;
  nomePreso?: string;
  rg?: string;
  data?: string;
}

router.post("/", async (req: Request, res: Response) => {
  try {
    const body: PrisaoData[] = req.body;

    if (!Array.isArray(body) || body.length === 0) {
      return res
        .status(400)
        .json({ error: "Nenhuma informação de prisão recebida" });
    }

    // 👇 força cast para resolver incompatibilidade de typings
    const client = (await auth.getClient()) as unknown as string;

    const sheets = google.sheets({
      version: "v4",
      auth: client,
    });

    const values: string[][] = body.map((row) => [
      row.qra || "",
      row.patente || "",
      row.nomePreso || "",
      row.rg || "",
      row.data || "",
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A3`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    res.json({ success: true, rowsAdded: values.length });
  } catch (err) {
    console.error("Erro ao salvar prisão:", err);
    res.status(500).json({ error: "Falha ao salvar prisão" });
  }
});

export default router;
