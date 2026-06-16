import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faFolderOpen,
  faRotateLeft,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { apiFetch } from "./api.js";
import { useSession } from "./SessionContext.jsx";
import AppSubpagePanel from "./components/AppSubpagePanel.jsx";
import AgentRolePicker from "./components/AgentRolePicker.jsx";
import AgentConfigHelpPanel from "./AgentConfigHelpPanel.jsx";
import ScopePreviewModal from "./ScopePreviewModal.jsx";
import { getAgentRoleMeta } from "./lib/agentRoleMeta.js";

/**
 * @param {{
 *   projectSlug: string | null,
 *   projectName?: string | null,
 * }} props
 */
export default function AgentsPage({ projectSlug, projectName = null }) {
  const { isPlatformAdmin } = useSession();
  const [roleKey, setRoleKey] = useState("dev");
  const [canEditGlobal, setCanEditGlobal] = useState(false);
  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpReady, setHelpReady] = useState(false);
  const [helpReadinessHint, setHelpReadinessHint] = useState(null);

  const displayName =
    projectName?.trim() || projectSlug?.trim() || "";
  const canSeeGlobal = canEditGlobal || isPlatformAdmin;
  const roleMeta = getAgentRoleMeta(roleKey);
  const isDirty = content !== savedContent;
  const hiddenRoleKeys = useMemo(
    () => (canSeeGlobal ? [] : ["global"]),
    [canSeeGlobal]
  );
  const lineCount = useMemo(
    () => (content ? content.split("\n").length : 0),
    [content]
  );

  const load = useCallback(async () => {
    if (!projectSlug) return;
    const res = await apiFetch(
      `/api/projects/${encodeURIComponent(projectSlug)}/agents`
    );
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    setCanEditGlobal(Boolean(data.canEditGlobal) || isPlatformAdmin);
    const row = (data.overrides || []).find((r) => r.role_key === roleKey);
    const next = row?.content || "";
    setContent(next);
    setSavedContent(next);
  }, [projectSlug, roleKey, isPlatformAdmin]);

  useEffect(() => {
    setError(null);
    setMessage(null);
    load().catch((e) => setError(e.message));
  }, [load]);

  useEffect(() => {
    if (!canSeeGlobal && roleKey === "global") {
      setRoleKey("dev");
    }
  }, [canSeeGlobal, roleKey]);

  useEffect(() => {
    if (!projectSlug) return;
    let cancelled = false;
    async function loadHelpStatus() {
      try {
        const res = await apiFetch(
          `/api/projects/${encodeURIComponent(projectSlug)}/agents/help/status`
        );
        const data = await res.json().catch(() => ({}));
        if (!cancelled) {
          setHelpReady(Boolean(data.ready));
          setHelpReadinessHint(data.readinessHint || null);
        }
      } catch {
        if (!cancelled) {
          setHelpReady(false);
          setHelpReadinessHint(null);
        }
      }
    }
    loadHelpStatus();
    return () => {
      cancelled = true;
    };
  }, [projectSlug]);

  async function handleSave() {
    if (!projectSlug || saving) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await apiFetch(
        `/api/projects/${encodeURIComponent(projectSlug)}/agents/${roleKey}`,
        {
          method: "PUT",
          body: JSON.stringify({ content }),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || res.statusText);
      }
      setSavedContent(content);
      setMessage("Alterações guardadas.");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!window.confirm("Restaurar agentes deste projeto a partir dos templates?")) {
      return;
    }
    setError(null);
    setMessage(null);
    try {
      const res = await apiFetch(
        `/api/projects/${encodeURIComponent(projectSlug)}/agents/reset`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error(await res.text());
      setMessage("Agentes repostos aos templates.");
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  if (!projectSlug) {
    return (
      <AppSubpagePanel
        className="admin-page agents-page"
        eyebrow="Pipeline"
        title="Agentes"
        subtitle="Selecione um projeto no menu superior."
      >
        <div className="agents-page__empty">
          <p className="msg msg--muted">Nenhum projeto selecionado.</p>
        </div>
      </AppSubpagePanel>
    );
  }

  return (
    <>
      <div
        className={`agents-page-shell${helpOpen ? " agents-page-shell--with-help" : ""}`}
      >
        <AppSubpagePanel
          className="admin-page agents-page agents-page-shell__panel"
          eyebrow="Pipeline"
          title={
            <span className="agents-page__title-row">
              <span className="agents-page__project-chip">
                <FontAwesomeIcon icon={faFolderOpen} aria-hidden />
                {displayName}
              </span>
              <span className="agents-page__title-text">Agentes</span>
            </span>
          }
          subtitle={`Prompt do agente ${roleMeta.label} · personalização por projeto`}
          headerActions={
            <button
              type="button"
              className="toolbar-btn agents-page__reset-btn"
              onClick={handleReset}
              title="Restaurar todos os agentes deste projeto"
            >
              <FontAwesomeIcon icon={faRotateLeft} aria-hidden />
              Restaurar templates
            </button>
          }
        >
          <div className="agents-page__layout">
            <div className="agents-page__toolbar">
            <AgentRolePicker
              value={roleKey}
              onChange={setRoleKey}
              excludeRoleKeys={hiddenRoleKeys}
            />
            <div className="agents-page__toolbar-actions">
              <button
                type="button"
                className="agents-page__action-btn"
                onClick={() => setPreviewOpen(true)}
                disabled={!content.trim()}
              >
                <FontAwesomeIcon icon={faEye} aria-hidden />
                Preview
              </button>
              <button
                type="button"
                className={`agents-page__help-btn${helpOpen ? " agents-page__help-btn--active" : ""}`}
                onClick={() => setHelpOpen((open) => !open)}
                disabled={!helpReady}
                title={
                  helpReady
                    ? undefined
                    : helpReadinessHint ||
                      "Ajuda IA indisponível — verifique bot e plataforma IA"
                }
              >
                <FontAwesomeIcon icon={faWandMagicSparkles} aria-hidden />
                Preciso de ajuda com a configuração
              </button>
            </div>
          </div>

          {(error || message) && (
            <div className="agents-page__alerts" role="status">
              {error && <p className="msg msg--error">{error}</p>}
              {message && <p className="msg msg--ok">{message}</p>}
            </div>
          )}

          <div className="agents-page__editor-shell">
            <div className="agents-page__editor-head">
              <span className="agents-page__editor-label">
                Prompt markdown · {roleMeta.label}
              </span>
              {isDirty ? (
                <span className="agents-page__dirty-badge">Alterações por guardar</span>
              ) : (
                <span className="agents-page__saved-badge">Sincronizado</span>
              )}
            </div>
            <textarea
              className="agents-page__editor custom-scrollbar"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              spellCheck={false}
              placeholder={`Instruções para o agente ${roleMeta.label}…`}
            />
          </div>

          <footer className="agents-page__footer">
            <div className="agents-page__footer-meta">
              <span>{lineCount} linhas</span>
              <span className="agents-page__footer-dot" aria-hidden />
              <span>{content.length.toLocaleString("pt-PT")} caracteres</span>
            </div>
            <button
              type="button"
              className="toolbar-btn toolbar-btn--primary agents-page__save-btn"
              onClick={handleSave}
              disabled={saving || !isDirty}
            >
              {saving ? "A guardar…" : "Salvar alterações"}
            </button>
          </footer>
          </div>
        </AppSubpagePanel>

        {helpOpen && (
          <AgentConfigHelpPanel
            onClose={() => setHelpOpen(false)}
            projectSlug={projectSlug}
            projectName={displayName}
            roleKey={roleKey}
            content={content}
            onContentChange={setContent}
          />
        )}
      </div>

      <ScopePreviewModal
        open={previewOpen}
        content={content}
        eyebrow="Preview"
        title={`Prompt — ${roleMeta.label}`}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
