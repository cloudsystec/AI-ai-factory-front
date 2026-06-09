import React, { useEffect, useState } from "react";
import { suggestSlugFromName } from "./projectSlug.js";
import { apiFetch } from "./api.js";
import AppModal from "./components/AppModal.jsx";
import MacroHelpTrigger from "./MacroHelpTrigger.jsx";
import MacroHelpPanel from "./MacroHelpPanel.jsx";
import ScopePreviewModal from "./ScopePreviewModal.jsx";
import { TUTORIAL_PROJECT_NAME, TUTORIAL_PROJECT_SLUG } from "./tutorial/mockData.js";
import { TUTORIAL_SAMPLE_SCOPE } from "./tutorial/mockMacroHelpResponses.js";

/**
 * @param {{
 *   onClose: () => void,
 *   onCreated: (slug: string) => void,
 *   tutorialMode?: boolean,
 *   onTutorialSubmit?: () => void,
 *   onMacroHelpInteraction?: () => void,
 *   onTutorialDrawerOpen?: () => void,
 *   initialScope?: string,
 *   onScopeDraftChange?: (scope: string) => void,
 *   openMacroHelpOnMount?: boolean,
 *   submitTutorialTarget?: string,
 *   macroHelpTriggerTutorialTarget?: string,
 *   macroHelpInputTutorialTarget?: string,
 *   macroHelpSendTutorialTarget?: string,
 *   tutorialAutoTypeSignal?: number,
 *   onTutorialAutoTypeComplete?: () => void,
 * }} props
 */
