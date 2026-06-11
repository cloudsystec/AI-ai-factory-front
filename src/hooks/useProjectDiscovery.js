import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../api.js";
import { getMockDiscoveryResponse } from "../tutorial/mockProjectDiscoveryResponses.js";

/**
 * @param {{ tutorialMode?: boolean, onTutorialMessageSent?: () => void }} [opts]
 */
export function useProjectDiscovery(opts = {}) {
  const { tutorialMode = false, onTutorialMessageSent } = opts;
  const tutorialNotifiedRef = useRef(false);
  const userMessageCountRef = useRef(0);

  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [decisions, setDecisions] = useState({});
  const [openTopics, setOpenTopics] = useState([]);
  const [readyToCreate, setReadyToCreate] = useState(false);
  const [proposedName, setProposedName] = useState(null);
  const [proposedSlug, setProposedSlug] = useState(null);
  const [scopeMd, setScopeMd] = useState(null);
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
    if (data.progress) setProgress(data.progress);
    if (data.topicLabels) setTopicLabels(data.topicLabels);
  }, []);

  const startSession = useCallback(async () => {
    if (tutorialMode) {
      const mock = getMockDiscoveryResponse("", 0);
      applySession({
        sessionId: "tutorial-discovery",
        messages: [
          {
            role: "assistant",
            content:
              "Olá! Sou o assistente PO/SM. Vamos definir o projeto juntos — nada será assumido sem a sua confirmação. Qual problema de negócio quer resolver e para quem?",
          },
        ],
        decisions: mock.decisions,
        openTopics: mock.openTopics,
        readyToCreate: false,
        progress: mock.progress,
        topicLabels: {},
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/project-discovery/sessions", {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      applySession(data);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, [applySession, tutorialMode]);

  useEffect(() => {
    startSession();
  }, [startSession]);

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
    [applySession, onTutorialMessageSent, pending, sessionId, tutorialMode]
  );

  const cancelSession = useCallback(async () => {
    if (tutorialMode || !sessionId) return;
    try {
      await apiFetch(
        `/api/project-discovery/sessions/${encodeURIComponent(sessionId)}`,
        { method: "DELETE" }
      );
    } catch {
      /* best-effort */
    }
  }, [sessionId, tutorialMode]);

  return {
    sessionId,
    messages,
    decisions,
    openTopics,
    readyToCreate,
    proposedName,
    proposedSlug,
    scopeMd,
    progress,
    topicLabels,
    loading,
    pending,
    error,
    sendMessage,
    cancelSession,
    startSession,
  };
}
