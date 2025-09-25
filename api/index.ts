import { fastify } from "fastify";
import cors from "@fastify/cors";

const app = fastify();

app.register(cors, {
  origin: "*",
});

app.get("/api/ponto", async (request, reply) => {
  return { message: "API funcionando (GET)" };
});

app.post("/api/ponto", async (request, reply) => {
  try {
    const ponto = request.body;
    console.log("Dados recebidos:", ponto);

    reply.send({ message: "Ponto salvo com sucesso" });
  } catch (err) {
    console.error("Erro ao salvar ponto:", err);
    reply.status(500).send({ error: err.message });
  }
});
app
  .listen({
    port: 3333,
  })
  .then(() => {
    console.log("HTTP server running");
  });
