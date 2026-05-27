import React, { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "./api.js";

/**
 * @param {{
 *   projectSlug: string,
 *   onClose: () => void,
 *   onConnected: () => void,
 * }} props
 */
export default function ConnectGitModal({ projectSlug, onClose, onConnected }) {
  const [installationId, setInstallationId] = useState(null);
  const [accountLogin, setAccountLogin] = useState(null);
  const [checking, setChecking] = useState(true);
  const [gitMode, setGitMode] = useState("existing");
  const [repos, setRepos] = useState([]);
  const [repoFullName, setRepoFullName] = useState("");
  const [newRepoName, setNewRepoName] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [techLeadBranch, setTechLeadBranch] = useState("tech-lead");
  const [branches, setBranches] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  const checkGitHubStatus = useCallback(async () => {
    try {
      const res = await apiFetch("/api/github/status");
      if (!res.ok) return false;
      const data = await res.json();
      if (data.connected && data.installationId) {
        setInstallationId(data.installationId);
        setAccountLogin(data.accountLogin || null);
        return true;
      }
    } catch {}
    return false;
  }, []);

  useEffect(() => {
    (async () => {
      const ok = await checkGitHubStatus();
      setChecking(false);
      if (!ok) return;
    })();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [checkGitHubStatus]);

  useEffect(() => {
    if (!installationId) return;
    apiFetch(`/api/github/repos?installationId=${installationId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => setRepos(Array.isArray(list) ? list : []))
      .catch(() => setRepos([]));
  }, [installationId]);

  useEffect(() => {
    if (!repoFullName || gitMode !== "existing" || !installationId) return;
    const [owner, repo] = repoFullName.split("/");
    if (!owner || !repo) return;
    apiFetch(`/api/github/repos/${owner}/${repo}/branches?installationId=${installationId}`)
      .then((r) => (r.ok ? r.json() : { branches: [], defaultBranch: "main" }))
      .then((data) => {
        const list = Array.isArray(data) ? data : data.branches || [];
        setBranches(list);
        const repoDef = Array.isArray(data) ? "main" : data.defaultBranch || "main";
        if (list.includes(repoDef)) setDefaultBranch(repoDef);
      })
      .catch(() => setBranches([]));
  }, [repoFullName, gitMode, installationId]);

  async function handleInstallGitHub() {
    setError(null);
    try {
      const res = await apiFetch("/api/github/install");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      if (!data.url) throw new Error("Sem URL de instalação");
      const popup = window.open(data.url, "github-install", "width=800,height=700,noopener");
      pollRef.current = setInterval(async () => {
        const ok = await checkGitHubStatus();
        if (ok) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          if (popup && !popup.closed) popup.close();
        }
      }, 3000);
      setTimeout(() => {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }, 5 * 60 * 1000);
    } catch (e) {
      setError(e.message || String(e));
    }
  }

  async function handleConnect(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const body = {
        installationId,
        mode: gitMode,
        repoFullName: gitMode === "existing" ? repoFullName : undefined,
        newRepoName: gitMode === "new" ? newRepoName.trim() : undefined,
        defaultBranch: defaultBranch.trim() || "main",
        techLeadBranch: techLeadBranch.trim() || "tech-lead",
        isPrivate: true,
      };
      const res = await apiFetch(`/api/projects/${encodeURIComponent(projectSlug)}/connect-git`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || res.statusText);
      await new Promise((r) => setTimeout(r, 3000));
      await onConnected();
      onClose();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setSubmitting(false);
    }
  }

  const repoValid = gitMode === "existing" ? !!repoFullName : !!newRepoName.trim();
  const canSubmit = installationId && repoValid && !submitting;

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (!submitting && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-panel modal-panel--form"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-panel__header">
          <div>
            <h2 className="modal-panel__title">Conectar Git</h2>
            <p className="modal-panel__eyebrow">Projeto: {projectSlug}</p>
          </div>
          <button type="button" className="modal-panel__close" onClick={onClose} disabled={submitting}>
            Fechar
          </button>
        </header>

        <form className="modal-panel__body new-project-form" onSubmit={handleConnect}>
          {error && <p className="msg msg--error">{error}</p>}

          {checking && <p className="msg msg--muted">A verificar GitHub...</p>}

          {!checking && !installationId && (
            <div className="form-field">
              <p className="msg msg--warn">
                GitHub App não instalada. Instale para poder conectar um repositório.
              </p>
              <button type="button" className="toolbar-btn toolbar-btn--primary" onClick={handleInstallGitHub}>
                Instalar GitHub App
              </button>
            </div>
          )}

          {!checking && installationId && (
            <>
              <p className="msg msg--ok">
                GitHub conectado{accountLogin ? ` (${accountLogin})` : ""}.
              </p>

              <fieldset className="form-field">
                <legend className="form-field__label">Repositório</legend>
                <label>
                  <input
                    type="radio"
                    checked={gitMode === "existing"}
                    onChange={() => setGitMode("existing")}
                  />{" "}
                  Existente
                </label>{" "}
                <label>
                  <input
                    type="radio"
                    checked={gitMode === "new"}
                    onChange={() => setGitMode("new")}
                  />{" "}
                  Criar novo
                </label>
              </fieldset>

              {gitMode === "existing" ? (
                <label className="form-field">
                  <span className="form-field__label">Repo</span>
                  <select
                    className="form-field__input"
                    value={repoFullName}
                    onChange={(e) => setRepoFullName(e.target.value)}
                    required
                  >
                    <option value="">Selecione…</option>
                    {repos.map((r) => (
                      <option key={r.fullName} value={r.fullName}>
                        {r.fullName}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className="form-field">
                  <span className="form-field__label">Nome do novo repo</span>
                  <input
                    className="form-field__input"
                    value={newRepoName}
                    onChange={(e) => setNewRepoName(e.target.value)}
                    required
                    placeholder="meu-projeto"
                  />
                </label>
              )}

              <label className="form-field">
                <span className="form-field__label">Branch default</span>
                <input
                  className="form-field__input"
                  value={defaultBranch}
                  onChange={(e) => setDefaultBranch(e.target.value)}
                  placeholder="main"
                  list="branch-suggestions"
                />
                <datalist id="branch-suggestions">
                  {branches.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
                <span className="form-field__hint">
                  Se a branch não existir, será criada automaticamente.
                </span>
              </label>

              <label className="form-field">
                <span className="form-field__label">Branch tech-lead</span>
                <input
                  className="form-field__input"
                  value={techLeadBranch}
                  onChange={(e) => setTechLeadBranch(e.target.value)}
                  placeholder="tech-lead"
                  list="branch-suggestions"
                />
                <span className="form-field__hint">
                  PRs das tasks vão para esta branch. Se não existir, será criada.
                </span>
              </label>

              <div className="new-project-form__actions">
                <button type="button" className="toolbar-btn" onClick={onClose}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="toolbar-btn toolbar-btn--primary"
                  disabled={!canSubmit}
                >
                  {submitting ? "A conectar…" : "Conectar"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
