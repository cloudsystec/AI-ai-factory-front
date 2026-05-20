import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, jobEventsUrl } from "./api.js";

/**
 * @param {string} selectedProject
 */
export function useJobRunner(selectedProject) {
  const [job, setJob] = useState(null);
  const [logText, setLogText] = useState("");
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);
  const eventSourceRef = useRef(null);
  const logScrollRef = useRef(null);

  const disconnectEvents = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const connectEvents = useCallback(
    (jobId) => {
      disconnectEvents();
      const es = new EventSource(jobEventsUrl(jobId));
      eventSourceRef.current = es;

      es.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          if (payload.type === "snapshot" && payload.text) {
            setLogText(payload.text);
          } else if (payload.type === "line" && payload.text) {
            setLogText((prev) => {
              const next = prev ? `${prev}\n${payload.text}` : payload.text;
              return next;
            });
          } else if (payload.type === "status") {
            setJob((prev) => (prev ? { ...prev, status: payload.status } : prev));
          } else if (payload.type === "exit") {
            setJob((prev) => {
              if (!prev) return prev;
              if (prev.status === "cancelled") return prev;
              return {
                ...prev,
                status: payload.code === 0 ? "succeeded" : "failed",
                exitCode: payload.code,
              };
            });
            es.close();
            eventSourceRef.current = null;
          }
        } catch {
          /* ignore malformed */
        }
      };

      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;
      };
    },
    [disconnectEvents]
  );

  const refreshActive = useCallback(async () => {
    try {
      const res = await apiFetch("/api/jobs/active");
      if (!res.ok) return;
      const data = await res.json();
      if (data.job) {
        setJob(data.job);
        const logRes = await apiFetch(`/api/jobs/${data.job.id}/log`);
        if (logRes.ok) {
          setLogText(await logRes.text());
        }
        if (
          data.job.status === "running" ||
          data.job.status === "waiting_input"
        ) {
          connectEvents(data.job.id);
        }
      }
    } catch {
      /* ignore */
    }
  }, [connectEvents]);

  useEffect(() => {
    disconnectEvents();
    setJob(null);
    setLogText("");
    setError(null);
    if (selectedProject) {
      refreshActive();
    }
    return () => disconnectEvents();
  }, [selectedProject, disconnectEvents, refreshActive]);

  useEffect(() => {
    const el = logScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [logText]);

  const startJob = useCallback(
    async (body) => {
      if (!selectedProject) return;
      setStarting(true);
      setError(null);
      try {
        const res = await apiFetch("/api/jobs", {
          method: "POST",
          body: JSON.stringify({ project: selectedProject, ...body }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || res.statusText);
        }
        setJob({
          id: data.jobId,
          kind: data.kind,
          project: selectedProject,
          macroId: data.macroId,
          status: "queued",
        });
        setLogText("");
        connectEvents(data.jobId);
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setStarting(false);
      }
    },
    [selectedProject, connectEvents]
  );

  const cancelJob = useCallback(async () => {
    if (!job?.id) return;
    setError(null);
    try {
      const res = await apiFetch(`/api/jobs/${job.id}/cancel`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      if (data.status) setJob((prev) => (prev ? { ...prev, status: data.status } : prev));
    } catch (e) {
      setError(e.message || String(e));
    }
  }, [job?.id]);

  const isBusy =
    job?.status === "running" ||
    job?.status === "waiting_input" ||
    job?.status === "queued";

  return {
    job,
    logText,
    error,
    starting,
    isBusy,
    logScrollRef,
    startJob,
    sendInput: async () => {},
    cancelJob,
  };
}
