import { TUTORIAL_SAMPLE_SCOPE } from "../tutorial/mockMacroHelpResponses.js";
import {
  TUTORIAL_PROJECT_NAME,
  TUTORIAL_PROJECT_SLUG,
} from "../tutorial/mockData.js";

export const DISCOVERY_TOPIC_LABELS = {
  problem: "Problema e objetivo",
  personas: "Utilizadores / personas",
  mustHaveFeatures: "Funcionalidades must-have",
  outOfScope: "Fora de escopo",
  deliveryFormat: "Formato de entrega",
  backend: "Backend",
  frontend: "Frontend",
  persistence: "Persistência",
  authSecurity: "Auth e segurança",
  integrations: "Integrações externas",
  nfrs: "Requisitos não funcionais",
  successCriteria: "Critérios de sucesso",
  projectName: "Nome do projeto",
  projectSlug: "Slug do projeto",
};

export const DISCOVERY_TOPIC_KEYS = Object.keys(DISCOVERY_TOPIC_LABELS);

const TUTORIAL_DEMO_INPUT =
  "Quero um app de entregas de comida com cadastro, catálogo, carrinho e painel para restaurantes.";

/** @type {Record<string, { value: string, resolved: boolean }>} */
function buildPartialDecisions(resolvedKeys) {
  const all = {
    problem: {
      value: "Plataforma de pedidos de comida a ligar clientes, restaurantes e entregadores.",
      resolved: false,
    },
    personas: {
      value: "Cliente final, restaurante, entregador, admin da plataforma.",
      resolved: false,
    },
    mustHaveFeatures: {
      value: "Cadastro, catálogo, carrinho, checkout simulado, acompanhamento de pedido, painel admin.",
      resolved: false,
    },
    outOfScope: {
      value: "Pagamentos reais, apps nativos iOS/Android na v1.",
      resolved: false,
    },
    deliveryFormat: { value: "Web app (cliente + admin) + API REST.", resolved: false },
    backend: { value: "Node.js + API REST.", resolved: false },
    frontend: { value: "React.", resolved: false },
    persistence: { value: "PostgreSQL.", resolved: false },
    authSecurity: { value: "Login por e-mail/senha; roles cliente, restaurante, admin.", resolved: false },
    integrations: { value: "Nenhuma integração externa na v1.", resolved: false },
    nfrs: { value: "Sem requisitos especiais além de uso web responsivo.", resolved: false },
    successCriteria: {
      value: "Fluxo completo de pedido simulado funcional com testes automatizados.",
      resolved: false,
    },
    projectName: { value: TUTORIAL_PROJECT_NAME, resolved: false },
    projectSlug: { value: TUTORIAL_PROJECT_SLUG, resolved: false },
  };
  for (const key of resolvedKeys) {
    if (all[key]) all[key].resolved = true;
  }
  return all;
}

/**
 * @param {string} userText
 * @param {number} messageCount
 */
export function getMockDiscoveryResponse(userText, messageCount = 0) {
  const text = userText.toLowerCase();
  const isFood =
    text.includes("entrega") ||
    text.includes("comida") ||
    text.includes("restaurante") ||
    messageCount >= 1;

  if (!isFood) {
    return {
      assistantMessage:
        "Conte-me qual problema de negócio este produto resolve e para quem — seja o mais concreto possível.",
      readyToCreate: false,
      decisions: buildPartialDecisions([]),
      openTopics: ["problem"],
      proposedName: null,
      proposedSlug: null,
      scopeMd: null,
      progress: { resolved: 0, total: DISCOVERY_TOPIC_KEYS.length },
    };
  }

  if (messageCount < 1) {
    const decisions = buildPartialDecisions([
      "problem",
      "personas",
      "mustHaveFeatures",
    ]);
    return {
      assistantMessage:
        "Entendido. Vou fechar as decisões técnicas — confirma: stack React + Node + PostgreSQL, API REST, sem integrações externas na v1?",
      readyToCreate: false,
      decisions,
      openTopics: ["backend", "persistence"],
      proposedName: null,
      proposedSlug: null,
      scopeMd: null,
      progress: { resolved: 3, total: DISCOVERY_TOPIC_KEYS.length },
    };
  }

  const decisions = buildPartialDecisions(DISCOVERY_TOPIC_KEYS);
  return {
    assistantMessage:
      "Perfeito — registei todas as decisões. Revise o resumo à direita e clique em Criar projeto quando estiver de acordo.",
    readyToCreate: true,
    decisions,
    openTopics: [],
    proposedName: TUTORIAL_PROJECT_NAME,
    proposedSlug: TUTORIAL_PROJECT_SLUG,
    scopeMd: TUTORIAL_SAMPLE_SCOPE.replace(/^# .+\n\n/, ""),
    progress: {
      resolved: DISCOVERY_TOPIC_KEYS.length,
      total: DISCOVERY_TOPIC_KEYS.length,
    },
  };
}

export { TUTORIAL_DEMO_INPUT };
