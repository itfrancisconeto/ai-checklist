import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

const tools = [
  {
    name: "build_checklist_context",
    description:
      "Cria um contexto estruturado para orientar o modelo de IA na geração de checklists objetivos.",
    inputSchema: {
      type: "object",
      properties: {
        objective: {
          type: "string",
          description: "Objetivo informado pelo usuário.",
        },
      },
      required: ["objective"],
    },
  },
  {
    name: "normalize_checklist_items",
    description:
      "Transforma uma resposta textual do modelo em uma lista limpa de tarefas.",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "Texto bruto retornado pelo modelo de IA.",
        },
      },
      required: ["text"],
    },
  },
];

function detectChecklistType(objective) {
  const text = objective.toLowerCase();

  if (text.includes("estudar") || text.includes("aprender") || text.includes("prova")) {
    return "estudo";
  }

  if (text.includes("projeto") || text.includes("desenvolver") || text.includes("implementar")) {
    return "projeto";
  }

  if (text.includes("viagem") || text.includes("viajar")) {
    return "viagem";
  }

  if (text.includes("entrevista") || text.includes("vaga") || text.includes("emprego")) {
    return "carreira";
  }

  if (
    text.includes("churrasco") ||
    text.includes("festa") ||
    text.includes("aniversário") ||
    text.includes("evento") ||
    text.includes("reunião")
  ) {
    return "evento";
  }

  return "geral";
}

function buildChecklistContext({ objective }) {
  const type = detectChecklistType(objective);

  const contextByType = {
    estudo: [
      "listar apenas os tópicos essenciais de estudo",
      "priorizar revisão e prática",
      "evitar tarefas genéricas ou muito amplas",
    ],

    projeto: [
      "listar apenas as entregas principais",
      "quebrar o objetivo em ações práticas",
      "incluir validação final somente se fizer sentido",
    ],

    viagem: [
      "listar apenas preparativos essenciais",
      "priorizar documentos, reservas e deslocamento",
      "evitar sugestões que não estejam ligadas à viagem",
    ],

    carreira: [
      "listar apenas ações ligadas à vaga ou entrevista",
      "priorizar currículo, empresa e preparação prática",
      "evitar conselhos genéricos de carreira",
    ],

    evento: [
      "listar preparativos essenciais para o evento",
      "priorizar compras, organização e itens práticos",
      "evitar tarefas genéricas ou sem relação direta",
    ],

    geral: [
      "responder somente ao pedido do usuário",
      "gerar no máximo uma pequena lista de ações",
      "não inventar tarefas extras",
    ],
  };

  return {
    objective,
    detectedType: type,
    guidelines: [
      "responder em português do Brasil",
      "gerar no máximo 10 tarefas",
      "gerar apenas tarefas diretamente relacionadas ao pedido do usuário",
      "não criar tarefas extras que não foram solicitadas",
      "não incluir título, introdução, conclusão ou observações",
      "não usar markdown",
      "não usar numeração",
      "retornar uma tarefa por linha",
      "se o pedido for simples, retornar apenas 1 item",
    ],
    suggestedStructure: contextByType[type],
  };
}

function normalizeChecklistItems({ text }) {
  const blockedTerms = [
    "aqui está",
    "segue",
    "lista de tarefas",
    "checklist",
    "objetivo:",
    "requisitos:",
    "observação",
    "observações",
    "conclusão",
    "introdução",
  ];

  const items = String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter(Boolean)
    .filter((line) => {
      const lower = line.toLowerCase();

      return !blockedTerms.some((term) => lower.includes(term));
    })
    .slice(0, 5);

  return { items };
}

function callTool(name, args = {}) {
  if (name === "build_checklist_context") {
    if (!args.objective || typeof args.objective !== "string") {
      throw new Error("O campo objective é obrigatório.");
    }

    return buildChecklistContext(args);
  }

  if (name === "normalize_checklist_items") {
    if (typeof args.text !== "string") {
      throw new Error("O campo text é obrigatório.");
    }

    return normalizeChecklistItems(args);
  }

  throw new Error(`Ferramenta MCP não encontrada: ${name}`);
}

function jsonRpcResult(id, result) {
  return {
    jsonrpc: "2.0",
    id,
    result,
  };
}

function jsonRpcError(id, message, code = -32000) {
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
    },
  };
}

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "checklist-mcp-server",
    transport: "http-json-rpc",
  });
});

app.get("/tools", (_req, res) => {
  res.json({ tools });
});

app.post("/mcp", (req, res) => {
  const { id = null, method, params = {} } = req.body || {};

  try {
    if (method === "initialize") {
      return res.json(
        jsonRpcResult(id, {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: "checklist-mcp-server",
            version: "1.0.0",
          },
        })
      );
    }

    if (method === "tools/list") {
      return res.json(jsonRpcResult(id, { tools }));
    }

    if (method === "tools/call") {
      const { name, arguments: toolArguments = {} } = params;
      const output = callTool(name, toolArguments);

      return res.json(
        jsonRpcResult(id, {
          content: [
            {
              type: "text",
              text: JSON.stringify(output, null, 2),
            },
          ],
        })
      );
    }

    return res.status(404).json(jsonRpcError(id, `Método MCP não suportado: ${method}`, -32601));
  } catch (err) {
    return res.status(400).json(jsonRpcError(id, err.message));
  }
});

app.post("/tools/:name", (req, res) => {
  try {
    const output = callTool(req.params.name, req.body || {});
    return res.json(output);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`MCP server running on port ${PORT}`);
});
