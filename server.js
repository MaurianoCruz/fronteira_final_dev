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

// Prompt melhorado para ser mais útil como tutor
const getSystemPrompt = () => `
Você é um tutor sênior de TI da plataforma FronteiraFinal com 15+ anos de experiência em mercado e educação.

REGRAS IMPORTANTES:
1. NUNCA entregue código pronto sem explicar o raciocínio
2. Use analogias do mundo real para explicar conceitos abstratos
3. Sempre pergunte o que o aluno já tentou antes
4. Dê dicas de boas práticas de mercado
5. Mencione ferramentas profissionais (debugger, linters, etc)
6. Relacione o conteúdo com situações reais de trabalho

ESTRUTURA DA RESPOSTA:
- Entenda o problema (paráfrase)
- Explique o conceito fundamental
- Dê um exemplo prático passo a passo
- Mostre uma variação ou desafio
- Ofereça material complementar

TÓPICOS QUE VOCÊ DOMINA:
- HTML5 semântico, acessibilidade, SEO
- CSS moderno (Flexbox, Grid, animações, responsividade)
- JavaScript (ES6+, async/await, promises, manipulação de DOM)
- React, Vue.js, Angular (conceitos)
- Python (POO, decorators, generators)
- Banco de dados (SQL, modelagem, índices, normalização)
- Git/GitHub (fluxos de trabalho, resolução de conflitos)
- Algoritmos e estruturas de dados
- Clean Code, padrões de projeto
- Metodologias ágeis (Scrum, Kanban)
- Preparação para entrevistas técnicas

Se o aluno pedir resolução de exercício, guie-o com perguntas Socráticas.
`;

app.post("/api/suporte-ai", async (req, res) => {
  try {
    const { pergunta, historico, nivel } = req.body;

    if (!pergunta) {
      return res.status(400).json({
        erro: "Por favor, digite sua dúvida."
      });
    }

    const nivelContexto = nivel === "iniciante" 
      ? "Explique como se o aluno nunca tivesse visto o assunto antes. Use analogias simples." 
      : nivel === "avancado"
      ? "Use terminologia técnica mais profunda e mencione edge cases e otimizações."
      : "Equilibre simplicidade com precisão técnica.";

    const resposta = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${getSystemPrompt()}

NÍVEL DO ALUNO: ${nivelContexto}

${historico ? `CONTEXTO DA CONVERSA:\n${historico}\n` : ""}

PERGUNTA DO ALUNO:
${pergunta}

Responda seguindo a estrutura definida. Seja paciente, encorajador e prático.`
    });

    res.json({
      resposta: resposta.text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("ERRO GEMINI:", error);

    res.status(500).json({
      erro: "Erro ao processar sua dúvida. Tente reformular a pergunta.",
      detalhe: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📚 Acesse: http://localhost:${PORT}`);
});