import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, jobEventsUrl } from "./api.js";
import { ACTIVE_JOB_STATUSES, isJobActive } from "./job-status.js";

const LOG_POLL_MS = 2500;
const STATUS_POLL_MS = 2000;
const MAX_SSE_RECONNECT = 6;

/**
 * @param {object|null} apiJob
 * @returns {object|null}
 */
function jobFromApi(apiJob) {
  if (!apiJob) return null;
  return {
    id: apiJob.id,
    kind: apiJob.kind,
    project: apiJob.project,
    macroId: apiJob.macroId,
    taskId: apiJob.taskId,
    status: apiJob.status,
    startedAt: apiJob.startedAt,
    finishedAt: apiJob.finishedAt ?? null,
    exitCode: apiJob.exitCode ?? null,
  };
}

/**
 * @param {string} selectedProject
 */
export function useJobRunner(selectedProject) {
  const [job, setJob] = useState(null);
  const [logText, setLogText] = useState("");
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);
  const [logStreamStatus, setLogStreamStatus] = useState("offline");
  const eventSourceRef = useRef(null);
  const logScrollRef = useRef(null);
  const jobStatusRef = useRef(null);
  const jobIdRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const intentionalCloseRef = useRef(false);
  const connectEventsImplRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const syncJobStatusImplRef = useRef(null);

  const setJobSync = useCallback((next) => {
    if (next) {
      jobStatusRef.current = next.status ?? null;
      jobIdRef.current = next.id ?? null;
    } else {
      jobStatusRef.current = null;
      jobIdRef.current = null;
    }
    setJob(next);
  }, []);

  const disconnectEvents = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    intentionalCloseRef.current = true;
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setLogStreamStatus("offline");
  }, []);

  const fetchJobLog = useCallback(async (jobId) => {
    if (!jobId) return;
    const logRes = await apiFetch(`/api/jobs/${jobId}/log`);
    if (logRes.ok) {
      const text = await logRes.text();
      setLogText(text);
    }
  }, []);

  const fetchJobDetail = useCallback(async (jobId) => {
    const res = await apiFetch(`/api/jobs/${jobId}`);
    if (!res.ok) return null;
    const data = await res.json().catch(() => ({}));
    return data.job ?? null;
  }, []);

  const syncJobStatusFromApi = useCallback(
    async (apiJob) => {
      if (!apiJob?.id) return;
      if (jobIdRef.current && jobIdRef.current !== apiJob.id) return;

      const prevStatus = jobStatusRef.current;
      const nextStatus = apiJob.status;
      const wasActive = isJobActive(prevStatus);
      const isActive = isJobActive(nextStatus);

      setJob((prev) => {
        if (!prev || prev.id !== apiJob.id) {
          return jobFromApi(apiJob) ?? prev;
        }
        return {
          ...prev,
          status: apiJob.status,
          ...(apiJob.finishedAt !== undefined
            ? { finishedAt: apiJob.finishedAt }
            : {}),
          ...(apiJob.exitCode !== undefined
            ? { exitCode: apiJob.exitCode }
            : {}),
          ...(apiJob.kind !== undefined ? { kind: apiJob.kind } : {}),
        };
      });
      jobStatusRef.current = nextStatus;
      jobIdRef.current = apiJob.id;

      if (wasActive && !isActive) {
        intentionalCloseRef.current = true;
        disconnectEvents();
        await fetchJobLog(apiJob.id);
      } else if (!wasActive && isActive && !eventSourceRef.current) {
        reconnectAttemptRef.current = 0;
        connectEventsImplRef.current?.(apiJob.id);
      }
    },
    [disconnectEvents, fetchJobLog]
  );

  syncJobStatusImplRef.current = syncJobStatusFromApi;

  const connectEvents = useCallback(
    (jobId) => {
      if (!jobId) return;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      intentionalCloseRef.current = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      const es = new EventSource(jobEventsUrl(jobId));
      eventSourceRef.current = es;

      es.onopen = () => {
        setLogStreamStatus("connected");
        reconnectAttemptRef.current = 0;
      };

      es.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          if (payload.type === "reset") {
            setLogText("");
          } else if (payload.type === "snapshot") {
            setLogText(payload.text ?? "");
          } else if (payload.type === "line" && payload.text) {
            setLogText((prev) => {
              const next = prev ? `${prev}\n${payload.text}` : payload.text;
              return next;
            });
          } else if (payload.type === "status" && payload.status) {
            jobStatusRef.current = payload.status;
            setJob((prev) =>
              prev ? { ...prev, status: payload.status } : prev
            );
            if (!isJobActive(payload.status)) {
              intentionalCloseRef.current = true;
              es.close();
              eventSourceRef.current = null;
              setLogStreamStatus("offline");
              fetchJobDetail(jobId)
                .then((fresh) => syncJobStatusImplRef.current?.(fresh))
                .catch(() => {});
              fetchJobLog(jobId).catch(() => {});
            }
          } else if (payload.type === "exit") {
            intentionalCloseRef.current = true;
            es.close();
            eventSourceRef.current = null;
            setLogStreamStatus("offline");
            fetchJobDetail(jobId)
              .then((fresh) => {
                if (fresh) return syncJobStatusImplRef.current?.(fresh);
                if (payload.code === 0) {
                  jobStatusRef.current = "succeeded";
                  setJob((prev) =>
                    prev && prev.status !== "cancelled"
                      ? { ...prev, status: "succeeded", exitCode: payload.code }
                      : prev
                  );
                } else {
                  jobStatusRef.current = "failed";
                  setJob((prev) =>
                    prev && prev.status !== "cancelled"
                      ? { ...prev, status: "failed", exitCode: payload.code }
                      : prev
                  );
                }
              })
              .catch(() => {});
            fetchJobLog(jobId).catch(() => {});
          }
        } catch {
          /* ignore malformed */
        }
      };

      es.onerror = () => {
        if (intentionalCloseRef.current) {
          intentionalCloseRef.current = false;
          eventSourceRef.current = null;
          setLogStreamStatus("offline");
          return;
        }

        es.close();
        eventSourceRef.current = null;

        const st = jobStatusRef.current;
        const currentId = jobIdRef.current;
        if (
          !st ||
          !ACTIVE_JOB_STATUSES.has(st) ||
          currentId !== jobId ||
          reconnectAttemptRef.current >= MAX_SSE_RECONNECT
        ) {
          setLogStreamStatus("offline");
          if (currentId === jobId) {
            fetchJobLog(jobId).catch(() => {});
            fetchJobDetail(jobId)
              .then((fresh) => syncJobStatusImplRef.current?.(fresh))
              .catch(() => {});
          }
          return;
        }

        setLogStreamStatus("reconnecting");
        const delay = Math.min(5000, 800 * (reconnectAttemptRef.current + 1));
        reconnectAttemptRef.current += 1;
        reconnectTimerRef.current = window.setTimeout(() => {
          reconnectTimerRef.current = null;
          if (
            jobIdRef.current === jobId &&
            jobStatusRef.current &&
            ACTIVE_JOB_STATUSES.has(jobStatusRef.current)
          ) {
            connectEventsImplRef.current?.(jobId);
          }
        }, delay);
      };
    },
    [fetchJobLog, fetchJobDetail]
  );

  connectEventsImplRef.current = connectEvents;

  const applyJobFromApi = useCallback(
    async (apiJob) => {
      if (!apiJob) {
        setJobSync(null);
        setLogText("");
        return;
      }
      setJobSync(jobFromApi(apiJob));
      await fetchJobLog(apiJob.id);
      if (isJobActive(apiJob.status)) {
        connectEvents(apiJob.id);
      } else {
        disconnectEvents();
      }
    },
    [setJobSync, fetchJobLog, connectEvents, disconnectEvents]
  );

  const refreshRunner = useCallback(async () => {
    if (!selectedProject) return;
    try {
      const res = await apiFetch(
        `/api/jobs/latest?project=${encodeURIComponent(selectedProject)}`
      );
      if (!res.ok) return;
      const data = await res.json();
      await applyJobFromApi(data.job);
    } catch {
      /* ignore */
    }
  }, [selectedProject, applyJobFromApi]);

  useEffect(() => {
    disconnectEvents();
    setJobSync(null);
    setLogText("");
    setError(null);
    if (selectedProject) {
      refreshRunner();
    }
    return () => disconnectEvents();
  }, [selectedProject, disconnectEvents, refreshRunner, setJobSync]);

  useEffect(() => {
    const id = job?.id;
    if (!id) return;

    let cancelled = false;
    const pollStatus = async () => {
      try {
        const fresh = await fetchJobDetail(id);
        if (cancelled || !fresh) return;
        await syncJobStatusFromApi(fresh);
      } catch {
        /* ignore */
      }
    };

    pollStatus();
    const timer = window.setInterval(pollStatus, STATUS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [job?.id, fetchJobDetail, syncJobStatusFromApi]);

  useEffect(() => {
    const id = job?.id;
    const status = job?.status;
    if (!id || !status || !isJobActive(status)) return;

    const timer = window.setInterval(() => {
      fetchJobLog(id).catch(() => {});
    }, LOG_POLL_MS);

    return () => clearInterval(timer);
  }, [job?.id, job?.status, fetchJobLog]);

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
      disconnectEvents();
      try {
        const res = await apiFetch("/api/jobs", {
          method: "POST",
          body: JSON.stringify({ project: selectedProject, ...body }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || res.statusText);
        }
        reconnectAttemptRef.current = 0;
        setJobSync({
          id: data.jobId,
          kind: data.kind,
          project: selectedProject,
          macroId: data.macroId,
          status: "queued",
        });
        setLogText("");
        connectEvents(data.jobId);
        fetchJobDetail(data.jobId)
          .then((fresh) => syncJobStatusFromApi(fresh))
          .catch(() => {});
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setStarting(false);
      }
    },
    [
      selectedProject,
      connectEvents,
      disconnectEvents,
      setJobSync,
      fetchJobDetail,
      syncJobStatusFromApi,
    ]
  );

  const cancelJob = useCallback(async () => {
    if (!job?.id) return;
    setError(null);
    try {
      const res = await apiFetch(`/api/jobs/${job.id}/cancel`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && data.job) {
        await syncJobStatusFromApi(data.job);
        return;
      }
      if (!res.ok) throw new Error(data.error || res.statusText);
      jobStatusRef.current = "cancelled";
      setJob((prev) =>
        prev ? { ...prev, status: data.status || "cancelled" } : prev
      );
      disconnectEvents();
      await fetchJobLog(job.id);
    } catch (e) {
      const fresh = await fetchJobDetail(job.id).catch(() => null);
      if (fresh) {
        await syncJobStatusFromApi(fresh);
        if (!isJobActive(fresh.status)) return;
      }
      setError(e.message || String(e));
    }
  }, [
    job?.id,
    disconnectEvents,
    fetchJobLog,
    syncJobStatusFromApi,
    fetchJobDetail,
  ]);

  const isBusy = isJobActive(job?.status);

  return {
    job,
    logText,
    error,
    starting,
    isBusy,
    logStreamStatus,
    logScrollRef,
    startJob,
    sendInput: async () => {},
    cancelJob,
  };
};
