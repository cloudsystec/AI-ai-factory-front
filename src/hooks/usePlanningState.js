import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api.js";

/**
 * @param {string} projectSlug
 * @param {{ bustCache?: boolean }} [opts]
 */
async function fetchPlanningState(projectSlug, opts = {}) {
  const bust = opts.bustCache ? `?_=${Date.now()}` : "";
  const res = await apiFetch(
    `/api/projects/${encodeURIComponent(projectSlug)}/planning/state${bust}`
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

/**
 * @param {object} state
 * @param {"design-preview"|"design-infra"} kind
 */
function isPlanningJobPending(state, kind) {
  if (!state?.planning) return false;
  if (kind === "design-preview") {
    return state.planning.layoutStatus === "generating";
  }
  return state.planning.infraStatus === "generating";
}

/**
 * @param {string|null|undefined} projectSlug
 */
export function usePlanningState(projectSlug) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(
    async (opts = {}) => {
      if (!projectSlug) {
        setState(null);
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPlanningState(projectSlug, opts);
        setState(data);
        return data;
      } catch (e) {
        setError(e.message || String(e));
        setState(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [projectSlug]
  );

  useEffect(() => {
    load();
  }, [load]);

  const generate = useCallback(
    async (kind) => {
      if (!projectSlug) return null;
      const res = await apiFetch(
        `/api/projects/${encodeURIComponent(projectSlug)}/planning/generate/${kind}`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);

      let latest = await load({ bustCache: true });
      const deadline = Date.now() + 15 * 60 * 1000;
      while (latest && isPlanningJobPending(latest, kind) && Date.now() < deadline) {
        await new Promise((r) => window.setTimeout(r, 2500));
        latest = await load({ bustCache: true });
      }
      return data;
    },
    [projectSlug, load]
  );

  const approve = useCallback(
    async (lane) => {
      if (!projectSlug) return null;
      const res = await apiFetch(
        `/api/projects/${encodeURIComponent(projectSlug)}/planning/approve/${lane}`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      await load({ bustCache: true });
      return data;
    },
    [projectSlug, load]
  );

  return { state, loading, error, load, generate, approve };
}

/**
 * @param {string} projectSlug
 * @param {"layout"|"infra"} lane
 */
export function usePlanningChat(projectSlug, lane) {
  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState(null);
  const [previewVersion, setPreviewVersion] = useState(0);

  const loadSession = useCallback(async () => {
    if (!projectSlug) return;
    try {
      const res = await apiFetch(
        `/api/projects/${encodeURIComponent(projectSlug)}/planning/sessions/${lane}`
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data.messages) ? data.messages : []);
      }
    } catch {
      /* ignore */
    }
  }, [projectSlug, lane]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const sendMessage = useCallback(
    async (message, attachmentIds = []) => {
      if (!projectSlug || !message.trim()) return null;
      setPending(true);
      setError(null);
      try {
        const res = await apiFetch(
          `/api/projects/${encodeURIComponent(projectSlug)}/planning/chat/${lane}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message, attachmentIds }),
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || res.statusText);
        setMessages(Array.isArray(data.messages) ? data.messages : []);

        const jobId = data.jobId;
        if (!jobId) {
          if (data.previewVersion) setPreviewVersion(data.previewVersion);
          if (data.infraVersion) setPreviewVersion(data.infraVersion);
          return data;
        }

        const deadline = Date.now() + 15 * 60 * 1000;
        let jobStatus = "queued";
        while (Date.now() < deadline) {
          await new Promise((r) => window.setTimeout(r, 2500));
          const jobRes = await apiFetch(`/api/jobs/${encodeURIComponent(jobId)}`);
          const jobData = await jobRes.json().catch(() => ({}));
          if (jobRes.ok) {
            jobStatus = jobData.status || jobStatus;
            if (
              jobStatus === "succeeded" ||
              jobStatus === "failed" ||
              jobStatus === "cancelled"
            ) {
              break;
            }
          }
        }

        await loadSession();
        const stateRes = await apiFetch(
          `/api/projects/${encodeURIComponent(projectSlug)}/planning/state?_=${Date.now()}`
        );
        if (stateRes.ok) {
          const stateData = await stateRes.json();
          const version =
            lane === "layout"
              ? stateData?.planning?.layoutVersion
              : stateData?.planning?.infraVersion;
          if (version != null) setPreviewVersion(version);
        }

        if (jobStatus === "failed" || jobStatus === "cancelled") {
          throw new Error("Não foi possível aplicar a alteração. Tente novamente.");
        }

        return { ...data, jobStatus, completed: true };
      } catch (e) {
        setError(e.message || String(e));
        return null;
      } finally {
        setPending(false);
      }
    },
    [projectSlug, lane, loadSession]
  );

  const uploadAttachment = useCallback(
    async (file) => {
      if (!projectSlug || !file) return null;
      const form = new FormData();
      form.append("file", file);
      const res = await apiFetch(
        `/api/projects/${encodeURIComponent(projectSlug)}/planning/attachments`,
        { method: "POST", body: form }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      return data;
    },
    [projectSlug]
  );

  const resetSession = useCallback(async () => {
    if (!projectSlug) return null;
    setResetting(true);
    setError(null);
    try {
      const res = await apiFetch(
        `/api/projects/${encodeURIComponent(projectSlug)}/planning/sessions/${lane}/reset`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      return data;
    } catch (e) {
      setError(e.message || String(e));
      return null;
    } finally {
      setResetting(false);
    }
  }, [projectSlug, lane]);

  return {
    messages,
    pending,
    resetting,
    error,
    previewVersion,
    sendMessage,
    uploadAttachment,
    loadSession,
    resetSession,
  };
}
