# Checklist AI

Checklist AI é uma aplicação full stack simples que gera checklists práticos e objetivos a partir de um objetivo informado pelo usuário.

A versão atual inclui uma implementação simples de **MCP**, usando um serviço separado que expõe ferramentas para enriquecer o contexto enviado ao modelo de IA e normalizar a resposta gerada.

O projeto utiliza IA local com **Ollama**, frontend em **React + Vite**, backend em **Node.js + Express** e orquestração com **Docker Compose**.

---

## Tecnologias utilizadas

- **React + Vite** no frontend;
- **Node.js + Express** no backend;
- **Node.js + Express** no servidor MCP simplificado;
- **Ollama** para executar um modelo de IA localmente;
- **Docker Compose** para subir toda a stack;
- **Hot reload** em ambiente de desenvolvimento.

---

## Visão geral da arquitetura

```text
Usuário
  ↓
Frontend React
  ↓
Backend Express
  ├── chama MCP para gerar contexto estruturado
  ├── chama Ollama para gerar o checklist
  └── chama MCP para normalizar a resposta
  ↓
Frontend React
```

Fluxo detalhado:

```text
Usuário
  ↓
Frontend React
  ↓
Backend Express
  ↓
MCP: build_checklist_context
  ↓
Backend Express
  ↓
Ollama
  ↓
Backend Express
  ↓
MCP: normalize_checklist_items
  ↓
Frontend React
```

Fluxo resumido:

1. O usuário digita um objetivo no frontend.
2. O frontend envia o texto para o backend.
3. O backend chama o servidor MCP para obter um contexto estruturado.
4. O backend monta um prompt enriquecido com base no contexto retornado pelo MCP.
5. O backend envia o prompt para o Ollama.
6. O Ollama retorna o checklist em texto.
7. O backend chama novamente o MCP para normalizar os itens.
8. O frontend exibe a lista de tarefas com controle de progresso.

---

## O que foi implementado como MCP

Para manter o projeto simples e fácil de entender, foi criado um serviço separado chamado `mcp`.

Ele expõe uma interface HTTP baseada em JSON-RPC, inspirada no fluxo do **Model Context Protocol**.

Esta implementação é simplificada e didática. Ela não utiliza o SDK oficial do MCP e não representa uma implementação completa do protocolo, mas demonstra a ideia central de separar ferramentas e contexto em um serviço próprio.

O serviço MCP oferece suporte a:

- `initialize`
- `tools/list`
- `tools/call`

O objetivo é demonstrar o conceito de um servidor de ferramentas externo ao backend principal.

---

## Ferramentas MCP disponíveis

### `build_checklist_context`

Recebe o objetivo do usuário e retorna um contexto estruturado para orientar o modelo de IA.

Essa ferramenta identifica o tipo de checklist e retorna diretrizes para deixar a resposta mais objetiva.

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
    "gerar no máximo 5 itens",
    "gerar apenas itens diretamente relacionados ao pedido do usuário",
    "não criar tarefas extras que não foram solicitadas",
    "não incluir título, introdução, conclusão ou observações",
    "retornar um item por linha"
  ],
  "suggestedStructure": [
    "listar apenas os tópicos essenciais de estudo",
    "priorizar revisão e prática",
    "evitar tarefas genéricas ou muito amplas"
  ]
}
```

---

### `normalize_checklist_items`

Recebe o texto gerado pelo modelo e transforma a resposta em uma lista limpa de tarefas.

Essa ferramenta remove introduções, títulos, bullets, numerações e linhas indesejadas.

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

## Modelo de IA utilizado

O projeto utiliza, por padrão, o modelo:

```text
llama3.2:3b
```

Esse modelo oferece melhor qualidade de resposta do que a versão `1b`, principalmente para gerar checklists mais naturais e coerentes.

Caso sua máquina tenha poucos recursos, você pode usar:

```text
llama3.2:1b
```

Porém, a qualidade dos checklists tende a ser inferior.

---

## Como executar com Docker

Na raiz do projeto, execute:

```bash
docker compose up --build
```

Depois, em outro terminal, baixe o modelo dentro do container do Ollama:

```bash
docker compose exec ollama ollama pull llama3.2:3b
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

## Como executar em segundo plano

Para subir os containers em background:

```bash
docker compose up --build -d
```

Para acompanhar os logs:

```bash
docker compose logs -f
```

Para parar os containers:

```bash
docker compose down
```

---

## Hot reload em desenvolvimento

O projeto está configurado para desenvolvimento com hot reload usando volumes no Docker Compose.

Com essa configuração:

- alterações no frontend são refletidas automaticamente pelo Vite;
- alterações no backend reiniciam o servidor com `node --watch`;
- alterações no MCP também reiniciam o servidor com `node --watch`.

Caso alguma alteração não seja refletida corretamente, recrie os containers:

```bash
docker compose down
docker compose up --build
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
ollama pull llama3.2:3b
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
OLLAMA_MODEL=llama3.2:3b
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

## Backend

### Health check

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
  "model": "llama3.2:3b",
  "ollamaUrl": "http://ollama:11434",
  "mcpUrl": "http://mcp:3333",
  "mcpStatus": "ok"
}
```

