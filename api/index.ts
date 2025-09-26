import { fastify } from "fastify";
import cors from "@fastify/cors";
import * as admin from "firebase-admin";
import dotenv from "dotenv";
import { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
const usuariosCollection = db.collection("usuarios");

// ==================== SERVER ====================
// Criamos uma instância do Fastify para cada chamada
const buildApp = () => {
  const app = fastify();

  // CORS
  app.register(cors, {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
  });

  function gerarToken(id: string) {
    return jwt.sign({ id }, process.env.JWT_SECRET || "secret", {
      expiresIn: "7d",
    });
  }

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
        divisao: string;
        qra: string;
        patente: string;
        veiculo: string;
        inicio: string;
        fim: string;
      };

      const docRef = await pontosCollection.add({
        divisao: ponto.divisao,
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

  app.patch("/api/ponto/:id", async (request, reply) => {
    try {
      // Tipando params
      const { id: pontoId } = request.params as { id: string };

      const pontoAtualizado = request.body as {
        divisao?: string;
        qra?: string;
        patente?: string;
        veiculo?: string;
        inicio?: string;
        fim?: string;
      };

      // Atualiza apenas os campos enviados
      await pontosCollection.doc(pontoId).update({
        ...pontoAtualizado,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      reply.send({ message: "Ponto atualizado com sucesso", id: pontoId });
    } catch (err: any) {
      console.error("Erro ao atualizar ponto:", err);
      reply.status(500).send({ error: err.message });
    }
  });

  app.get("/api/usuario", async (request, reply) => {
    try {
      const snapshot = await usuariosCollection.get();
      const usuarios: any[] = [];
      snapshot.forEach((doc) => usuarios.push({ id: doc.id, ...doc.data() }));
      return { message: "Usuários recuperados com sucesso", usuarios };
    } catch (err: any) {
      console.error("Erro ao buscar usuários:", err);
      reply.status(500).send({ error: err.message });
    }
  });

  // Criar novo usuário
  app.post("/api/usuario", async (request, reply) => {
    try {
      const usuario = request.body as {
        qra: string;
        patente: string;
      };

      if (!usuario.qra || !usuario.patente) {
        return reply
          .status(400)
          .send({ error: "QRA e Patente são obrigatórios" });
      }

      const docRef = await usuariosCollection.add({
        qra: usuario.qra,
        patente: usuario.patente,
        criado_em: admin.firestore.FieldValue.serverTimestamp(),
        atualizado_em: admin.firestore.FieldValue.serverTimestamp(),
      });

      reply.send({ message: "Usuário criado com sucesso", id: docRef.id });
    } catch (err: any) {
      console.error("Erro ao salvar usuário:", err);
      reply.status(500).send({ error: err.message });
    }
  });

  // Editar usuário
  app.patch("/api/usuario/:id", async (request, reply) => {
    try {
      const { id: usuarioId } = request.params as { id: string };
      const usuarioAtualizado = request.body as {
        qra?: string;
        patente?: string;
      };

      await usuariosCollection.doc(usuarioId).update({
        ...usuarioAtualizado,
        atualizado_em: admin.firestore.FieldValue.serverTimestamp(),
      });

      reply.send({ message: "Usuário atualizado com sucesso", id: usuarioId });
    } catch (err: any) {
      console.error("Erro ao atualizar usuário:", err);
      reply.status(500).send({ error: err.message });
    }
  });

  app.delete("/api/usuario/:id", async (request, reply) => {
    try {
      const { id } = request.params as { id: string };

      await usuariosCollection.doc(id).delete();

      reply.send({ message: "Usuário deletado com sucesso", id });
    } catch (err: any) {
      reply.status(500).send({ error: err.message });
    }
  });

  // 1) Registrar usuário
  app.post("/api/auth/register", async (req, reply) => {
    try {
      const { qra, patente, senha } = req.body as {
        qra: string;
        patente: string;
        senha: string;
      };

      if (!qra || !patente || !senha) {
        return reply
          .status(400)
          .send({ error: "QRA, Patente e Senha são obrigatórios" });
      }

      // Verifica se já existe
      const snapshot = await usuariosCollection.where("qra", "==", qra).get();
      if (!snapshot.empty) {
        return reply.status(400).send({ error: "QRA já cadastrado" });
      }

      const senhaHash = await bcrypt.hash(senha, 10);

      const docRef = await usuariosCollection.add({
        qra,
        patente,
        senha: senhaHash,
        criado_em: admin.firestore.FieldValue.serverTimestamp(),
        atualizado_em: admin.firestore.FieldValue.serverTimestamp(),
      });

      return reply.send({
        message: "Usuário registrado com sucesso",
        id: docRef.id,
      });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 2) Login
  app.post("/api/auth/login", async (req, reply) => {
    try {
      const { qra, senha } = req.body as { qra: string; senha: string };

      const snapshot = await usuariosCollection.where("qra", "==", qra).get();
      if (snapshot.empty) {
        return reply.status(401).send({ error: "Credenciais inválidas" });
      }

      const userDoc = snapshot.docs[0];
      const usuario = userDoc.data();

      const senhaValida = await bcrypt.compare(senha, usuario.senha);
      if (!senhaValida) {
        return reply.status(401).send({ error: "Credenciais inválidas" });
      }

      const token = gerarToken(userDoc.id);
      return reply.send({
        message: "Login bem-sucedido",
        token,
        usuario: { id: userDoc.id, qra: usuario.qra, patente: usuario.patente },
      });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 3) Atualizar usuário
  app.patch("/api/auth/user/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      const { qra, patente, senha } = req.body as {
        qra?: string;
        patente?: string;
        senha?: string;
      };

      const updates: any = {
        atualizado_em: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (qra) updates.qra = qra;
      if (patente) updates.patente = patente;
      if (senha) updates.senha = await bcrypt.hash(senha, 10);

      await usuariosCollection.doc(id).update(updates);

      return reply.send({ message: "Usuário atualizado com sucesso" });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 4) Deletar usuário
  app.delete("/api/auth/user/:id", async (req, reply) => {
    try {
      const { id } = req.params as { id: string };
      await usuariosCollection.doc(id).delete();
      return reply.send({ message: "Usuário deletado com sucesso" });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // 5) Listar usuários
  app.get("/api/auth/users", async (_, reply) => {
    try {
      const snapshot = await usuariosCollection.get();
      const usuarios: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        usuarios.push({
          id: doc.id,
          qra: data.qra,
          patente: data.patente,
          criado_em: data.criado_em,
          atualizado_em: data.atualizado_em,
        });
      });
      return reply.send({ usuarios });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
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
