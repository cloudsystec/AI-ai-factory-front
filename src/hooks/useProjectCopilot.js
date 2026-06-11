import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api.js";

/**
 * @param {string} projectSlug
 * @param {{ onRefresh?: () => void|Promise<void> }} [opts]
 */
export function useProjectCopilot(projectSlug, opts = {}) {
  const [ready, setReady] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [guard, setGuard] = useState({ locked: false, lockedUntil: null, strikes: 0 });
  const [pendingActions, setPendingActions] = useState([]);
  const [confirmingId, setConfirmingId] = useState(null);

  const loadStatus = useCallback(async () => {
    if (!projectSlug) {
      setReady(false);
      setStatusLoading(false);
      return;
    }
    setStatusLoading(true);
    try {
      const res = await apiFetch(
        `/api/projects/${encodeURIComponent(projectSlug)}/copilot/status`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      setReady(data.ready === true);
      setGuard(data.guard || { locked: false, strikes: 0 });
    } catch {
      setReady(false);
    } finally {
      setStatusLoading(false);
    }
  }, [projectSlug]);

  const loadHistory = useCallback(async () => {
    if (!projectSlug) return;
    try {
      const res = await apiFetch(
        `/api/projects/${encodeURIComponent(projectSlug)}/copilot/history`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      setMessages(
        (data.messages || []).map((m) => ({
          role: m.role,
          content: m.content,
          metadata: m.metadata || {},
        }))
      );
    } catch {
      setMessages([]);
    }
  }, [projectSlug]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (open && projectSlug) {
      void loadHistory();
    }
  }, [open, projectSlug, loadHistory]);

  const sendMessage = useCallback(
    async (text) => {
      const message = String(text ?? "").trim();
      if (!message || !projectSlug || pending) return;
      setPending(true);
      setError(null);
      setPendingActions([]);
      setMessages((prev) => [...prev, { role: "user", content: message }]);
      try {
        const res = await apiFetch(
          `/api/projects/${encodeURIComponent(projectSlug)}/copilot/chat`,
          {
            method: "POST",
            body: JSON.stringify({ message }),
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (data.code === "copilot_locked" && data.lockedUntil) {
            setGuard({ locked: true, lockedUntil: data.lockedUntil, strikes: data.strikes });
          }
          throw new Error(data.error || res.statusText);
        }
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.assistantMessage || "" },
        ]);
        if (Array.isArray(data.pendingActions) && data.pendingActions.length > 0) {
          setPendingActions(data.pendingActions);
        }
        if (data.toolResults?.some((t) => t.ok)) {
          await opts.onRefresh?.();
        }
        await loadStatus();
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setPending(false);
      }
    },
    [projectSlug, pending, loadStatus, opts]
  );

  const confirmAction = useCallback(
    async (actionId, confirmOpts = {}) => {
      if (!projectSlug || !actionId || confirmingId) return;
      setConfirmingId(actionId);
      setError(null);
      try {
        const res = await apiFetch(
          `/api/projects/${encodeURIComponent(projectSlug)}/copilot/confirm`,
          {
            method: "POST",
            body: JSON.stringify({
              actionId,
              forceStop: confirmOpts.forceStop === true,
            }),
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const err = new Error(data.error || res.statusText);
          err.code = data.code;
          throw err;
        }
        setPendingActions((prev) => prev.filter((a) => a.id !== actionId));
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Feito: ${data.actionType || "ação confirmada"}.`,
          },
        ]);
        await opts.onRefresh?.();
        await loadHistory();
      } catch (e) {
        setError(e.message || String(e));
        if (e.code === "JOB_ACTIVE") {
          setPendingActions((prev) =>
            prev.map((a) =>
              a.id === actionId ? { ...a, offerForceStop: true } : a
            )
          );
        }
      } finally {
        setConfirmingId(null);
      }
    },
    [projectSlug, confirmingId, opts, loadHistory]
  );

  const dismissPending = useCallback((actionId) => {
    setPendingActions((prev) => prev.filter((a) => a.id !== actionId));
  }, []);

  return {
    ready,
    statusLoading,
    open,
    setOpen,
    messages,
    pending,
    error,
    guard,
    pendingActions,
    confirmingId,
    sendMessage,
    confirmAction,
    dismissPending,
    reloadStatus: loadStatus,
  };
}
