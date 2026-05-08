# Checklist AI

Checklist AI é uma aplicação full stack simples que gera checklists práticos a partir de um objetivo informado pelo usuário.

A versão atual inclui uma implementação simples de **MCP**, usando um serviço separado que expõe ferramentas para enriquecer o contexto enviado ao modelo de IA e normalizar a resposta gerada.

---

## Tecnologias utilizadas

- **React + Vite** no frontend;
- **Node.js + Express** no backend;
- **Node.js + Express** no servidor MCP simplificado;
- **Ollama** para executar um modelo de IA localmente;
- **Docker Compose** para subir toda a stack.

---

## Visão geral da arquitetura

```text
Usuário
  ↓
Frontend React
  ↓
Backend Express
  ↓
Servidor MCP simplificado
  ↓
Backend Express
  ↓
Ollama
  ↓
Backend Express
  ↓
Servidor MCP simplificado
  ↓
Frontend React
```

Fluxo resumido:

1. O usuário digita um objetivo no frontend.
2. O frontend envia o texto para o backend.
3. O backend chama o servidor MCP para obter um contexto estruturado.
4. O backend envia o prompt enriquecido para o Ollama.
5. O Ollama retorna o checklist em texto.
6. O backend chama novamente o MCP para normalizar os itens.
7. O frontend exibe a lista de tarefas com controle de progresso.

---

## O que foi implementado como MCP

Para manter o projeto simples e fácil de entender, foi criado um serviço separado chamado `mcp`.

Ele expõe uma interface HTTP baseada em JSON-RPC, inspirada no fluxo do Model Context Protocol, com suporte a:

- `initialize`
- `tools/list`
- `tools/call`

O objetivo aqui é demonstrar o conceito de um servidor de ferramentas externo ao backend principal.

### Ferramentas disponíveis

#### `build_checklist_context`

Recebe o objetivo do usuário e retorna um contexto estruturado para orientar o modelo.

Exemplo de entrada:

```json
{
  "objective": "estudar para uma entrevista de React"
}
```

Exemplo de saída:

```json
{
  "objective": "estudar para uma entrevista de React",
  "detectedType": "estudo",
  "guidelines": [
    "responder em português do Brasil",
    "gerar apenas tarefas acionáveis",
    "usar frases curtas e claras"
  ],
  "suggestedStructure": [
    "organizar os tópicos principais",
    "separar materiais de estudo",
    "definir horários realistas"
  ]
}
```

#### `normalize_checklist_items`

Recebe o texto gerado pelo modelo e transforma a resposta em uma lista limpa de tarefas.

Exemplo de entrada:

```json
{
  "text": "- Revisar conceitos de React\n- Praticar hooks\n- Estudar gerenciamento de estado"
}
```

Exemplo de saída:

```json
{
  "items": [
    "Revisar conceitos de React",
    "Praticar hooks",
    "Estudar gerenciamento de estado"
  ]
}
```

---

## Estrutura do projeto

```text
ChecklistAI/
├── backend/
│   ├── src/
│   │   └── index.js
│   ├── .env
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChecklistItem.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   └── PromptInput.jsx
│   │   ├── App.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── Dockerfile
│   ├── index.html
│   └── package.json
├── mcp/
│   ├── src/
│   │   └── index.js
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## Requisitos

Para rodar com Docker:

- Docker
- Docker Compose

Para rodar localmente sem Docker:

- Node.js 20 ou superior
- npm
- Ollama instalado localmente

---

## Como executar com Docker

Na raiz do projeto, execute:

```bash
docker compose up --build
```

Depois, em outro terminal, baixe o modelo dentro do container do Ollama:

```bash
docker compose exec ollama ollama pull llama3.2:1b
```

Acesse a aplicação em:

```text
http://localhost:5174
```

Serviços disponíveis:

```text
Frontend: http://localhost:5174
Backend:  http://localhost:3001
MCP:      http://localhost:3333
Ollama:   http://localhost:11434
```

---

## Como executar localmente sem Docker

### 1. Inicie o Ollama

Em um terminal:

```bash
ollama serve
```

Em outro terminal, baixe o modelo:

```bash
ollama pull llama3.2:1b
```

---

### 2. Execute o servidor MCP

Entre na pasta do MCP:

```bash
cd mcp
```

Instale as dependências:

```bash
npm install
```

Inicie o servidor:

```bash
npm run dev
```

O MCP ficará disponível em:

```text
http://localhost:3333
```

---

### 3. Execute o backend

Em outro terminal, entre na pasta do backend:

```bash
cd backend
```

Instale as dependências:

```bash
npm install
```

Crie o arquivo `.env` com base no `.env.example`:

```bash
cp .env.example .env
```

Para execução local, use:

```env
PORT=3001
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:1b
MCP_URL=http://localhost:3333
```

Inicie o backend:

```bash
npm run dev
```

O backend ficará disponível em:

```text
http://localhost:3001
```

---

### 4. Execute o frontend

Em outro terminal, entre na pasta do frontend:

```bash
cd frontend
```

Instale as dependências:

```bash
npm install
```

Opcionalmente, crie um `.env` local:

```bash
cp .env.example .env
```

Conteúdo esperado:

```env
VITE_API_URL=http://localhost:3001
```

Inicie o frontend:

```bash
npm run dev
```

Acesse:

```text
http://localhost:5174
```

---

## Endpoints principais

### Backend

#### Health check

```http
GET /health
```

Exemplo:

```bash
curl http://localhost:3001/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "service": "checklist-backend",
  "model": "llama3.2:1b",
  "ollamaUrl": "http://ollama:11434",
  "mcpUrl": "http://mcp:3333",
  "mcpStatus": "ok"
}
```

#### Gerar checklist

```http
POST /checklist
```

Exemplo:

```bash
curl -X POST http://localhost:3001/checklist \
  -H "Content-Type: application/json" \
  -d '{"prompt":"estudar para uma entrevista de React"}'
