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

// Banco de dados simulado de questões (em produção, use um banco real)
const questionBank = {
  html: [
    {
      id: 1,
      question: "Qual tag HTML é usada para criar um link?",
      options: ["&lt;link&gt;", "&lt;a&gt;", "&lt;href&gt;", "&lt;url&gt;"],
      correct: 1,
      explanation: "A tag &lt;a&gt; (anchor) é usada para criar hyperlinks em HTML."
    },
    {
      id: 2,
      question: "Qual atributo define o destino de um link?",
      options: ["src", "link", "href", "url"],
      correct: 2,
      explanation: "O atributo href (Hypertext Reference) define o destino do link."
    }
  ],
  css: [
    {
      id: 1,
      question: "Qual propriedade CSS muda a cor do texto?",
      options: ["text-color", "color", "font-color", "bgcolor"],
      correct: 1,
      explanation: "A propriedade 'color' define a cor do texto em CSS."
    },
    {
      id: 2,
      question: "Qual propriedade cria espaço dentro de um elemento?",
      options: ["margin", "padding", "border", "spacing"],
      correct: 1,
      explanation: "Padding cria espaço interno entre o conteúdo e a borda do elemento."
    }
  ],
  javascript: [
    {
      id: 1,
      question: "Qual método converte JSON para objeto JavaScript?",
      options: ["JSON.stringify()", "JSON.parse()", "JSON.convert()", "JSON.toObject()"],
      correct: 1,
      explanation: "JSON.parse() converte uma string JSON em um objeto JavaScript."
    },
    {
      id: 2,
      question: "Como declarar uma variável constante em JavaScript?",
      options: ["let", "var", "const", "constant"],
      correct: 2,
      explanation: "'const' é usado para declarar variáveis que não podem ser reatribuídas."
    }
  ],
  python: [
    {
      id: 1,
      question: "Qual função exibe algo no console em Python?",
      options: ["console.log()", "echo()", "print()", "output()"],
      correct: 2,
      explanation: "print() é a função embutida do Python para exibir informações."
    }
  ],
  sql: [
    {
      id: 1,
      question: "Qual comando SQL recupera dados de um banco?",
      options: ["GET", "SELECT", "RETRIEVE", "EXTRACT"],
      correct: 1,
      explanation: "SELECT é usado para consultar e recuperar dados de tabelas."
    }
  ],
  git: [
    {
      id: 1,
      question: "Qual comando cria um novo repositório Git?",
      options: ["git start", "git init", "git create", "git new"],
      correct: 1,
      explanation: "git init inicializa um novo repositório Git no diretório atual."
    }
  ]
};

// Endpoint para avaliações
app.post("/api/avaliacao", async (req, res) => {
  try {
    const { materia, respostas } = req.body;
    
    if (!materia || !questionBank[materia]) {
      return res.status(400).json({ erro: "Matéria inválida" });
    }
    
    const questoes = questionBank[materia];
    let acertos = 0;
    const resultados = [];
    
    respostas.forEach((resposta, index) => {
      const questao = questoes[index];
      const isCorrect = resposta === questao.correct;
      if (isCorrect) acertos++;
      
      resultados.push({
        questao: questao.question,
        correta: isCorrect,
        explicacao: questao.explanation,
        respostaCorreta: questao.options[questao.correct]
      });
    });
    
    const nota = (acertos / questoes.length) * 10;
    
    // Gerar feedback personalizado com IA
    const feedbackIA = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Como tutor de TI, analise este desempenho:
      
Matéria: ${materia}
Acertos: ${acertos}/${questoes.length}
Nota: ${nota.toFixed(1)}

Dê um feedback construtivo (máximo 3 linhas) incentivando o aluno a melhorar.`
    });
    
    res.json({
      materia,
      nota: nota.toFixed(1),
      acertos,
      total: questoes.length,
      resultados,
      feedback: feedbackIA.text,
      recomendacoes: nota < 6 ? "Revise os conceitos básicos e tente novamente" : 
                     nota < 8 ? "Bom trabalho! Continue praticando" : 
                     "Excelente! Você domina esta matéria"
    });
    
  } catch (error) {
    console.error("Erro na avaliação:", error);
    res.status(500).json({ erro: "Erro ao processar avaliação" });
  }
});

// Sistema de notas do aluno (simulado)
const studentGrades = {};

app.post("/api/salvar-nota", (req, res) => {
  const { alunoId, materia, nota, data } = req.body;
  
  if (!studentGrades[alunoId]) studentGrades[alunoId] = {};
  if (!studentGrades[alunoId][materia]) studentGrades[alunoId][materia] = [];
  
  studentGrades[alunoId][materia].push({ nota, data });
  
  res.json({ success: true });
});

app.get("/api/historico-notas/:alunoId", (req, res) => {
  const { alunoId } = req.params;
  res.json(studentGrades[alunoId] || {});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});