export default function NewProjectModal({
  onClose,
  onCreated,
  tutorialMode = false,
  onTutorialSubmit,
  onMacroHelpInteraction,
  onTutorialDrawerOpen,
  initialScope = "",
  onScopeDraftChange,
  openMacroHelpOnMount = false,
  submitTutorialTarget,
  macroHelpTriggerTutorialTarget,
  macroHelpInputTutorialTarget,
  macroHelpSendTutorialTarget,
  tutorialAutoTypeSignal = 0,
  onTutorialAutoTypeComplete,
}) {
  const [name, setName] = useState(tutorialMode ? TUTORIAL_PROJECT_NAME : "");
  const [slug, setSlug] = useState(tutorialMode ? TUTORIAL_PROJECT_SLUG : "");
  const [scope, setScope] = useState(tutorialMode ? initialScope || "" : "");
  const [slugTouched, setSlugTouched] = useState(tutorialMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [macroHelpReady, setMacroHelpReady] = useState(tutorialMode);
  const [statusLoading, setStatusLoading] = useState(!tutorialMode);
  const [drawerOpen, setDrawerOpen] = useState(tutorialMode && openMacroHelpOnMount);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (tutorialMode) return undefined;
    let cancelled = false;
    async function loadStatus() {
      setStatusLoading(true);
      try {
        const res = await apiFetch("/api/macro-help/status");
        const data = await res.json().catch(() => ({}));
        if (!cancelled) {
          setMacroHelpReady(Boolean(data.ready));
        }
      } catch {
        if (!cancelled) setMacroHelpReady(false);
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    }
    loadStatus();
    return () => {
      cancelled = true;
    };
  }, [tutorialMode]);

  useEffect(() => {
    if (tutorialMode && openMacroHelpOnMount) {
      setDrawerOpen(true);
    }
  }, [tutorialMode, openMacroHelpOnMount]);

  function handleScopeChange(value) {
    setScope(value);
    onScopeDraftChange?.(value);
  }

  function handleNameChange(value) {
    setName(value);
    if (!slugTouched) setSlug(suggestSlugFromName(value));
  }

  function handleMacroHelpToggle() {
    setDrawerOpen((open) => {
      const next = !open;
      if (tutorialMode && next) {
        onTutorialDrawerOpen?.();
      }
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (tutorialMode) {
        const finalScope = scope.trim() || TUTORIAL_SAMPLE_SCOPE;
        handleScopeChange(finalScope);
        onTutorialSubmit?.();
        onClose();
        return;
      }
      const response = await apiFetch("/api/projects", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          scope: scope.trim(),
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || response.statusText);
      onCreated(body.project || slug.trim());
      onClose();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit =
    macroHelpReady && !statusLoading && name.trim() && scope.trim() && slug.trim();

  return (
    <>
      <AppModal
        variant="form"
        panelClassName="modal-panel--form"
        eyebrow="Projeto"
        title="Criar projeto"
        titleId="new-project-title"
        onClose={onClose}
        closeDisabled={submitting || tutorialMode}
        disableOverlayClose={submitting || tutorialMode}
        closeOnEscape={!drawerOpen && !previewOpen && !tutorialMode}
        closeOnOverlayClick={!drawerOpen && !tutorialMode}
        companionOpen={drawerOpen}
        panelDataTutorial={tutorialMode ? "new-project" : undefined}
        companion={
          drawerOpen ? (
            <MacroHelpPanel
              tutorialMode={tutorialMode}
              onClose={() => setDrawerOpen(false)}
              scopeMd={scope}
              onScopeChange={handleScopeChange}
              projectName={name}
              draftSlug={slug}
              tutorialInputTarget={macroHelpInputTutorialTarget}
              tutorialSendTarget={macroHelpSendTutorialTarget}
              tutorialAutoTypeSignal={tutorialAutoTypeSignal}
              onTutorialAutoTypeComplete={onTutorialAutoTypeComplete}
              onTutorialMessageSent={onMacroHelpInteraction}
            />
          ) : null
        }
      >
        <form className="modal-panel__body new-project-form" onSubmit={handleSubmit}>
            {statusLoading ? (
              <p className="msg msg--muted">A verificar configuração…</p>
            ) : !macroHelpReady ? (
              <p className="msg msg--error">
                Configure pelo menos um bot e a chave Admin Cursor do tenant antes de
                criar projetos. Contacte o administrador da plataforma.
              </p>
            ) : null}

            {tutorialMode && (
              <p className="msg msg--muted">
                Exemplo ilustrativo — pode experimentar à vontade.
              </p>
            )}

            {error && <p className="msg msg--error">{error}</p>}

            <label className="form-field">
              <span className="form-field__label">Nome do projeto</span>
              <input
                className="form-field__input"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                autoFocus
                disabled={!macroHelpReady || statusLoading}
              />
            </label>
            <label className="form-field">
              <span className="form-field__label">Slug</span>
              <input
                className="form-field__input form-field__input--mono"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                required
                pattern="[a-zA-Z0-9_-]+"
                disabled={!macroHelpReady || statusLoading}
              />
            </label>
            <label className="form-field">
              <div className="form-field__label-row">
                <span className="form-field__label">Escopo (markdown)</span>
                {macroHelpReady && (
                  <div className="form-field__label-actions">
                    <button
                      type="button"
                      className="toolbar-btn toolbar-btn--link"
                      onClick={() => setPreviewOpen(true)}
                      disabled={!scope.trim()}
                    >
                      Preview
                    </button>
                    <span data-tutorial={macroHelpTriggerTutorialTarget || undefined}>
                      <MacroHelpTrigger
                        onClick={handleMacroHelpToggle}
                        disabled={submitting}
                      />
                    </span>
                  </div>
                )}
              </div>
              <textarea
                className="form-field__textarea"
                value={scope}
                onChange={(e) => handleScopeChange(e.target.value)}
                required
                rows={10}
                disabled={!macroHelpReady || statusLoading}
              />
            </label>
            <div className="new-project-form__actions">
              {!tutorialMode && (
                <button type="button" className="toolbar-btn" onClick={onClose}>
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="toolbar-btn toolbar-btn--primary"
                disabled={submitting || !canSubmit}
                data-tutorial={submitTutorialTarget || undefined}
              >
                {submitting ? "Criando…" : "Criar projeto"}
              </button>
            </div>
          </form>
      </AppModal>

      <ScopePreviewModal
        open={previewOpen}
        content={scope}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
