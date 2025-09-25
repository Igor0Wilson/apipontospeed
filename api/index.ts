import { fastify } from "fastify";
import cors from "@fastify/cors";
import * as admin from "firebase-admin";
import dotenv from "dotenv";
import { VercelRequest, VercelResponse } from "@vercel/node";

dotenv.config();

// ==================== FIREBASE ====================
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  clientId: process.env.FIREBASE_CLIENT_ID,
  authUri: "https://accounts.google.com/o/oauth2/auth",
  tokenUri: "https://oauth2.googleapis.com/token",
  authProviderX509CertUrl: "https://www.googleapis.com/oauth2/v1/certs",
  clientX509CertUrl: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`,
};

// Inicializa o Firebase Admin apenas uma vez
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

// Firestore
const db = admin.firestore();
const pontosCollection = db.collection("pontos");

// ==================== SERVER ====================
// Criamos uma instância do Fastify para cada chamada
const buildApp = () => {
  const app = fastify();

  // CORS
  app.register(cors, { origin: "*" });

  // Rotas
  app.get("/api/ponto", async (request, reply) => {
    try {
      const snapshot = await pontosCollection.get();
      const pontos: any[] = [];
      snapshot.forEach((doc) => pontos.push({ id: doc.id, ...doc.data() }));
      return { message: "Pontos recuperados com sucesso", pontos };
    } catch (err: any) {
      console.error("Erro ao buscar pontos:", err);
      reply.status(500).send({ error: err.message });
    }
  });

  app.post("/api/ponto", async (request, reply) => {
    try {
      const ponto = request.body as {
        qra: string;
        patente: string;
        veiculo: string;
        inicio: string;
        fim: string;
      };

      const docRef = await pontosCollection.add({
        qra: ponto.qra,
        patente: ponto.patente,
        veiculo: ponto.veiculo,
        inicio: ponto.inicio,
        fim: ponto.fim,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      reply.send({ message: "Ponto salvo com sucesso", id: docRef.id });
    } catch (err: any) {
      console.error("Erro ao salvar ponto:", err);
      reply.status(500).send({ error: err.message });
    }
  });

  return app;
};

// ==================== EXPORT PARA VERCEL ====================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = buildApp();

  // Converte a requisição da Vercel para Fastify
  await app.ready();

  app.server.emit("request", req, res);
}
