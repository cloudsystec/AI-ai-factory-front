import { TUTORIAL_SAMPLE_SCOPE } from "./mockMacroHelpResponses.js";

export const TUTORIAL_PROJECT_SLUG = "tutorial-demo";
export const TUTORIAL_PROJECT_NAME = "App de entregas (demo)";

export const MOCK_PROJECT = {
  slug: TUTORIAL_PROJECT_SLUG,
  name: TUTORIAL_PROJECT_NAME,
  lifecycleStatus: "started",
  microCount: 3,
  repoMode: "client",
  gitStatus: "ready",
};

export const MOCK_SCOPE_STATE = {
  project: TUTORIAL_PROJECT_SLUG,
  macroId: TUTORIAL_PROJECT_SLUG,
  macroTitle: TUTORIAL_PROJECT_NAME,
  macroScopeMd: TUTORIAL_SAMPLE_SCOPE,
  macroExists: true,
  macroEditable: false,
  microCount: 3,
  taskCount: 6,
  microsReady: true,
  tasksReady: true,
  projectCompleted: false,
  current: {
    key: "dev",
    label: "Implementação",
    hint: "Tasks em execução no Kanban (demo).",
  },
  scopeSteps: [
    { key: "macro", label: "Macro", state: "done" },
    { key: "micro", label: "Micros & PO", state: "done" },
    { key: "tasking", label: "Tasks (onda)", state: "done" },
    { key: "dev", label: "Implementação", state: "active" },
  ],
  devPipelineActive: true,
  micros: [],
};

export const MOCK_MICROS = [
  {
    id: "M-001",
    priority: 1,
    title: "Autenticação e perfis de usuário",
    description:
      "Cadastro, login e papéis para cliente, restaurante e entregador — base para o restante do app.",
    risks: "Integração com provedor de e-mail e política de senhas.",
    poScore: 92,
    taskDeliveryStatus: "closed",
    dependencies: [],
    tasks: [
      { id: "T-001", title: "API de autenticação JWT", status: "todo" },
      { id: "T-002", title: "Telas de login e registro", status: "todo" },
    ],
  },
  {
    id: "M-002",
    priority: 2,
    title: "Catálogo e pedidos",
    description:
      "Restaurantes publicam cardápio; clientes montam carrinho e acompanham status do pedido.",
    risks: "Upload de imagens e consistência de estoque.",
    poScore: 88,
    taskDeliveryStatus: "closed",
    dependencies: ["M-001"],
    tasks: [
      { id: "T-003", title: "CRUD de restaurantes", status: "todo" },
      { id: "T-004", title: "Carrinho e checkout", status: "todo" },
    ],
  },
  {
    id: "M-003",
    priority: 3,
    title: "Entrega e painel operacional",
    description: "Fluxo do entregador, notificações e métricas básicas para o restaurante.",
    risks: "Geolocalização em tempo real na v1 web.",
    poScore: 85,
    taskDeliveryStatus: "open",
    dependencies: ["M-002"],
    tasks: [{ id: "T-005", title: "Painel do entregador", status: "todo" }],
  },
];

MOCK_SCOPE_STATE.micros = MOCK_MICROS;

/** @returns {object[]} */
export function createInitialMockTasks() {
  return [
    {
      id: "T-001",
      title: "API de autenticação JWT",
      status: "todo",
      currentAgent: "Dev Agent",
      blockReason: null,
    },
    {
      id: "T-002",
      title: "CRUD de restaurantes",
      status: "todo",
      currentAgent: "Dev Agent",
      blockReason: null,
    },
    {
      id: "T-003",
      title: "Carrinho e checkout",
      status: "todo",
      currentAgent: "Dev Agent",
      blockReason: null,
    },
    {
      id: "T-004",
      title: "Painel do entregador",
      status: "todo",
      currentAgent: "Dev Agent",
      blockReason: null,
    },
  ];
}

export const MOCK_WORKERS_STATUS = [
  { slot: 1, botReady: true },
  { slot: 2, botReady: true },
];

export const MOCK_BILLING_SUMMARY = {
  cotation: 5.1,
  usedPercent: 18,
  poolCreditCycleUsd: 150,
  usedUsd: 27.5,
  balanceUsd: 122.5,
  usageEventsTotal: 42,
  planId: "starter",
};

export const MOCK_PROJECT_COST = {
  actualCostUsd: 8.5,
  forecastCostUsd: 32,
  cotation: 5.1,
  usageEventsTotal: 24,
};

export const MOCK_AGENT_PROMPT = `# Dev Agent — App de entregas

## Objetivo
Implementar funcionalidades com código limpo, testável e alinhado ao escopo do projeto.

## Regras
- Preferir APIs REST com validação de entrada
- Cobrir fluxos críticos com testes automatizados
- Documentar endpoints novos no README do serviço
- Pedir revisão humana antes de merge em áreas sensíveis
`;

/** @type {object} */
export const MOCK_USAGE_EVENTS = {
  cotation: 5.1,
  stats: {
    totalCount: 24,
    totalCostUsd: 8.5,
    confirmedCount: 20,
    estimatedCount: 4,
  },
  agents: [
    { agentKey: "dev", agentName: "Dev Agent", count: 12 },
    { agentKey: "qa", agentName: "QA Agent", count: 8 },
    { agentKey: "planner", agentName: "Planner", count: 4 },
  ],
  events: [
    {
      execution_id: "exec-demo-001",
      job_id: "job-demo-001",
      created_at: "2026-06-05T14:32:00.000Z",
      agent_name: "Dev Agent",
      executor_email: "executor@demo.dev",
      status: "completed",
      charge_confirmed: true,
      cost_base_usd: 0.42,
    },
    {
      execution_id: "exec-demo-002",
      job_id: "job-demo-002",
      created_at: "2026-06-05T14:18:00.000Z",
      agent_name: "QA Agent",
      executor_email: "executor@demo.dev",
      status: "completed",
      charge_confirmed: true,
      cost_base_usd: 0.31,
    },
    {
      execution_id: "exec-demo-003",
      job_id: "job-demo-003",
      created_at: "2026-06-05T13:55:00.000Z",
      agent_name: "Dev Agent",
      executor_email: "executor@demo.dev",
      status: "estimated",
      charge_confirmed: false,
      cost_base_usd: 0.28,
    },
    {
      execution_id: "exec-demo-004",
      job_id: "job-demo-004",
      created_at: "2026-06-05T13:40:00.000Z",
      agent_name: "Planner",
      executor_email: "executor@demo.dev",
      status: "completed",
      charge_confirmed: true,
      cost_base_usd: 0.19,
    },
  ],
};
