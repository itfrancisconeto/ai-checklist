import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables from backend/.env when running locally.
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:1b";
const MCP_URL = process.env.MCP_URL || "http://localhost:3333";

function normalizeChecklistText(text = "") {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter(Boolean);
}

async function callMcpTool(name, toolArguments = {}) {
  const response = await fetch(`${MCP_URL}/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: {
        name,
        arguments: toolArguments,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || "Falha ao chamar ferramenta MCP.");
  }

  const textContent = data.result?.content?.[0]?.text || "{}";
  return JSON.parse(textContent);
}

function buildPrompt(userPrompt, mcpContext) {
  return `Você é um assistente especializado em gerar checklists curtos, práticos e objetivos em português do Brasil.

  Pedido do usuário:
  "${userPrompt}"

  Tipo detectado pelo MCP:
  ${mcpContext?.detectedType || "geral"}

  Contexto fornecido pelo MCP:
  ${JSON.stringify(mcpContext, null, 2)}

  Sua tarefa:
  Gerar um checklist diretamente relacionado ao pedido do usuário.

  Regras obrigatórias:
  - Gere exatamente 5 itens.
  - Responda apenas com as tarefas.
  - Use uma tarefa por linha.
  - Não escreva título.
  - Não escreva introdução.
  - Não escreva conclusão.
  - Não escreva observações.
  - Não use markdown.
  - Não use numeração.
  - Não use bullets.
  - Não use frases genéricas.
  - Não invente tarefas pouco relacionadas ao pedido.
  - Cada item deve começar com um verbo de ação.
  - Cada item deve ter no máximo 12 palavras.
  - Se o pedido for simples demais para 5 tarefas, gere apenas 1 item objetivo.

  Exemplo bom para o pedido "quero fazer um churrasco":
  Comprar carnes, carvão, bebidas e acompanhamentos
  Separar churrasqueira, grelha, espetos e utensílios
  Temperar as carnes com antecedência
  Acender o carvão com segurança
  Organizar pratos, copos, talheres e guardanapos

  Exemplo ruim:
  Aqui está sua lista de tarefas para fazer um churrasco
  Preparar o churrasco
  Cozinhar as carnes
  Aquecer os assentos ao ar livre
  Lavar panelas

  Agora gere o checklist para o pedido do usuário.

  Resposta:`;
}

app.get("/health", async (_req, res) => {
  let mcpStatus = "unavailable";

  try {
    const response = await fetch(`${MCP_URL}/health`);
    mcpStatus = response.ok ? "ok" : "error";
  } catch (_err) {
    mcpStatus = "unavailable";
  }

  res.json({
    status: "ok",
    service: "checklist-backend",
    model: OLLAMA_MODEL,
    ollamaUrl: OLLAMA_URL,
    mcpUrl: MCP_URL,
    mcpStatus,
  });
});

app.post("/checklist", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({
      error: "Informe um prompt válido para gerar o checklist.",
    });
  }

  try {
    let mcpContext;

    try {
      mcpContext = await callMcpTool("build_checklist_context", {
        objective: prompt.trim(),
      });
    } catch (mcpError) {
      console.warn(`MCP unavailable. Using fallback context. Details: ${mcpError.message}`);
      mcpContext = {
        objective: prompt.trim(),
        detectedType: "fallback",
        guidelines: [
          "responder em português do Brasil",
          "gerar tarefas acionáveis",
          "retornar uma tarefa por linha",
        ],
      };
    }

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        prompt: buildPrompt(prompt.trim(), mcpContext),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: "Falha ao consultar o Ollama.",
        details: errorText,
      });
    }

    const data = await response.json();
    const checklistText = data.response || "";

    let items;

    try {
      const normalized = await callMcpTool("normalize_checklist_items", {
        text: checklistText,
      });
      items = normalized.items || [];
    } catch (mcpError) {
      console.warn(`MCP normalization unavailable. Using local fallback. Details: ${mcpError.message}`);
      items = normalizeChecklistText(checklistText);
    }

    return res.json({
      checklist: checklistText,
      items,
      mcpContext,
    });
  } catch (err) {
    return res.status(500).json({
      error: "Erro interno ao gerar checklist.",
      details: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  console.log(`Using Ollama at ${OLLAMA_URL} with model ${OLLAMA_MODEL}`);
  console.log(`Using MCP server at ${MCP_URL}`);
});
