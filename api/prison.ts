import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: "planilhaprf@relatorioprf.iam.gserviceaccount.com",
    private_key: `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkq...restante\n-----END PRIVATE KEY-----\n`,
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function teste() {
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.append({
    spreadsheetId: "17pmRdk83dCvA12nGxRRCNemtH2VDX5UIwwtHKllz1qQ",
    range: "Página1!A1",
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [["TESTE", "API", new Date().toISOString()]] },
  });
  console.log(res.data);
}

teste();
