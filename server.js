import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

app.post("/api/suporte-ai", async (req, res) => {
  try {
    const { pergunta } = req.body;

    if (!pergunta) {
      return res.status(400).json({
        erro: "A pergunta é obrigatória."
      });
    }

    const resposta = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
Você é um tutor acadêmico da plataforma FronteiraFinal.
Explique programação para alunos iniciantes de forma didática.
Não entregue apenas a resposta pronta: explique o raciocínio.
Use exemplos simples quando necessário.
Temas principais: HTML, CSS, JavaScript, Python, Banco de Dados, SQL, Git e GitHub.

Dúvida do aluno:
${pergunta}
      `
    });

    res.json({
      resposta: resposta.text
    });

  } catch (error) {
    console.error("ERRO GEMINI:", error);

    res.status(500).json({
      erro: error.message || "Erro ao consultar a IA.",
      codigo: error.code || null,
      tipo: error.name || null
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});