```

Resposta esperada:

```json
{
  "checklist": "Revisar conceitos de React\nPraticar hooks\nEstudar gerenciamento de estado",
  "items": [
    "Revisar conceitos de React",
    "Praticar hooks",
    "Estudar gerenciamento de estado"
  ],
  "mcpContext": {
    "objective": "estudar para uma entrevista de React",
    "detectedType": "estudo"
  }
}
```

---

### MCP

#### Health check

```http
GET /health
```

Exemplo:

```bash
curl http://localhost:3333/health
```

#### Listar ferramentas

```http
POST /mcp
```

Exemplo:

```bash
curl -X POST http://localhost:3333/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

#### Chamar ferramenta MCP

```bash
curl -X POST http://localhost:3333/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":2,
    "method":"tools/call",
    "params":{
      "name":"build_checklist_context",
      "arguments":{
        "objective":"planejar uma viagem"
      }
    }
  }'
```

---

## Variáveis de ambiente

### Backend

| Variável | Descrição | Exemplo com Docker | Exemplo local |
|---|---|---|---|
| `PORT` | Porta do backend | `3001` | `3001` |
| `OLLAMA_URL` | URL do Ollama | `http://ollama:11434` | `http://localhost:11434` |
| `OLLAMA_MODEL` | Modelo usado pelo Ollama | `llama3.2:1b` | `llama3.2:1b` |
| `MCP_URL` | URL do servidor MCP | `http://mcp:3333` | `http://localhost:3333` |

### Frontend

| Variável | Descrição | Exemplo |
|---|---|---|
| `VITE_API_URL` | URL pública do backend | `http://localhost:3001` |

---

## Como testar rapidamente

Com os containers rodando, execute:

```bash
curl http://localhost:3333/health
```

Depois:

```bash
curl http://localhost:3001/health
```

E por fim:

```bash
curl -X POST http://localhost:3001/checklist \
  -H "Content-Type: application/json" \
  -d '{"prompt":"organizar minha rotina de estudos"}'
```

---

## Observação importante sobre o MCP deste projeto

Esta implementação foi feita da forma mais simples possível para fins didáticos.

Ela demonstra o conceito de separar ferramentas e contexto em um serviço próprio, chamado pelo backend antes e depois da chamada ao modelo de IA.

Em uma evolução futura, este serviço poderia ser adaptado para usar o SDK oficial do Model Context Protocol, transporte via stdio ou SSE, autenticação, persistência de ferramentas e integração com múltiplos clientes.

---

## Comandos úteis

Subir tudo:

```bash
docker compose up --build
```

Parar tudo:

```bash
docker compose down
```

Ver logs do backend:

```bash
docker compose logs -f backend
```

Ver logs do MCP:

```bash
docker compose logs -f mcp
```

Ver logs do Ollama:

```bash
docker compose logs -f ollama
```

Baixar o modelo no Ollama:

```bash
docker compose exec ollama ollama pull llama3.2:1b
```

---

## Possíveis melhorias futuras

- Usar o SDK oficial do MCP;
- Adicionar autenticação entre backend e MCP;
- Criar mais ferramentas MCP, como priorização de tarefas, estimativa de tempo e categorização;
- Salvar checklists em banco de dados;
- Permitir edição e reordenação dos itens;
- Adicionar histórico de checklists gerados;
- Criar testes automatizados para backend, frontend e MCP.
