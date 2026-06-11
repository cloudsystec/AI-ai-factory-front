import React from "react";
import {
  isClientGitConnected,
  isWorkspacePreparing,
  canConnectClientGit,
} from "../lib/projectGit.js";
import GitDisconnectPanel from "./GitDisconnectPanel.jsx";
import GlassSelect from "./GlassSelect.jsx";
import { useGitDisconnect } from "../hooks/useGitDisconnect.js";

function projectSlug(p) {
  return typeof p === "string" ? p : p.slug;
}

function projectLabel(p) {
  if (typeof p === "string") return p;
  if (isClientGitConnected(p) && p.defaultBranch) {
    return `${p.name || p.slug} · ${p.defaultBranch}`;
  }
  if (isWorkspacePreparing(p)) {
    return `${p.name || p.slug} [a preparar…]`;
  }
  return p.name || p.slug;
}

/**
 * @param {object} props — same as former ProjectBar minus projectCompleted delivery
 */
export default function ProjectSelectorBar({
  projects,
  selectedProject,
  selectedProjectMeta = null,
  onProjectChange,
  canWrite = false,
  onNewProject,
  onEditProject,
  onResetProject,
  onDeleteProject,
  onConnectGit,
  onRefreshProjects,
  resetting = false,
  runningCount = 0,
  compact = false,
}) {
  const gitDisconnect = useGitDisconnect(selectedProject, onRefreshProjects);
  const showGitUi = isClientGitConnected(selectedProjectMeta);
  const preparing = isWorkspacePreparing(selectedProjectMeta);
  const showConnectGit =
    canWrite && onConnectGit && canConnectClientGit(selectedProjectMeta);
  const disconnectActive =
    gitDisconnect.busy ||
    gitDisconnect.loading ||
    gitDisconnect.status?.phase === "provisioning" ||
    gitDisconnect.status?.phase === "failed";

  return (
    <div
      className={`project-selector-bar${
        compact ? " project-selector-bar--compact" : ""
      }`}
    >
      <div className="project-selector-bar__field">
        {compact && (
          <span className="project-selector-bar__field-icon" aria-hidden>
            📁
          </span>
        )}
        <GlassSelect
          id="project-select"
          wrapClassName="glass-select-wrap--fluid"
          className="project-selector-bar__select project-bar__select"
          value={selectedProject}
          onChange={(e) => onProjectChange(e.target.value)}
          aria-label="Projeto"
        >
          <option value="">Selecione um projeto</option>
          {projects.map((p) => {
            const slug = projectSlug(p);
            return (
              <option key={slug} value={slug}>
                {projectLabel(p)}
              </option>
            );
          })}
        </GlassSelect>
      </div>

      {showGitUi && (
        <span className="project-selector-bar__git-pill">
          {compact ? "Git ativo" : "Git ativo"}
        </span>
      )}

      {canWrite && (
        <div className="project-selector-bar__actions">
          {onNewProject && (
            <button
              type="button"
              className="project-selector-bar__icon-btn project-selector-bar__icon-btn--new project-bar__icon-btn--new"
              onClick={onNewProject}
              title="Novo projeto"
            >
              +
            </button>
          )}
          {!compact && selectedProject && onEditProject && (
            <button
              type="button"
              className="project-selector-bar__icon-btn project-bar__icon-btn--edit"
              onClick={onEditProject}
              title="Editar projeto"
            >
              ✎
            </button>
          )}
          {!compact && selectedProject && onResetProject && (
            <button
              type="button"
              className="project-selector-bar__icon-btn project-bar__icon-btn--reset"
              disabled={resetting || runningCount > 0}
              onClick={onResetProject}
              title="Reset projeto"
            >
              ↺
            </button>
          )}
          {!compact && selectedProject && onDeleteProject && (
            <button
              type="button"
              className="project-selector-bar__icon-btn project-bar__icon-btn--delete"
              disabled={resetting || runningCount > 0}
              onClick={onDeleteProject}
              title="Deletar projeto"
            >
              🗑
            </button>
          )}
          {!compact && showConnectGit && (
            <button
              type="button"
              className="project-selector-bar__icon-btn project-bar__icon-btn--git"
              onClick={onConnectGit}
              title="Conectar GitHub"
            >
              + Git
            </button>
          )}
          {!compact && canWrite && selectedProject && showGitUi && (
            <GitDisconnectPanel
              projectMeta={selectedProjectMeta}
              status={gitDisconnect.status}
              error={gitDisconnect.error}
              loading={gitDisconnect.loading}
              busy={gitDisconnect.busy}
              runningCount={runningCount}
              onDisconnect={gitDisconnect.handleDisconnect}
              showButton
              compact
            />
          )}
        </div>
      )}

      {(preparing || disconnectActive) && selectedProject && (
        <div className="project-selector-bar__meta">
          {preparing && !disconnectActive && (
            <span className="msg msg--muted">A preparar workspace…</span>
          )}
          {disconnectActive && (
            <GitDisconnectPanel
              projectMeta={selectedProjectMeta}
              status={gitDisconnect.status}
              error={gitDisconnect.error}
              loading={gitDisconnect.loading}
              busy={gitDisconnect.busy}
              runningCount={runningCount}
              onDisconnect={gitDisconnect.handleDisconnect}
              showButton={showGitUi}
            />
          )}
        </div>
      )}
    </div>
  );
}