---

### Gerar checklist

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
  "checklist": "Revisar conceitos fundamentais de React\nPraticar uso de hooks principais\nEstudar gerenciamento de estado\nCriar pequenos componentes práticos\nSimular perguntas comuns de entrevista",
  "items": [
    "Revisar conceitos fundamentais de React",
    "Praticar uso de hooks principais",
    "Estudar gerenciamento de estado",
    "Criar pequenos componentes práticos",
    "Simular perguntas comuns de entrevista"
  ],
  "mcpContext": {
    "objective": "estudar para uma entrevista de React",
    "detectedType": "estudo"
  }
}
```

---

## MCP

### Health check

```http
GET /health
```

Exemplo:

```bash
curl http://localhost:3333/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "service": "checklist-mcp-server",
  "transport": "http-json-rpc"
}
```

---

### Listar ferramentas

```http
POST /mcp
```

Exemplo:

```bash
curl -X POST http://localhost:3333/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

---

### Chamar ferramenta MCP

Exemplo chamando `build_checklist_context`:

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

Exemplo chamando `normalize_checklist_items`:

```bash
curl -X POST http://localhost:3333/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":3,
    "method":"tools/call",
    "params":{
      "name":"normalize_checklist_items",
      "arguments":{
        "text":"1. Comprar passagens\n2. Reservar hospedagem\n3. Separar documentos"
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
| `OLLAMA_MODEL` | Modelo usado pelo Ollama | `llama3.2:3b` | `llama3.2:3b` |
| `MCP_URL` | URL do servidor MCP | `http://mcp:3333` | `http://localhost:3333` |

---

### Frontend

| Variável | Descrição | Exemplo |
|---|---|---|
| `VITE_API_URL` | URL pública do backend | `http://localhost:3001` |

---

## Como testar rapidamente

Com os containers rodando, teste o MCP:

```bash
curl http://localhost:3333/health
```

Depois teste o backend:

```bash
curl http://localhost:3001/health
```

Por fim, gere um checklist:

```bash
curl -X POST http://localhost:3001/checklist \
  -H "Content-Type: application/json" \
  -d '{"prompt":"organizar minha rotina de estudos"}'
```

---

## Exemplo de uso

Entrada do usuário:

```text
quero fazer um churrasco
```

Resposta esperada:

```text
Comprar carnes, carvão, bebidas e acompanhamentos
Separar churrasqueira, grelha, espetos e utensílios
Temperar as carnes com antecedência
Acender o carvão com segurança
Organizar pratos, copos, talheres e guardanapos
```

---

## Comandos úteis

Subir tudo:

```bash
docker compose up --build
```

Subir tudo em segundo plano:

```bash
docker compose up --build -d
```

Parar tudo:

```bash
docker compose down
```

Remover containers, imagens e volumes antigos:

```bash
docker compose down --rmi all -v
```

Ver containers ativos:

```bash
docker compose ps
```

Ver todos os containers, inclusive parados:

```bash
docker compose ps -a
```

Ver logs do backend:

```bash
docker compose logs -f backend
```

Ver logs do MCP:

```bash
docker compose logs -f mcp
```

Ver logs do frontend:

```bash
docker compose logs -f frontend
```

Ver logs do Ollama:

```bash
docker compose logs -f ollama
```

Baixar o modelo no Ollama:

```bash
docker compose exec ollama ollama pull llama3.2:3b
```

Listar modelos instalados no Ollama:

```bash
docker compose exec ollama ollama list
```

---

## Observação importante sobre o MCP deste projeto

Esta implementação foi feita da forma mais simples possível para fins didáticos.

Ela demonstra o conceito de separar ferramentas e contexto em um serviço próprio, chamado pelo backend antes e depois da chamada ao modelo de IA.

Na prática, o MCP deste projeto é responsável por:

- detectar o tipo de checklist;
- montar um contexto estruturado para o modelo;
- expor ferramentas via JSON-RPC;
- normalizar a saída gerada pela IA;
- ajudar o backend a produzir respostas mais previsíveis.

Em uma evolução futura, este serviço poderia ser adaptado para usar o SDK oficial do Model Context Protocol, transporte via stdio ou SSE, autenticação, persistência de ferramentas e integração com múltiplos clientes.

---

## Possíveis melhorias futuras

- Usar o SDK oficial do MCP;
- Adicionar autenticação entre backend e MCP;
- Criar mais ferramentas MCP, como priorização de tarefas, estimativa de tempo e categorização;
- Salvar checklists em banco de dados;
- Permitir edição e reordenação dos itens;
- Adicionar histórico de checklists gerados;
- Adicionar exportação para PDF ou Markdown;
- Adicionar suporte a múltiplos modelos do Ollama;
- Criar testes automatizados para backend, frontend e MCP;
- Adicionar um banco vetorial em uma fase futura para buscar exemplos, documentos ou checklists anteriores.

---

## Licença

Este projeto foi criado para fins de estudo, experimentação e demonstração de uma arquitetura simples usando IA local, MCP simplificado e Docker.