import React from "react";

/**
 * @param {string|{ slug: string, name?: string, defaultBranch?: string, gitStatus?: string, repoFullName?: string, techLeadBranch?: string }} p
 */
function projectSlug(p) {
  return typeof p === "string" ? p : p.slug;
}

function projectLabel(p) {
  if (typeof p === "string") return p;
  const branch = p.defaultBranch ? ` · ${p.defaultBranch}` : "";
  const git =
    p.gitStatus && p.gitStatus !== "ready"
      ? ` [${p.gitStatus}]`
      : "";
  return `${p.name || p.slug}${branch}${git}`;
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
 *   resetting?: boolean,
 *   runningCount?: number,
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
  resetting = false,
  runningCount = 0,
}) {
  const gitConnected = selectedProjectMeta && selectedProjectMeta.repoFullName;
  const repo = gitConnected ? selectedProjectMeta.repoFullName : "";
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
            {selectedProject && !gitConnected && onConnectGit && (
              <button
                type="button"
                className="project-bar__icon-btn project-bar__icon-btn--git"
                onClick={onConnectGit}
                title="Conectar repositório Git"
              >
                + Git
              </button>
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

      {selectedProject && gitConnected && (
        <p className="project-bar__git-info">
          <span className="project-bar__git-badge">Git</span>
          {repoUrl ? (
            <a
              href={repoUrl}
              className="project-bar__git-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {repo}
            </a>
          ) : (
            repo
          )}
          {" · default: "}
          {defaultUrl ? (
            <a
              href={defaultUrl}
              className="project-bar__git-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {defaultBr}
            </a>
          ) : (
            defaultBr
          )}
          {" · tech-lead: "}
          {tlUrl ? (
            <a
              href={tlUrl}
              className="project-bar__git-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {tlBr}
            </a>
          ) : (
            tlBr
          )}
          {selectedProjectMeta.gitStatus && selectedProjectMeta.gitStatus !== "ready" && (
            <span className="project-bar__git-status" title="O CLI provisiona o workspace automaticamente; Play fica disponível quando estiver ready">
              {" "}
              · Git: {selectedProjectMeta.gitStatus === "provisioning"
                ? "a provisionar…"
                : selectedProjectMeta.gitStatus}
            </span>
          )}
        </p>
      )}
    </section>
  );
}
