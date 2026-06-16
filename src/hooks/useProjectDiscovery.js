import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../api.js";
import { getMockDiscoveryResponse, DISCOVERY_STATIC_WELCOME } from "../tutorial/mockProjectDiscoveryResponses.js";

/**
 * @param {{
 *   tutorialMode?: boolean,
 *   onTutorialMessageSent?: () => void,
 *   resumeSessionId?: string | null,
 *   onDraftCreated?: (slug: string) => void,
 * }} [opts]
 */
export function useProjectDiscovery(opts = {}) {
  const {
    tutorialMode = false,
    onTutorialMessageSent,
    resumeSessionId = null,
    onDraftCreated,
  } = opts;
  const tutorialNotifiedRef = useRef(false);
  const userMessageCountRef = useRef(0);
  const hadDraftRef = useRef(false);
  const onDraftCreatedRef = useRef(onDraftCreated);
  const initSeqRef = useRef(0);

  useEffect(() => {
    onDraftCreatedRef.current = onDraftCreated;
  }, [onDraftCreated]);

  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [decisions, setDecisions] = useState({});
  const [openTopics, setOpenTopics] = useState([]);
  const [readyToCreate, setReadyToCreate] = useState(false);
  const [proposedName, setProposedName] = useState(null);
  const [proposedSlug, setProposedSlug] = useState(null);
  const [scopeMd, setScopeMd] = useState(null);
  const [draftProjectSlug, setDraftProjectSlug] = useState(null);
  const [hasDraftProject, setHasDraftProject] = useState(false);
  const [progress, setProgress] = useState({ resolved: 0, total: 14 });
  const [topicLabels, setTopicLabels] = useState({});
  const [loading, setLoading] = useState(!tutorialMode);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const applySession = useCallback((data) => {
    setSessionId(data.sessionId ?? null);
    setMessages(Array.isArray(data.messages) ? data.messages : []);
    setDecisions(data.decisions || {});
    setOpenTopics(data.openTopics || []);
    setReadyToCreate(Boolean(data.readyToCreate));
    setProposedName(data.proposedName ?? null);
    setProposedSlug(data.proposedSlug ?? null);
    setScopeMd(data.scopeMd ?? null);

    const nowHasDraft = Boolean(data.hasDraftProject);
    const slug = data.draftProjectSlug ?? null;
    if (nowHasDraft && !hadDraftRef.current && slug) {
      onDraftCreatedRef.current?.(slug);
    }
    if (nowHasDraft) {
      hadDraftRef.current = true;
    }
    setHasDraftProject(nowHasDraft);
    setDraftProjectSlug(slug);

    if (data.progress) setProgress(data.progress);
    if (data.topicLabels) setTopicLabels(data.topicLabels);
  }, []);

  useEffect(() => {
    hadDraftRef.current = false;
    const initSeq = ++initSeqRef.current;

    if (tutorialMode) {
      const mock = getMockDiscoveryResponse("", 0);
      applySession({
        sessionId: "tutorial-discovery",
        messages: [
          {
            role: "assistant",
            content: DISCOVERY_STATIC_WELCOME,
          },
        ],
        decisions: mock.decisions,
        openTopics: ["problem"],
        readyToCreate: false,
        progress: mock.progress,
        topicLabels: {},
      });
      setLoading(false);
      setError(null);
      return undefined;
    }

    let cancelled = false;

    async function initSession() {
      setLoading(true);
      setError(null);
      try {
        const res = resumeSessionId
          ? await apiFetch(
              `/api/project-discovery/sessions/${encodeURIComponent(resumeSessionId)}`
            )
          : await apiFetch("/api/project-discovery/sessions", {
              method: "POST",
            });
        const data = await res.json().catch(() => ({}));
        if (cancelled || initSeq !== initSeqRef.current) return;
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        if (data.hasDraftProject) {
          hadDraftRef.current = true;
        }
        applySession(data);
      } catch (err) {
        if (!cancelled && initSeq === initSeqRef.current) {
          setError(err.message || String(err));
        }
      } finally {
        if (!cancelled && initSeq === initSeqRef.current) {
          setLoading(false);
        }
      }
    }

    initSession();

    return () => {
      cancelled = true;
    };
  }, [applySession, resumeSessionId, tutorialMode]);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = String(text ?? "").trim();
      if (!trimmed || pending) return;

      const userMessage = { role: "user", content: trimmed };
      setMessages((prev) => [...prev, userMessage]);
      setPending(true);
      setError(null);

      try {
        if (tutorialMode) {
          await new Promise((r) => window.setTimeout(r, 700));
          userMessageCountRef.current += 1;
          const mock = getMockDiscoveryResponse(
            trimmed,
            userMessageCountRef.current
          );
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: mock.assistantMessage },
          ]);
          setDecisions(mock.decisions);
          setOpenTopics(mock.openTopics);
          setReadyToCreate(mock.readyToCreate);
          setProposedName(mock.proposedName);
          setProposedSlug(mock.proposedSlug);
          setScopeMd(mock.scopeMd);
          setProgress(mock.progress);
          if (!tutorialNotifiedRef.current) {
            tutorialNotifiedRef.current = true;
            onTutorialMessageSent?.();
          }
          return;
        }

        if (!sessionId) throw new Error("Sessão não iniciada.");

        const res = await apiFetch(
          `/api/project-discovery/sessions/${encodeURIComponent(sessionId)}/chat`,
          {
            method: "POST",
            body: JSON.stringify({ message: trimmed }),
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        applySession(data);
      } catch (err) {
        setError(err.message || String(err));
      } finally {
        setPending(false);
      }
    },
    [
      applySession,
      onTutorialMessageSent,
      pending,
      sessionId,
      tutorialMode,
    ]
  );

  const cancelSession = useCallback(async () => {
    if (tutorialMode || !sessionId || hasDraftProject) return;
    try {
      await apiFetch(
        `/api/project-discovery/sessions/${encodeURIComponent(sessionId)}`,
        { method: "DELETE" }
      );
    } catch {
      /* best-effort */
    }
  }, [hasDraftProject, sessionId, tutorialMode]);

  return {
    sessionId,
    messages,
    decisions,
    openTopics,
    readyToCreate,
    proposedName,
    proposedSlug,
    scopeMd,
    draftProjectSlug,
    hasDraftProject,
    progress,
    topicLabels,
    loading,
    pending,
    error,
    sendMessage,
    cancelSession,
  };
}
