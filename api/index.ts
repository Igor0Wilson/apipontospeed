import { fastify } from "fastify";
import cors from "@fastify/cors";
import * as admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const app = fastify();

// ==================== CORS ====================
app.register(cors, {
  origin: "*",
});

// ==================== FIREBASE ====================
const serviceAccountPath = path.resolve(process.env.FIREBASE_KEY_PATH || "");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath),
});
const db = admin.firestore();
const pontosCollection = db.collection("pontos");

// ==================== ROTAS ====================
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

    // Salva apenas os campos de texto
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

// ==================== LISTEN ====================
const PORT = Number(process.env.PORT) || 3000;
app.listen({ port: PORT, host: "0.0.0.0" }).then(() => {
  console.log(`HTTP server running on port ${PORT}`);
});
