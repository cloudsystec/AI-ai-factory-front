import {
  faBrain,
  faClipboardCheck,
  faCode,
  faGlobe,
  faListCheck,
  faMicrochip,
  faRobot,
  faScaleBalanced,
  faSitemap,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";

/** @typedef {{ label: string, description: string, icon: import("@fortawesome/fontawesome-svg-core").IconDefinition, tone: string }} AgentRoleMeta */

/** @type {Record<string, AgentRoleMeta>} */
export const AGENT_ROLE_META = {
  global: {
    label: "Global",
    description: "Regras partilhadas por todos os agentes",
    icon: faGlobe,
    tone: "teal",
  },
  planner: {
    label: "Planner",
    description: "Planeamento inicial e orientação do pipeline",
    icon: faBrain,
    tone: "indigo",
  },
  dev: {
    label: "Dev",
    description: "Implementação, código e alterações técnicas",
    icon: faCode,
    tone: "cyan",
  },
  qa: {
    label: "QA",
    description: "Testes, validação e critérios de qualidade",
    icon: faClipboardCheck,
    tone: "emerald",
  },
  reviewer: {
    label: "Reviewer",
    description: "Revisão de código e feedback técnico",
    icon: faScaleBalanced,
    tone: "violet",
  },
  macro_to_micro: {
    label: "Macro → Micro",
    description: "Decomposição do escopo macro em microescopos",
    icon: faSitemap,
    tone: "sky",
  },
  po_micro_validator: {
    label: "PO Micro",
    description: "Validação de microescopos pelo product owner",
    icon: faListCheck,
    tone: "amber",
  },
  micro_refiner: {
    label: "Micro Refiner",
    description: "Refinamento e clareza dos microescopos",
    icon: faWandMagicSparkles,
    tone: "fuchsia",
  },
  micro_prioritizer: {
    label: "Micro Prioritizer",
    description: "Ordem e prioridade entre microescopos",
    icon: faMicrochip,
    tone: "rose",
  },
  micro_to_tasks: {
    label: "Micro → Tasks",
    description: "Conversão de microescopos em tarefas",
    icon: faSitemap,
    tone: "blue",
  },
  techlead_task_validator: {
    label: "Tech Lead Tasks",
    description: "Validação técnica das tarefas geradas",
    icon: faScaleBalanced,
    tone: "slate",
  },
  task_refiner: {
    label: "Task Refiner",
    description: "Refinamento de tarefas antes da execução",
    icon: faWandMagicSparkles,
    tone: "purple",
  },
  task_prioritizer: {
    label: "Task Prioritizer",
    description: "Priorização do backlog de tarefas",
    icon: faListCheck,
    tone: "orange",
  },
};

/**
 * @param {string} roleKey
 * @returns {AgentRoleMeta}
 */
export function getAgentRoleMeta(roleKey) {
  return (
    AGENT_ROLE_META[roleKey] || {
      label: roleKey.replace(/_/g, " "),
      description: "Agente do pipeline DevForLess",
      icon: faRobot,
      tone: "slate",
    }
  );
}
