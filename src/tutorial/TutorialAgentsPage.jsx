import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faFolderOpen,
  faRotateLeft,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import AppSubpagePanel from "../components/AppSubpagePanel.jsx";
import AgentRolePicker from "../components/AgentRolePicker.jsx";
import { getAgentRoleMeta } from "../lib/agentRoleMeta.js";
import {
  MOCK_AGENT_PROMPT,
  TUTORIAL_PROJECT_NAME,
} from "./mockData.js";

/**
 * @param {{ currentStepId: string }} props
 */
export default function TutorialAgentsPage({ currentStepId }) {
  const roleKey = "dev";
  const roleMeta = getAgentRoleMeta(roleKey);
  const content = MOCK_AGENT_PROMPT;
  const lineCount = content ? content.split("\n").length : 0;

  return (
    <div className="agents-page-shell">
      <AppSubpagePanel
        className="admin-page agents-page agents-page-shell__panel"
        eyebrow="Pipeline"
        title={
          <span className="agents-page__title-row">
            <span className="agents-page__project-chip">
              <FontAwesomeIcon icon={faFolderOpen} aria-hidden />
              {TUTORIAL_PROJECT_NAME}
            </span>
            <span className="agents-page__title-text">Agentes</span>
          </span>
        }
        subtitle={`Prompt do agente ${roleMeta.label} · personalização por projeto`}
        headerActions={
          <button
            type="button"
            className="toolbar-btn agents-page__reset-btn"
            disabled
            title="Demo — restaurar templates"
          >
            <FontAwesomeIcon icon={faRotateLeft} aria-hidden />
            Restaurar templates
          </button>
        }
      >
        <div className="agents-page__layout">
          <div
            className="agents-page__toolbar"
            data-tutorial={
              currentStepId === "agents_actions" ? "agents-toolbar" : undefined
            }
          >
            <div
              data-tutorial={
                currentStepId === "agents_roles" ? "agents-role-picker" : undefined
              }
            >
              <AgentRolePicker
                value={roleKey}
                onChange={() => {}}
                excludeRoleKeys={["global"]}
              />
            </div>
            <div className="agents-page__toolbar-actions">
              <button type="button" className="agents-page__action-btn" disabled={!content.trim()}>
                <FontAwesomeIcon icon={faEye} aria-hidden />
                Preview
              </button>
              <button type="button" className="agents-page__help-btn" disabled={false}>
                <FontAwesomeIcon icon={faWandMagicSparkles} aria-hidden />
                Preciso de ajuda com a configuração
              </button>
            </div>
          </div>

          <div
            className="agents-page__editor-shell"
            data-tutorial={currentStepId === "agents_editor" ? "agents-editor" : undefined}
          >
            <div className="agents-page__editor-head">
              <span className="agents-page__editor-label">
                Prompt markdown · {roleMeta.label}
              </span>
              <span className="agents-page__saved-badge">Sincronizado</span>
            </div>
            <textarea
              className="agents-page__editor custom-scrollbar"
              value={content}
              readOnly
              spellCheck={false}
            />
          </div>

          <footer className="agents-page__footer">
            <div className="agents-page__footer-meta">
              <span>{lineCount} linhas</span>
              <span className="agents-page__footer-dot" aria-hidden />
              <span>{content.length.toLocaleString("pt-PT")} caracteres</span>
            </div>
            <button type="button" className="toolbar-btn toolbar-btn--primary agents-page__save-btn" disabled>
              Salvar alterações
            </button>
          </footer>
        </div>
      </AppSubpagePanel>
    </div>
  );
}
