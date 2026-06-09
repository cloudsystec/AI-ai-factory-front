import { useCallback, useEffect, useState } from "react";
import {
  fetchGitDisconnectStatus,
  isGitDisconnectBusy,
  startGitDisconnect,
} from "../lib/gitDisconnect.js";

/**
 * @param {string|null|undefined} projectSlug
 * @param {() => void | Promise<void>} [onRefreshProjects]
 */
export function useGitDisconnect(projectSlug, onRefreshProjects) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadStatus = useCallback(async () => {
    if (!projectSlug) {
      setStatus(null);
      return null;
    }
    try {
      const data = await fetchGitDisconnectStatus(projectSlug);
      setStatus(data);
      return data;
    } catch {
      return null;
    }
  }, [projectSlug]);

  useEffect(() => {
    setError(null);
    loadStatus();
  }, [loadStatus]);

  const busy = loading || isGitDisconnectBusy(status);

  useEffect(() => {
    if (!busy || !projectSlug) return undefined;
    const id = window.setInterval(async () => {
      const data = await loadStatus();
      if (data?.phase === "ready" || data?.phase === "failed") {
        await onRefreshProjects?.();
      }
    }, 4000);
    return () => window.clearInterval(id);
  }, [busy, loadStatus, projectSlug, onRefreshProjects]);

  const handleDisconnect = useCallback(async () => {
    if (!projectSlug) return;
    const ok = window.confirm(
      "Desconectar o GitHub deste projeto?\n\n" +
        "• Volta a usar o repositório privado da plataforma (modo default)\n" +
        "• O workspace será reprovisionado\n" +
        "• A execução automática será pausada\n\n" +
        "O repositório do cliente deixa de ser usado neste projeto."
    );
    if (!ok) return;
    setError(null);
    setLoading(true);
    try {
      await startGitDisconnect(projectSlug);
      await loadStatus();
      await onRefreshProjects?.();
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [projectSlug, loadStatus, onRefreshProjects]);

  return {
    status,
    error,
    loading,
    busy,
    handleDisconnect,
    loadStatus,
  };
}
