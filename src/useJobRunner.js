import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "./api.js";
import { isJobActive } from "./job-status.js";
import { useSocket } from "./useSocket.jsx";

const FALLBACK_STATUS_POLL_MS = 30_000;

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
    workerSlot: apiJob.workerSlot ?? null,
  };
}

/**
 * @param {string} selectedProject
 * @param {{ onDashboardRefresh?: () => void | Promise<void> }} [options]
 */
export function useJobRunner(selectedProject, options = {}) {
  const { subscribe, connected } = useSocket();
  const onDashboardRefreshRef = useRef(options.onDashboardRefresh);
  onDashboardRefreshRef.current = options.onDashboardRefresh;

  const triggerDashboardRefresh = useCallback(() => {
    const fn = onDashboardRefreshRef.current;
    if (fn) void Promise.resolve(fn()).catch(() => {});
  }, []);

  const [job, setJob] = useState(null);
  const [logText, setLogText] = useState("");
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);
  const logScrollRef = useRef(null);
  const jobIdRef = useRef(null);
  const jobStatusRef = useRef(null);

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

  const fetchJobLog = useCallback(async (jobId) => {
    if (!jobId) return;
    const logRes = await apiFetch(`/api/jobs/${jobId}/log`);
    if (logRes.ok) {
      setLogText(await logRes.text());
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

      setJob((prev) => {
        if (!prev || prev.id !== apiJob.id) return jobFromApi(apiJob) ?? prev;
        return {
          ...prev,
          status: apiJob.status,
          ...(apiJob.finishedAt !== undefined ? { finishedAt: apiJob.finishedAt } : {}),
          ...(apiJob.exitCode !== undefined ? { exitCode: apiJob.exitCode } : {}),
          ...(apiJob.kind !== undefined ? { kind: apiJob.kind } : {}),
        };
      });
      jobStatusRef.current = nextStatus;
      jobIdRef.current = apiJob.id;

      if (isJobActive(prevStatus) && !isJobActive(nextStatus)) {
        await fetchJobLog(apiJob.id);
        triggerDashboardRefresh();
      } else if (prevStatus !== nextStatus) {
        triggerDashboardRefresh();
      }
    },
    [fetchJobLog, triggerDashboardRefresh]
  );

  // --- WebSocket event handlers ---
  useEffect(() => {
    const unsubs = [
      subscribe("job:log", (ev) => {
        if (ev.jobId !== jobIdRef.current) return;
        if (ev.text) {
          setLogText((prev) => (prev ? `${prev}\n${ev.text}` : ev.text));
        }
      }),
      subscribe("job:reset", (ev) => {
        if (ev.jobId !== jobIdRef.current) return;
        setLogText("");
      }),
      subscribe("job:status", (ev) => {
        if (ev.jobId !== jobIdRef.current) return;
        const nextStatus = ev.status;
        jobStatusRef.current = nextStatus;
        setJob((prev) => {
          if (!prev || prev.id !== ev.jobId) return prev;
          return {
            ...prev,
            status: nextStatus,
            ...(ev.exitCode !== undefined ? { exitCode: ev.exitCode } : {}),
            ...(ev.kind !== undefined ? { kind: ev.kind } : {}),
          };
        });
        if (!isJobActive(nextStatus)) {
          fetchJobLog(ev.jobId).catch(() => {});
          triggerDashboardRefresh();
        } else {
          triggerDashboardRefresh();
        }
      }),
      subscribe("job:exit", (ev) => {
        if (ev.jobId !== jobIdRef.current) return;
        const status = ev.code === 0 ? "succeeded" : "failed";
        jobStatusRef.current = status;
        setJob((prev) => {
          if (!prev || prev.id !== ev.jobId) return prev;
          if (prev.status === "cancelled") return prev;
          return { ...prev, status, exitCode: ev.code ?? null };
        });
        fetchJobLog(ev.jobId).catch(() => {});
        fetchJobDetail(ev.jobId)
          .then((fresh) => { if (fresh) syncJobStatusFromApi(fresh); })
          .catch(() => {});
      }),
      subscribe("dashboard", () => {
        triggerDashboardRefresh();
      }),
    ];
    return () => unsubs.forEach((fn) => fn());
  }, [subscribe, fetchJobLog, fetchJobDetail, syncJobStatusFromApi, triggerDashboardRefresh]);

  // --- Load latest job on project change ---
  const refreshRunner = useCallback(async () => {
    if (!selectedProject) return;
    try {
      const res = await apiFetch(
        `/api/jobs/latest?project=${encodeURIComponent(selectedProject)}`
      );
      if (!res.ok) return;
      const data = await res.json();
      const apiJob = data.job;
      if (!apiJob) {
        setJobSync(null);
        setLogText("");
        return;
      }
      setJobSync(jobFromApi(apiJob));
      await fetchJobLog(apiJob.id);
    } catch { /* ignore */ }
  }, [selectedProject, setJobSync, fetchJobLog]);

  useEffect(() => {
    setJobSync(null);
    setLogText("");
    setError(null);
    if (selectedProject) refreshRunner();
  }, [selectedProject, refreshRunner, setJobSync]);

  // --- Slow fallback poll for status (30s) ---
  useEffect(() => {
    const id = job?.id;
    if (!id) return;
    const timer = window.setInterval(async () => {
      try {
        const fresh = await fetchJobDetail(id);
        if (fresh) await syncJobStatusFromApi(fresh);
      } catch { /* ignore */ }
    }, FALLBACK_STATUS_POLL_MS);
    return () => clearInterval(timer);
  }, [job?.id, fetchJobDetail, syncJobStatusFromApi]);

  // --- Auto-scroll ---
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
        if (!res.ok) throw new Error(data.error || res.statusText);
        setJobSync({
          id: data.jobId,
          kind: data.kind,
          project: selectedProject,
          macroId: data.macroId,
          status: "queued",
        });
        setLogText("");
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setStarting(false);
      }
    },
    [selectedProject, setJobSync]
  );

  const cancelJob = useCallback(async () => {
    if (!job?.id) return;
    setError(null);
    try {
      const res = await apiFetch(`/api/jobs/${job.id}/cancel`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && data.job) {
        await syncJobStatusFromApi(data.job);
        return;
      }
      if (!res.ok) throw new Error(data.error || res.statusText);
      jobStatusRef.current = "cancelled";
      setJob((prev) => prev ? { ...prev, status: data.status || "cancelled" } : prev);
      await fetchJobLog(job.id);
    } catch (e) {
      const fresh = await fetchJobDetail(job.id).catch(() => null);
      if (fresh) {
        await syncJobStatusFromApi(fresh);
        if (!isJobActive(fresh.status)) return;
      }
      setError(e.message || String(e));
    }
  }, [job?.id, fetchJobLog, syncJobStatusFromApi, fetchJobDetail]);

  const isBusy = isJobActive(job?.status);
  const logStreamStatus = connected && isBusy ? "connected" : connected ? "offline" : "reconnecting";

  return {
    job,
    logText,
    error,
    starting,
    isBusy,
    logStreamStatus,
    logScrollRef,
    startJob,
    selectJob: useCallback(
      async (jobId) => {
        if (!jobId) return;
        setError(null);
        setLogText("");
        jobIdRef.current = jobId;
        try {
          const fresh = await fetchJobDetail(jobId);
          if (!fresh) {
            jobIdRef.current = null;
            setError("Job não encontrado");
            return;
          }
          setJobSync(jobFromApi(fresh));
          await fetchJobLog(fresh.id);
        } catch (e) {
          setError(e.message || String(e));
        }
      },
      [fetchJobDetail, setJobSync, fetchJobLog]
    ),
    selectSlot: useCallback(
      async (workerSlot) => {
        if (!selectedProject || !workerSlot) return;
        setError(null);
        setLogText("");
        jobIdRef.current = null;
        jobStatusRef.current = null;
        try {
          const res = await apiFetch(
            `/api/jobs/by-slot?project=${encodeURIComponent(selectedProject)}&slot=${workerSlot}`
          );
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(data.error || res.statusText);
          }
          if (!data.job) {
            setJobSync(null);
            return;
          }
          const mapped = jobFromApi(data.job);
          jobIdRef.current = mapped.id;
          jobStatusRef.current = mapped.status ?? null;
          setJobSync(mapped);
          await fetchJobLog(mapped.id);
        } catch (e) {
          setError(e.message || String(e));
        }
      },
      [selectedProject, setJobSync, fetchJobLog]
    ),
    sendInput: async () => {},
    cancelJob,
  };
}
