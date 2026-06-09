import React from "react";
import {
  isClientGitConnected,
  isWorkspacePreparing,
  canConnectClientGit,
} from "./lib/projectGit.js";
import GitDisconnectPanel from "./components/GitDisconnectPanel.jsx";
import { useGitDisconnect } from "./hooks/useGitDisconnect.js";

/**
 * @param {string|object} p
 */
function projectSlug(p) {
  return typeof p === "string" ? p : p.slug;
}

/**
 * @param {string|object} p
 */
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

function githubRepoUrl(repoFullName) {
  const repo = String(repoFullName || "").trim();
  if (!repo || !repo.includes("/")) return null;
  return `https://github.com/${repo}`;
}

function githubBranchUrl(repoFullName, branch) {
  const base = githubRepoUrl(repoFullName);
  const name = String(branch || "").trim();
  if (!base || !name) return null;
  return `${base}/tree/${encodeURIComponent(name)}`;
}

/**
 * @param {{
 *   projects: (string|object)[],
 *   selectedProject: string,
 *   selectedProjectMeta?: object|null,
 *   onProjectChange: (slug: string) => void,
 *   canWrite?: boolean,
 *   onNewProject?: () => void,
 *   onEditProject?: () => void,
 *   onResetProject?: () => void,
 *   onDeleteProject?: () => void,
 *   onConnectGit?: () => void,
 *   onRefreshProjects?: () => void | Promise<void>,
 *   resetting?: boolean,
 *   runningCount?: number,
 *   projectCompleted?: boolean,
 * }} props
 */
export default function ProjectBar({
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
  projectCompleted = false,
}) {
  const gitDisconnect = useGitDisconnect(selectedProject, onRefreshProjects);
  const showGitUi = isClientGitConnected(selectedProjectMeta);
  const preparing = isWorkspacePreparing(selectedProjectMeta);
  const showConnectGit =
    canWrite && onConnectGit && canConnectClientGit(selectedProjectMeta);
  const disconnectActive =
    gitDisconnect.busy ||
    gitDisconnect.loading ||
    ["provisioning", "failed", "ready"].includes(
      gitDisconnect.status?.phase || ""
    );
  const showBody =
    preparing || showGitUi || projectCompleted || disconnectActive;
  const repo = showGitUi ? selectedProjectMeta?.repoFullName || "" : "";
  const defaultBr = selectedProjectMeta?.defaultBranch || "main";
  const tlBr = selectedProjectMeta?.techLeadBranch || "tech-lead";
  const repoUrl = githubRepoUrl(repo);
  const defaultUrl = githubBranchUrl(repo, defaultBr);
  const tlUrl = githubBranchUrl(repo, tlBr);

  return (
    <section className="project-bar" aria-label="Projeto">
      <div className="project-bar__header">
        <h2 className="project-bar__title">Projeto</h2>
        {canWrite && (
          <div className="project-bar__icon-actions">
            {onNewProject && (
              <button
                type="button"
                className="project-bar__icon-btn project-bar__icon-btn--new"
                onClick={onNewProject}
                title="Novo projeto"
              >
                +
              </button>
            )}
            {selectedProject && onEditProject && (
              <button
                type="button"
                className="project-bar__icon-btn project-bar__icon-btn--edit"
                onClick={onEditProject}
                title="Editar projeto"
              >
                ✎
              </button>
            )}
            {selectedProject && onResetProject && (
              <button
                type="button"
                className="project-bar__icon-btn project-bar__icon-btn--reset"
                disabled={resetting || runningCount > 0}
                onClick={onResetProject}
                title={
                  runningCount > 0
                    ? "Aguarde o fim das tarefas em execução"
                    : "Reset projeto"
                }
              >
                ↺
              </button>
            )}
            {selectedProject && onDeleteProject && (
              <button
                type="button"
                className="project-bar__icon-btn project-bar__icon-btn--delete"
                disabled={resetting || runningCount > 0}
                onClick={onDeleteProject}
                title="Deletar projeto permanentemente"
              >
                🗑
              </button>
            )}
            {showConnectGit && (
              <button
                type="button"
                className="project-bar__icon-btn project-bar__icon-btn--git"
                onClick={onConnectGit}
                title="Conectar GitHub"
              >
                + Git
              </button>
            )}
            {canWrite && selectedProject && showGitUi && (
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
      </div>

      <label htmlFor="project-select" className="visually-hidden">
        Projeto
      </label>
      <select
        id="project-select"
        className="project-bar__select"
        value={selectedProject}
        onChange={(e) => onProjectChange(e.target.value)}
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
      </select>

      {selectedProject && showBody && (
        <div className="project-bar__body">
          {preparing && !disconnectActive && (
            <p className="project-bar__git-empty msg msg--muted">
              A preparar workspace…
            </p>
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

          {showGitUi && (
            <div className="project-bar__git">
              <div className="project-bar__git-row">
                <span className="project-bar__git-label">Repositório</span>
                {repoUrl ? (
                  <a
                    href={repoUrl}
                    className="project-bar__git-value project-bar__git-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {repo}
                  </a>
                ) : (
                  <span className="project-bar__git-value">{repo}</span>
                )}
              </div>
              <div className="project-bar__git-branches">
                <div className="project-bar__git-row">
                  <span className="project-bar__git-label">default</span>
                  {defaultUrl ? (
                    <a
                      href={defaultUrl}
                      className="project-bar__git-value project-bar__git-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {defaultBr}
                    </a>
                  ) : (
                    <span className="project-bar__git-value">{defaultBr}</span>
                  )}
                </div>
                <div className="project-bar__git-row">
                  <span className="project-bar__git-label">tech-lead</span>
                  {tlUrl ? (
                    <a
                      href={tlUrl}
                      className="project-bar__git-value project-bar__git-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {tlBr}
                    </a>
                  ) : (
                    <span className="project-bar__git-value">{tlBr}</span>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </section>
  );
}
