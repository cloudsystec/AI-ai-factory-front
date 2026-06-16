import React, { useEffect, useState } from "react";
import { apiFetch } from "./api.js";
import AppModal from "./components/AppModal.jsx";
import ProjectDiscoveryChat from "./components/ProjectDiscoveryChat.jsx";
import ProjectDiscoveryDecisions from "./components/ProjectDiscoveryDecisions.jsx";
import ScopePreviewModal from "./ScopePreviewModal.jsx";
import { useProjectDiscovery } from "./hooks/useProjectDiscovery.js";
import { TUTORIAL_DEMO_INPUT } from "./tutorial/mockProjectDiscoveryResponses.js";

/**
 * @param {{
 *   onClose: () => void,
 *   onCreated: (slug: string) => void,
 *   resumeSessionId?: string | null,
 *   onDraftCreated?: (slug: string) => void,
 *   tutorialMode?: boolean,
 *   onTutorialSubmit?: () => void,
 *   onMacroHelpInteraction?: () => void,
 *   onTutorialDrawerOpen?: () => void,
 *   submitTutorialTarget?: string,
 *   discoveryInputTutorialTarget?: string,
 *   discoverySendTutorialTarget?: string,
 *   tutorialAutoTypeSignal?: number,
 *   onTutorialAutoTypeComplete?: () => void,
 * }} props
 */
export default function NewProjectModal({
  onClose,
  onCreated,
  resumeSessionId = null,
  onDraftCreated,
  tutorialMode = false,
  onTutorialSubmit,
  onMacroHelpInteraction,
  submitTutorialTarget,
  discoveryInputTutorialTarget,
  discoverySendTutorialTarget,
  tutorialAutoTypeSignal = 0,
  onTutorialAutoTypeComplete,
}) {
  const [ready, setReady] = useState(tutorialMode);
  const [readinessHint, setReadinessHint] = useState(null);
  const [statusLoading, setStatusLoading] = useState(!tutorialMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const discovery = useProjectDiscovery({
    tutorialMode,
    onTutorialMessageSent: onMacroHelpInteraction,
    resumeSessionId,
    onDraftCreated,
  });

  useEffect(() => {
    if (tutorialMode) return undefined;
    let cancelled = false;
    async function loadStatus() {
      setStatusLoading(true);
      try {
        const res = await apiFetch("/api/project-discovery/status");
        const data = await res.json().catch(() => ({}));
        if (!cancelled) {
          setReady(Boolean(data.ready));
          setReadinessHint(data.readinessHint || null);
        }
      } catch {
        if (!cancelled) {
          setReady(false);
          setReadinessHint(null);
        }
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    }
    loadStatus();
    return () => {
      cancelled = true;
    };
  }, [tutorialMode]);

  async function handleClose() {
    if (!tutorialMode && !discovery.hasDraftProject) {
      await discovery.cancelSession();
    }
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!discovery.readyToCreate) return;

    setError(null);
    setSubmitting(true);
    try {
      if (tutorialMode) {
        onTutorialSubmit?.();
        onClose();
        return;
      }

      const response = await apiFetch("/api/projects", {
        method: "POST",
        body: JSON.stringify({
          discoverySessionId: discovery.sessionId,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || response.statusText);
      onCreated(body.project || discovery.proposedSlug);
      onClose();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit =
    ready &&
    !statusLoading &&
    !discovery.loading &&
    discovery.readyToCreate &&
    (tutorialMode || Boolean(discovery.sessionId));

  const chatDisabled = !ready || statusLoading || discovery.loading;

  return (
    <>
      <AppModal
        variant="form"
        panelClassName="modal-panel--form modal-panel--discovery"
        eyebrow="Projeto"
        title="Criar projeto"
        titleId="new-project-title"
        onClose={handleClose}
        closeDisabled={submitting || tutorialMode}
        disableOverlayClose={submitting || tutorialMode}
        closeOnEscape={!previewOpen && !tutorialMode}
        closeOnOverlayClick={!tutorialMode}
        panelDataTutorial={tutorialMode ? "new-project" : undefined}
      >
        <div className="modal-panel__body project-discovery-layout">
          {statusLoading ? (
            <p className="msg msg--muted">A verificar configuração…</p>
          ) : !ready ? (
            <p className="msg msg--error">
              {readinessHint ||
                "Plataforma IA indisponível. Contate o administrador da plataforma."}
            </p>
          ) : null}

          {tutorialMode && (
            <p className="msg msg--muted">
              Exemplo ilustrativo — responda no chat como numa sessão PO/SM real.
            </p>
          )}

          {error && <p className="msg msg--error">{error}</p>}
          {discovery.error && !error && (
            <p className="msg msg--error">{discovery.error}</p>
          )}

          <div className="project-discovery-layout__grid">
            <aside className="project-discovery-sidebar">
              <ProjectDiscoveryDecisions
                decisions={discovery.decisions}
                progress={discovery.progress}
                topicLabels={discovery.topicLabels}
                openTopics={discovery.openTopics}
                readyToCreate={discovery.readyToCreate}
                proposedName={discovery.proposedName}
                proposedSlug={discovery.proposedSlug}
              />

              <form
                className="project-discovery-sidebar__footer"
                onSubmit={handleSubmit}
              >
                {discovery.readyToCreate && discovery.scopeMd && (
                  <button
                    type="button"
                    className="toolbar-btn toolbar-btn--link project-discovery-sidebar__preview"
                    onClick={() => setPreviewOpen(true)}
                  >
                    Ver escopo macro
                  </button>
                )}
                <div className="project-discovery-sidebar__actions">
                  {!tutorialMode && (
                    <button
                      type="button"
                      className="toolbar-btn"
                      onClick={handleClose}
                      disabled={submitting}
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    className="toolbar-btn toolbar-btn--primary"
                    disabled={submitting || !canSubmit}
                    data-tutorial={submitTutorialTarget || undefined}
                    title={
                      !discovery.readyToCreate
                        ? "Conclua o brainstorm no chat antes de criar"
                        : undefined
                    }
                  >
                    {submitting ? "Criando…" : "Criar projeto"}
                  </button>
                </div>
              </form>
            </aside>

            <ProjectDiscoveryChat
              messages={discovery.messages}
              pending={discovery.pending}
              error={null}
              onSend={discovery.sendMessage}
              disabled={chatDisabled}
              tutorialInputTarget={discoveryInputTutorialTarget}
              tutorialSendTarget={discoverySendTutorialTarget}
              tutorialAutoTypeSignal={tutorialAutoTypeSignal}
              onTutorialAutoTypeComplete={onTutorialAutoTypeComplete}
              demoInput={TUTORIAL_DEMO_INPUT}
            />
          </div>
        </div>
      </AppModal>

      <ScopePreviewModal
        open={previewOpen}
        content={discovery.scopeMd || ""}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
