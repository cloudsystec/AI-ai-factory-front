import React from "react";

/**
 * @param {{
 *   projects: string[],
 *   selectedProject: string,
 *   onProjectChange: (slug: string) => void,
 *   canWrite?: boolean,
 *   onNewProject?: () => void,
 *   onResetProject?: () => void,
 *   resetting?: boolean,
 *   runningCount?: number,
 * }} props
 */
export default function ProjectBar({
  projects,
  selectedProject,
  onProjectChange,
  canWrite = false,
  onNewProject,
  onResetProject,
  resetting = false,
  runningCount = 0,
}) {
  return (
    <section className="project-bar" aria-label="Projeto">
      <h2 className="project-bar__title">Projeto</h2>
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
        {projects.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <div className="project-bar__actions">
        {canWrite && onNewProject && (
          <button
            type="button"
            className="toolbar-btn toolbar-btn--primary"
            onClick={onNewProject}
          >
            Novo projeto
          </button>
        )}
        {canWrite && selectedProject && onResetProject && (
          <button
            type="button"
            className="toolbar-btn toolbar-btn--danger"
            disabled={resetting || runningCount > 0}
            title={
              runningCount > 0
                ? "Aguarde o fim das tarefas em execução ou interrompa o job"
                : "Backup ZIP + apagar workspace; restaurar escopo macro da BD"
            }
            onClick={onResetProject}
          >
            {resetting ? "A repor…" : "Reset projeto"}
          </button>
        )}
      </div>
    </section>
  );
}
