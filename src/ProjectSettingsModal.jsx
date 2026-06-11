import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLinkSlash,
  faRotateLeft,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { apiFetch } from "./api.js";
import AppModal from "./components/AppModal.jsx";
import GitDisconnectPanel from "./components/GitDisconnectPanel.jsx";
import { useGitDisconnect } from "./hooks/useGitDisconnect.js";
import {
  canDisconnectClientGit,
  canOfferAddClientGit,
  isClientGitConnected,
  isWorkspacePreparing,
} from "./lib/projectGit.js";

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
 *   projectSlug: string,
 *   projectMeta?: object|null,
 *   canWrite?: boolean,
 *   runningCount?: number,
 *   resetting?: boolean,
 *   onClose: () => void,
 *   onSaved: () => void | Promise<void>,
 *   onResetProject?: () => void | Promise<void>,
 *   onDeleteProject?: () => void | Promise<void>,
 *   onConnectGit?: () => void,
 *   onRefreshProjects?: () => void | Promise<void>,
 * }} props
 */
export default function ProjectSettingsModal({
  projectSlug,
  projectMeta = null,
  canWrite = false,
  runningCount = 0,
  resetting = false,
  onClose,
  onSaved,
  onResetProject,
  onDeleteProject,
  onConnectGit,
  onRefreshProjects,
}) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const gitDisconnect = useGitDisconnect(projectSlug, onRefreshProjects);
  const showGitUi = isClientGitConnected(projectMeta);
  const preparing = isWorkspacePreparing(projectMeta);
  const canAddGit = canWrite && onConnectGit && canOfferAddClientGit(projectMeta);
  const canRemoveGit =
    canWrite && showGitUi && canDisconnectClientGit(projectMeta);
  const disconnectActive =
    gitDisconnect.busy ||
    gitDisconnect.loading ||
    ["provisioning", "failed", "ready"].includes(
      gitDisconnect.status?.phase || ""
    );
  const actionsBlocked = resetting;
  const deleteBlocked = resetting || runningCount > 0;
  const gitBusy = gitDisconnect.busy || gitDisconnect.loading;

  const repo = showGitUi ? projectMeta?.repoFullName || "" : "";
  const defaultBr = projectMeta?.defaultBranch || "main";
  const tlBr = projectMeta?.techLeadBranch || "tech-lead";
  const repoUrl = githubRepoUrl(repo);
  const defaultUrl = githubBranchUrl(repo, defaultBr);
  const tlUrl = githubBranchUrl(repo, tlBr);
  const managedPlatform =
    !showGitUi && String(projectMeta?.repoMode || "") === "managed";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`/api/projects/${encodeURIComponent(projectSlug)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || res.statusText);
        if (!cancelled) setName(data.name || projectSlug);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectSlug]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/projects/${encodeURIComponent(projectSlug)}`, {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim() }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || res.statusText);
      await onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal
      variant="form"
      panelClassName="modal-panel--form project-settings-modal"
      eyebrow="Projeto"
      title="Editar projeto"
      titleId="project-settings-title"
      subtitle={projectSlug}
      onClose={onClose}
      closeDisabled={saving}
      disableOverlayClose={saving}
    >
      <form className="modal-panel__body project-settings-modal__body" onSubmit={handleSave}>
        {error && <p className="msg msg--error">{error}</p>}

        <section className="project-settings-modal__section">
          <h3 className="project-settings-modal__section-title">Identificação</h3>
          {loading ? (
            <p className="msg msg--muted">Carregando…</p>
          ) : (
            <label className="form-field">
              <span className="form-field__label">Nome</span>
              <input
                className="form-field__input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canWrite || saving}
              />
            </label>
          )}
        </section>

        {canWrite && (
          <section className="project-settings-modal__section">
            <h3 className="project-settings-modal__section-title">Repositório Git</h3>

            {preparing && !disconnectActive && (
              <p className="msg msg--muted">
                Workspace em preparação — aguarde para adicionar ou remover Git.
              </p>
            )}

            {disconnectActive && (
              <GitDisconnectPanel
                projectMeta={projectMeta}
                status={gitDisconnect.status}
                error={gitDisconnect.error}
                loading={gitDisconnect.loading}
                busy={gitDisconnect.busy}
                runningCount={runningCount}
                onDisconnect={gitDisconnect.handleDisconnect}
                showButton={false}
              />
            )}

            {showGitUi ? (
              <div className="project-settings-modal__git">
                <p className="project-settings-modal__git-status">
                  Repositório do cliente conectado
                </p>
                <div className="project-settings-modal__git-row">
                  <span className="project-settings-modal__git-label">Repositório</span>
                  {repoUrl ? (
                    <a
                      href={repoUrl}
                      className="project-settings-modal__git-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {repo}
                    </a>
                  ) : (
                    <span>{repo || "—"}</span>
                  )}
                </div>
                <div className="project-settings-modal__git-row">
                  <span className="project-settings-modal__git-label">default</span>
                  {defaultUrl ? (
                    <a
                      href={defaultUrl}
                      className="project-settings-modal__git-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {defaultBr}
                    </a>
                  ) : (
                    <span>{defaultBr}</span>
                  )}
                </div>
                <div className="project-settings-modal__git-row">
                  <span className="project-settings-modal__git-label">tech-lead</span>
                  {tlUrl ? (
                    <a
                      href={tlUrl}
                      className="project-settings-modal__git-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {tlBr}
                    </a>
                  ) : (
                    <span>{tlBr}</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="project-settings-modal__git-empty">
                {managedPlatform
                  ? "Este projeto usa o repositório privado da plataforma. Você pode conectar o seu GitHub a qualquer momento."
                  : "Nenhum repositório GitHub conectado. Adicione quando quiser."}
              </p>
            )}

            <div className="project-settings-modal__inline-actions">
              {canAddGit && (
                <button
                  type="button"
                  className="toolbar-btn toolbar-btn--primary project-settings-modal__action-btn"
                  onClick={onConnectGit}
                  disabled={actionsBlocked || preparing || disconnectActive || gitBusy}
                  title={
                    runningCount > 0
                      ? "Aguarde o fim das tarefas em execução"
                      : managedPlatform
                        ? "Migrar para o seu repositório GitHub"
                        : "Conectar repositório GitHub"
                  }
                >
                  <FontAwesomeIcon icon={faGithub} />
                  Adicionar Git
                </button>
              )}

              {showGitUi && (
                <button
                  type="button"
                  className="toolbar-btn project-settings-modal__action-btn project-settings-modal__action-btn--remove"
                  disabled={
                    actionsBlocked ||
                    !canRemoveGit ||
                    gitBusy ||
                    disconnectActive
                  }
                  onClick={() => gitDisconnect.handleDisconnect().catch(() => {})}
                  title={
                    !canRemoveGit
                      ? "Aguarde o workspace ficar pronto"
                      : runningCount > 0
                        ? "Aguarde o fim das tarefas em execução"
                        : "Remover GitHub e voltar ao repo da plataforma"
                  }
                >
                  <FontAwesomeIcon icon={faLinkSlash} />
                  {gitBusy ? "Removendo…" : "Remover Git"}
                </button>
              )}
            </div>

            {gitDisconnect.error && (
              <p className="msg msg--error">{gitDisconnect.error}</p>
            )}
          </section>
        )}

        {canWrite && (onResetProject || onDeleteProject) && (
          <section className="project-settings-modal__section project-settings-modal__section--danger">
            <h3 className="project-settings-modal__section-title">Zona de risco</h3>
            {runningCount > 0 && (
              <p className="msg msg--muted">
                Há tarefas em execução. O reset pode cancelá-las automaticamente; a
                eliminação permanente continua bloqueada até terminarem.
              </p>
            )}
            <div className="project-settings-modal__danger-actions">
              {onResetProject && (
                <button
                  type="button"
                  className="toolbar-btn project-settings-modal__action-btn"
                  disabled={actionsBlocked}
                  onClick={() => onResetProject()}
                  title={
                    runningCount > 0
                      ? "Cancela jobs activos e repõe o projecto a zero"
                      : "Reset projecto"
                  }
                >
                  <FontAwesomeIcon icon={faRotateLeft} />
                  Resetar projeto
                </button>
              )}
              {onDeleteProject && (
                <button
                  type="button"
                  className="toolbar-btn toolbar-btn--danger project-settings-modal__action-btn"
                  disabled={deleteBlocked}
                  onClick={() => onDeleteProject()}
                  title="Deletar projeto permanentemente"
                >
                  <FontAwesomeIcon icon={faTrashCan} />
                  Deletar projeto
                </button>
              )}
            </div>
          </section>
        )}

        <div className="project-settings-modal__footer">
          <button type="button" className="toolbar-btn" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          {canWrite && (
            <button
              type="submit"
              className="toolbar-btn toolbar-btn--primary"
              disabled={saving || loading}
            >
              {saving ? "Salvando…" : "Salvar"}
            </button>
          )}
        </div>
      </form>
    </AppModal>
  );
}
