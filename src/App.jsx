import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import "./styles/dashboard-app.css";
import {
  PIPELINE_STEPS,
  getStepVisualState,
  isPipelineRunning,
} from "./pipeline.js";
import TaskDetailModal from "./TaskDetailModal.jsx";
import NewProjectModal from "./NewProjectModal.jsx";
import ProjectSettingsModal from "./ProjectSettingsModal.jsx";
import ConnectGitModal from "./ConnectGitModal.jsx";
import ScopeDetailModal from "./ScopeDetailModal.jsx";
import MicrosDetailModal from "./MicrosDetailModal.jsx";
import MacroDetailModal from "./MacroDetailModal.jsx";
import TasksDetailModal from "./TasksDetailModal.jsx";
import ProjectCompletionModal from "./ProjectCompletionModal.jsx";
import AdminPage from "./AdminPage.jsx";
import AdminWorkersPage from "./AdminWorkersPage.jsx";
import UsersPage from "./UsersPage.jsx";
import AgentsPage from "./AgentsPage.jsx";
import DashboardShell from "./layout/DashboardShell.jsx";
import DashboardTopBar from "./components/DashboardTopBar.jsx";
import MotorSidebar from "./components/MotorSidebar.jsx";
import MetricsSidebar from "./components/MetricsSidebar.jsx";
import CommandCenter from "./components/CommandCenter.jsx";
import { RunnerExecutionProvider } from "./context/RunnerExecutionContext.jsx";
import { RailwayPublishProvider } from "./context/RailwayPublishContext.jsx";
import { apiFetch } from "./api.js";
import {
  projectExistsInList,
  readStoredDashboardProject,
  resolveSelectedProject,
  writeStoredDashboardProject,
} from "./lib/dashboardProjectSelection.js";
import {
  isClientGitConnected,
  isGitReadyForPlay,
  isWorkspacePreparing,
} from "./lib/projectGit.js";
import { useCapabilities, useSession } from "./SessionContext.jsx";
import { useSocket } from "./useSocket.jsx";

const columns = [
  { key: "todo", title: "A fazer", icon: "📥" },
  { key: "development", title: "Desenvolvimento", icon: "⚙️" },
  { key: "testing", title: "Testes / QA", icon: "🧪" },
  { key: "human_approval", title: "Revisão", icon: "👤" },
  { key: "done", title: "Concluído", icon: "✅" },
  { key: "blocked", title: "Bloqueado", icon: "⛔" },
];

function formatUpdated(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

function formatTimeShort(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function stepIcon(visual) {
  if (visual === "completed") return "✓";
  if (visual === "active") return "●";
  if (visual === "failed") return "!";
  return "○";
}

function normalizeAgent(agent) {
  return String(agent || "").trim();
}

const AGENT_LABELS = {
  "Planner Agent": "Planejamento",
  "Dev Agent": "Desenvolvimento",
  "QA Agent": "Qualidade",
  "Reviewer Agent": "Revisão",
  "Local Test Runner": "Testes",
  "Human Approval Pending": "Revisão humana",
  Done: "Concluído",
};

function friendlyAgent(agent) {
  const key = normalizeAgent(agent);
  return AGENT_LABELS[key] || key || "—";
}

const PAUSE_STEP_TO_COLUMN = {
  dev: "testing",
  qa: "done",
};

/** Coluna Kanban (pode divergir de `status` quando `status` é done). */
function getKanbanColumn(task) {
  if (task.blockReason === "infra" && task.failedStep === "finalize") {
    return "testing";
  }
  if (task.status === "blocked" || task.blockReason) {
    return "blocked";
  }
  if (task.status === "paused") {
    return PAUSE_STEP_TO_COLUMN[task.lastCompletedStep] || "development";
  }
  if (normalizeAgent(task.currentAgent) === "Human Approval Pending") {
    return "human_approval";
  }
  if (task.status === "done") {
    return "done";
  }
  if (task.status === "planning") {
    return "development";
  }
  if (task.status === "review") {
    return "testing";
  }
  return task.status;
}

/** Vista mínima na coluna Concluído após aprovação humana (currentAgent = "Done"). */
function isCompactDoneTask(task) {
  return getKanbanColumn(task) === "done" && normalizeAgent(task.currentAgent) === "Done";
}

function PipelineTrack({ task, dimmed }) {
  return (
    <div
      className={`pipeline-track${dimmed ? " pipeline-track--dimmed" : ""}`}
      aria-label="Progresso do pipeline de desenvolvimento"
    >
      {PIPELINE_STEPS.map((step, i) => {
        const visual = getStepVisualState(task, i);
        const classes = [
          "pipeline-step",
          `pipeline-step--${visual}`,
          visual === "active" ? "pipeline-step--active" : "",
        ]
          .filter(Boolean)
          .join(" ");

        const connDone =
          i > 0 && getStepVisualState(task, i - 1) === "completed" && !dimmed;

        return (
          <React.Fragment key={step.key}>
            {i > 0 && (
              <div
                className={
                  connDone ? "pipeline-conn pipeline-conn--done" : "pipeline-conn"
                }
                aria-hidden
              />
            )}
            <div className={classes} title={`${step.label}: ${visual}`}>
              <div className="pipeline-step__ring" aria-current={visual === "active"}>
                <span aria-hidden>{stepIcon(visual)}</span>
              </div>
              <span className="pipeline-step__label">
                {step.short} {step.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function TaskTitleButton({ task, compact, onOpenDetail }) {
  return (
    <button
      type="button"
      className={`task-card__title-btn${compact ? " task-card__title-btn--compact" : ""}`}
      onClick={() => onOpenDetail(task.id)}
      title="Ver detalhe da task"
    >
      {task.title}
    </button>
  );
}

function TaskCard({
  task,
  onOpenDetail,
  onHumanApprove,
  onRetry,
  canApprove,
  canExecute,
  pullRequest,
  showGitUi = true,
  visual = "default",
}) {
  const uxpilot = visual === "uxpilot";
  const uxpilotCardClass =
    "glass-card rounded-xl p-3 border-l-2 task-card-hover cursor-pointer";
  const uxpilotCardStyle = {
    borderLeftColor: "rgba(20,184,166,0.55)",
    background:
      "linear-gradient(145deg,rgba(20,184,166,0.05) 0%,rgba(14,24,50,0.6) 100%)",
  };

  function openTaskDetail(e) {
    if (e?.target?.closest?.("a, button")) return;
    onOpenDetail(task.id);
  }

  if (isCompactDoneTask(task)) {
    return (
      <article
        className={
          uxpilot
            ? `${uxpilotCardClass} task-card--compact-done`
            : "task-card task-card--compact-done"
        }
        style={uxpilot ? uxpilotCardStyle : undefined}
        data-task-id={task.id}
        title={`${task.id} — concluída`}
        onClick={uxpilot ? openTaskDetail : undefined}
        onKeyDown={
          uxpilot
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") openTaskDetail(e);
              }
            : undefined
        }
        role={uxpilot ? "button" : undefined}
        tabIndex={uxpilot ? 0 : undefined}
      >
        <span className="task-card__done-icon" aria-hidden>
          ✓
        </span>
        <h3 className="task-card__title task-card__title--compact">
          <TaskTitleButton task={task} compact onOpenDetail={onOpenDetail} />
        </h3>
      </article>
    );
  }

  const running = isPipelineRunning(task) && !task.blockReason;
  const blocked = task.status === "blocked" || Boolean(task.blockReason);
  const backlogReady = task.backlogReady === true;
  const inTodo = getKanbanColumn(task) === "todo";

  return (
    <article
      className={
        uxpilot
          ? [
              uxpilotCardClass,
              running ? " task-card--running" : "",
              blocked ? " task-card--blocked" : "",
            ]
              .filter(Boolean)
              .join("")
          : `task-card${running ? " task-card--running" : ""}${blocked ? " task-card--blocked" : ""}${backlogReady ? " task-card--backlog-ready" : ""}${inTodo ? " task-card--todo-col" : ""}`
      }
      style={uxpilot ? uxpilotCardStyle : undefined}
      data-task-id={task.id}
      onClick={uxpilot ? openTaskDetail : undefined}
      onKeyDown={
        uxpilot
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") openTaskDetail(e);
            }
          : undefined
      }
      role={uxpilot ? "button" : undefined}
      tabIndex={uxpilot ? 0 : undefined}
    >
      <div className="task-card__id">{task.id}</div>
      <h3 className="task-card__title">
        <TaskTitleButton task={task} onOpenDetail={onOpenDetail} />
      </h3>
      {inTodo && task.id && (
        <p className="task-card__subtitle">{task.id}</p>
      )}
      <div className="task-card__meta">
        {!inTodo && <span>{task.project}</span>}
        {(backlogReady || (inTodo && !running && !blocked)) && (
          <span className="task-card__status-pill" role="status">
            Pronto
          </span>
        )}
        <span className="task-card__time">
          {inTodo ? formatTimeShort(task.updatedAt) : formatUpdated(task.updatedAt)}
        </span>
      </div>
      {backlogReady && !inTodo && (
        <p className="task-card__backlog-badge" role="status">
          Pronta para desenvolvimento
        </p>
      )}
      {running && (
        <div className="pipeline-live-badge" style={{ marginBottom: 8 }}>
          <span className="pipeline-live-badge__dot" aria-hidden />
          Em execução
        </div>
      )}
      <div className={`task-card__agent${running ? " task-card__agent--live" : ""}`}>
        <span aria-hidden>{blocked ? "⚠️" : running ? "▶️" : "📌"}</span>
        <span>{friendlyAgent(task.currentAgent)}</span>
      </div>
      {!backlogReady && <PipelineTrack task={task} dimmed={blocked} />}
      {showGitUi && pullRequest?.htmlUrl && (
        <p className="task-card__pr">
          <a href={pullRequest.htmlUrl} target="_blank" rel="noreferrer">
            Pull request #{pullRequest.number || ""}
          </a>
          {pullRequest.tlReviewStatus
            ? ` · TL: ${pullRequest.tlReviewStatus}`
            : ""}
        </p>
      )}
      {getKanbanColumn(task) === "human_approval" && canApprove && onHumanApprove && (
        <button
          type="button"
          className="toolbar-btn toolbar-btn--primary task-card__validate"
          onClick={() => onHumanApprove(task.id)}
        >
          Validar
        </button>
      )}
      {blocked && (
        <div className={`pipeline-banner${task.blockReason === "infra" ? " pipeline-banner--infra" : ""}`} role="status">
          <span className="pipeline-banner__label">
            {task.failedStep === "finalize"
              ? showGitUi
                ? "Erro Git / PR"
                : "Erro ao publicar código"
              : friendlyAgent(task.currentAgent)}
          </span>
          <span className="pipeline-banner__hint">
            {task.failedStep === "finalize"
              ? showGitUi
                ? "Código pronto — só falta enviar ao Git"
                : "Código pronto — falha ao publicar"
              : ""}
          </span>
          {canExecute && onRetry && (
            <button
              type="button"
              className="toolbar-btn toolbar-btn--primary pipeline-banner__retry"
              onClick={() => onRetry(task)}
            >
              {task.failedStep === "finalize"
                ? showGitUi
                  ? "Enviar PR"
                  : "Tentar novamente"
                : "Retry"}
            </button>
          )}
        </div>
      )}
      {task.status === "paused" && (
        <div className="pipeline-banner pipeline-banner--paused" role="status">
          Pausada — será retomada ao carregar Play.
        </div>
      )}
    </article>
  );
}

export default function App({ onLogout }) {
  const caps = useCapabilities();
  const { session, isPlatformAdmin } = useSession();
  const { subscribe } = useSocket();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const tenantId = session?.tenantId;
  const [tasks, setTasks] = useState([]);
  const [scopeState, setScopeState] = useState(null);
  const [autorun, setAutorun] = useState(false);
  const [skipHumanApproval, setSkipHumanApproval] = useState(true);
  const [taskPullRequests, setTaskPullRequests] = useState({});
  const [developSettingsError, setDevelopSettingsError] = useState(null);
  const [showProjectSettings, setShowProjectSettings] = useState(false);
  const [detailTaskId, setDetailTaskId] = useState(null);
  const [projectsError, setProjectsError] = useState(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [appView, setAppView] = useState("dashboard");
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState(null);
  const [resetNotice, setResetNotice] = useState(null);
  const [showScopeDetail, setShowScopeDetail] = useState(false);
  const [showMicrosDetail, setShowMicrosDetail] = useState(false);
  const [showMacroDetail, setShowMacroDetail] = useState(false);
  const [showTasksDetail, setShowTasksDetail] = useState(false);
  const [showProjectCompletion, setShowProjectCompletion] = useState(false);
  const [showConnectGitModal, setShowConnectGitModal] = useState(false);
  const [billingSummary, setBillingSummary] = useState(null);

  const loadProjects = useCallback(async () => {
    try {
      const response = await apiFetch("/api/projects");
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setProjects(data);
      setProjectsError(null);
      return data;
    } catch (e) {
      setProjectsError(e.message || String(e));
      return [];
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!tenantId) return;
    try {
      localStorage.removeItem("ai-factory-dashboard-project");
    } catch {
      /* ignore */
    }
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) return;
    writeStoredDashboardProject(tenantId, selectedProject);
  }, [tenantId, selectedProject]);

  const loadDashboardData = useCallback(async () => {
    if (!selectedProject || !projectExistsInList(projects, selectedProject)) return;
    const q = encodeURIComponent(selectedProject);
    try {
      const [tasksRes, scopeRes, settingsRes] = await Promise.all([
        apiFetch(`/api/tasks?project=${q}`),
        apiFetch(`/api/scope-state?project=${q}`),
        apiFetch(`/api/develop-settings?project=${q}`),
      ]);

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        if (Array.isArray(data)) {
          setTasks(data);
        } else if (data && Array.isArray(data.tasks)) {
          setTasks(data.tasks);
        } else {
          setTasks([]);
        }
      } else {
        setTasks([]);
      }

      if (scopeRes.ok) {
        const scopeJson = await scopeRes.json();
        setScopeState(scopeJson);
      } else {
        setScopeState(null);
      }

      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        setAutorun(settings.autorun === true);
        setSkipHumanApproval(settings.skipHumanApproval === true);
        setDevelopSettingsError(null);
      }

      const meta = projects.find((p) =>
        (typeof p === "string" ? p : p.slug) === selectedProject
      );
      const showGitUi = isClientGitConnected(meta);
      if (showGitUi) {
        const prRes = await apiFetch(
          `/api/projects/${encodeURIComponent(selectedProject)}/pull-requests`
        );
        if (prRes.ok) {
          const prList = await prRes.json();
          const byTask = {};
          for (const pr of prList) {
            const tid = pr.taskId || pr.task_id;
            if (!tid) continue;
            byTask[tid] = {
              htmlUrl: pr.htmlUrl || pr.pr_url,
              number: pr.number ?? pr.pr_number,
              tlReviewStatus: pr.tlReviewStatus || pr.tl_review_status,
            };
          }
          setTaskPullRequests(byTask);
        }
      } else {
        setTaskPullRequests({});
      }
    } catch {
      setTasks([]);
      setScopeState(null);
    }
  }, [selectedProject, projects]);

  useEffect(() => {
    if (!selectedProject) {
      setTasks([]);
      setScopeState(null);
      setAutorun(false);
      setSkipHumanApproval(true);
      setTaskPullRequests({});
      setDevelopSettingsError(null);
      setResetError(null);
      setResetNotice(null);
      return;
    }

    loadDashboardData();
    const fallback = setInterval(loadDashboardData, 30_000);
    const unsub = subscribe("dashboard", (ev) => {
      loadDashboardData();
      if (ev?.reason === "git-provision" || ev?.reason === "git-migrate") {
        void loadProjects();
      }
    });
    return () => { clearInterval(fallback); unsub(); };
  }, [selectedProject, loadDashboardData, subscribe]);

  const handleResetProject = useCallback(async () => {
    if (!selectedProject || resetting) return;
    const ok = window.confirm(
      `Restaurar o projeto "${selectedProject}" ao zero?\n\n` +
        "• Cria backup ZIP em data/tenants/.../BACKUP/<data>/ (workspace, macro, código, relatórios)\n" +
        "• Apaga o workspace atual no CLI e restaura só o escopo macro da BD\n" +
        "• Limpa micros, tarefas e snapshot do painel\n\n" +
        "Esta ação não pode ser desfeita (só recuperável pelo ZIP de backup)."
    );
    if (!ok) return;

    setResetting(true);
    setResetError(null);
    setResetNotice(null);
    try {
      const res = await apiFetch(
        `/api/projects/${encodeURIComponent(selectedProject)}/reset`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      setDetailTaskId(null);
      const rel = data.backup?.backupRelative;
      setResetNotice(
        rel
          ? `Backup guardado: ${rel}. Projeto reposto a zero.`
          : data.message || "Projeto reposto a zero."
      );
      await loadDashboardData();
    } catch (e) {
      setResetError(e.message || String(e));
    } finally {
      setResetting(false);
    }
  }, [selectedProject, resetting, loadDashboardData]);

  const handleDeleteProject = useCallback(async () => {
    if (!selectedProject || resetting) return;
    const ok = window.confirm(
      `DELETAR o projeto "${selectedProject}" permanentemente?\n\n` +
        "• Remove todos os dados do projeto do banco (jobs, PRs, micros, tarefas)\n" +
        "• Executa reset do workspace antes de apagar\n\n" +
        "Esta ação NÃO pode ser desfeita."
    );
    if (!ok) return;
    setResetting(true);
    setResetError(null);
    setResetNotice(null);
    try {
      const res = await apiFetch(
        `/api/projects/${encodeURIComponent(selectedProject)}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      setSelectedProject("");
      setResetNotice(`Projeto "${selectedProject}" deletado.`);
      await loadProjects();
    } catch (e) {
      setResetError(e.message || String(e));
    } finally {
      setResetting(false);
    }
  }, [selectedProject, resetting, loadProjects]);

  useEffect(() => {
    if (!tenantId) return;
    const stored = readStoredDashboardProject(tenantId);
    const next = resolveSelectedProject(projects, selectedProject, stored);
    if (next !== selectedProject) {
      setSelectedProject(next);
    }
  }, [tenantId, projects, selectedProject]);

  const [githubNotice, setGithubNotice] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ghStatus = params.get("github");
    if (!ghStatus) return;

    const isPopup = window.opener !== null;

    if (ghStatus === "connected") {
      if (isPopup) {
        window.close();
        return;
      }
      setGithubNotice(null);
      loadProjects();
    } else if (ghStatus === "error") {
      if (isPopup) {
        window.close();
        return;
      }
      const reason = params.get("reason");
      setGithubNotice(
        reason === "bad_credentials"
          ? "GitHub: App ID ou chave privada (.pem) incorretos no servidor. Abra a GitHub App → About, copie o App ID para GITHUB_APP_ID no .env e use a private key gerada nessa mesma app. Valide com: node scripts/verify-github-app.mjs"
          : "Falha ao ligar GitHub. Tente Conectar GitHub novamente."
      );
    }
    window.history.replaceState({}, "", window.location.pathname);
  }, [loadProjects]);

  const runningCount = useMemo(
    () => tasks.filter((t) => isPipelineRunning(t)).length,
    [tasks]
  );

  const selectedProjectMeta = useMemo(() => {
    return projects.find((p) =>
      (typeof p === "string" ? p : p.slug) === selectedProject
    );
  }, [projects, selectedProject]);

  const projectCompleted = useMemo(() => {
    if (scopeState?.projectCompleted) return true;
    if (selectedProjectMeta && typeof selectedProjectMeta === "object") {
      return selectedProjectMeta.status === "completed";
    }
    return false;
  }, [scopeState?.projectCompleted, selectedProjectMeta]);

  const canExecuteProject = caps.canExecute && !projectCompleted;

  const completionCelebratedRef = useRef(/** @type {Set<string>} */ (new Set()));

  const handleProjectCompleted = useCallback(async () => {
    const slug = selectedProject;
    if (!slug) return;
    if (completionCelebratedRef.current.has(slug)) return;
    completionCelebratedRef.current.add(slug);
    await loadProjects();
    await loadDashboardData();
    setShowProjectCompletion(true);
  }, [selectedProject, loadProjects, loadDashboardData]);

  async function handleRetryTask(task) {
    if (!selectedProject) return;
    const reason = task.blockReason || null;
    const failed = task.failedStep || null;
    const lastStep = task.lastCompletedStep || null;

    const body = {
      project: selectedProject,
      kind: "task",
      taskId: task.id,
    };

    if (reason === "infra" && failed) {
      body.retryMode = "infra";
      body.failedStep = failed;
      if (lastStep) body.retryFromStep = lastStep;
    } else if (reason === "agent" || lastStep) {
      body.retryMode = "agent";
      if (lastStep) body.retryFromStep = lastStep;
    }

    try {
      const res = await apiFetch("/api/jobs", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      await loadDashboardData();
    } catch (e) {
      const msg = e.message || String(e);
      setDevelopSettingsError(`Retry falhou: ${msg}`);
      console.error("[Retry]", msg);
    }
  }

  async function handleHumanApprove(taskId) {
    if (!selectedProject) return;
    try {
      const res = await apiFetch(
        `/api/projects/${encodeURIComponent(selectedProject)}/tasks/${encodeURIComponent(taskId)}/human-approve`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      await loadDashboardData();
    } catch (e) {
      setDevelopSettingsError(e.message || String(e));
    }
  }

  async function handleSkipHumanChange(checked) {
    if (!selectedProject) return;
    const previous = skipHumanApproval;
    setSkipHumanApproval(checked);
    setDevelopSettingsError(null);
    try {
      const response = await apiFetch("/api/develop-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: selectedProject,
          skipHumanApproval: checked,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || response.statusText);
      }
      const data = await response.json();
      setSkipHumanApproval(data.skipHumanApproval === true);
    } catch (e) {
      setSkipHumanApproval(previous);
      setDevelopSettingsError(e.message || String(e));
    }
  }

  async function handleAutorunChange(checked) {
    if (!selectedProject) return;
    const previous = autorun;
    setAutorun(checked);
    setDevelopSettingsError(null);
    try {
      const response = await apiFetch("/api/develop-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: selectedProject, autorun: checked }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || response.statusText);
      }
      const data = await response.json();
      setAutorun(data.autorun === true);
    } catch (e) {
      setAutorun(previous);
      setDevelopSettingsError(e.message || String(e));
    }
  }

  const toggleAppView = useCallback((view) => {
    setAppView((current) => (current === view ? "dashboard" : view));
  }, []);

  const goDashboard = useCallback(() => setAppView("dashboard"), []);

  const isDashboardView = appView === "dashboard";

  const runnerProps = {
    selectedProject,
    projectMeta: selectedProjectMeta,
    macroId: scopeState?.macroId,
    autorun,
    skipHumanApproval,
    canExecute: canExecuteProject,
    projectCompleted,
    canWrite: caps.canWrite,
    gitReady: isGitReadyForPlay(selectedProjectMeta),
    workspacePreparing: isWorkspacePreparing(selectedProjectMeta),
    showGitUi: isClientGitConnected(selectedProjectMeta),
    onAutorunChange: handleAutorunChange,
    onSkipHumanChange: handleSkipHumanChange,
    tasks,
    detailTaskId,
    onDashboardRefresh: loadDashboardData,
    onProjectsRefresh: loadProjects,
    onProjectCompleted: handleProjectCompleted,
    billingSummary,
  };

  return (
    <RailwayPublishProvider projectSlug={selectedProject || null}>
      <RunnerExecutionProvider {...runnerProps}>
        <DashboardShell
          topBar={
            <DashboardTopBar
              tenantName={session?.tenantName}
              email={session?.email}
              runningCount={runningCount}
              canManageUsers={caps.canManageUsers}
              canExecute={caps.canExecute}
              isPlatformAdmin={isPlatformAdmin}
              onUsers={() => toggleAppView("users")}
              onAgents={() => toggleAppView("agents")}
              onAdminWorkers={() => toggleAppView("adminWorkers")}
              onAdmin={() => toggleAppView("admin")}
              activeView={appView}
              onHome={goDashboard}
              onLogout={onLogout}
              scope={scopeState}
              projectCompleted={projectCompleted}
              onMacroClick={() => setShowMacroDetail(true)}
              onMicrosClick={() => setShowMicrosDetail(true)}
              onTasksClick={async () => {
                await loadDashboardData();
                setShowTasksDetail(true);
              }}
              onDevClick={() => setShowProjectCompletion(true)}
              projects={projects}
              selectedProject={selectedProject}
              selectedProjectMeta={selectedProjectMeta}
              onProjectChange={setSelectedProject}
              canWrite={caps.canWrite}
              onNewProject={
                caps.canWrite ? () => setShowNewProjectModal(true) : undefined
              }
              onEditProject={
                caps.canWrite && selectedProject
                  ? () => setShowProjectSettings(true)
                  : undefined
              }
              notificationProjectSlug={
                projectCompleted && selectedProject ? selectedProject : null
              }
              notificationProjectName={
                projectCompleted && selectedProjectMeta
                  ? typeof selectedProjectMeta === "object"
                    ? selectedProjectMeta.name || selectedProject
                    : selectedProject
                  : null
              }
            />
          }
          motor={isDashboardView ? <MotorSidebar /> : null}
          center={
            isDashboardView ? (
            <div className="flex flex-col flex-1 min-h-0 gap-3">
              {(resetNotice ||
                resetError ||
                githubNotice ||
                developSettingsError ||
                projectsError) && (
                <div className="dashboard-alerts" role="status">
                  {resetNotice && <p className="msg msg--ok">{resetNotice}</p>}
                  {resetError && (
                    <p className="msg msg--error">{resetError}</p>
                  )}
                  {githubNotice && (
                    <p className="msg msg--error">{githubNotice}</p>
                  )}
                  {developSettingsError && (
                    <p className="msg msg--error">{developSettingsError}</p>
                  )}
                  {projectsError && (
                    <p className="msg msg--error">
                      Erro ao carregar projetos: {projectsError}
                    </p>
                  )}
                </div>
              )}
              <CommandCenter
                columns={columns}
                tasks={tasks}
                getKanbanColumn={getKanbanColumn}
                disabled={!selectedProject}
                emptyHint={
                  !selectedProject
                    ? "Selecione um projeto para ver o quadro de tarefas."
                    : null
                }
                renderTaskCard={(task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    visual="uxpilot"
                    onOpenDetail={setDetailTaskId}
                    onHumanApprove={handleHumanApprove}
                    onRetry={handleRetryTask}
                    canApprove={caps.canWrite || canExecuteProject}
                    canExecute={canExecuteProject}
                    pullRequest={taskPullRequests[task.id]}
                    showGitUi={isClientGitConnected(selectedProjectMeta)}
                  />
                )}
              />
            </div>
            ) : appView === "agents" ? (
              <AgentsPage
                projectSlug={selectedProject}
                projectName={
                  selectedProjectMeta && typeof selectedProjectMeta === "object"
                    ? selectedProjectMeta.name
                    : selectedProject
                }
              />
            ) : appView === "users" ? (
              <UsersPage />
            ) : appView === "admin" ? (
              <AdminPage />
            ) : appView === "adminWorkers" ? (
              <AdminWorkersPage />
            ) : null
          }
          metrics={
            isDashboardView ? (
            <MetricsSidebar
              projectSlug={selectedProject}
              cotation={billingSummary?.cotation}
              scope={scopeState}
              projectCompleted={projectCompleted}
              onBillingSummary={setBillingSummary}
              onMacroClick={() => setShowMacroDetail(true)}
              onMicrosClick={() => setShowMicrosDetail(true)}
              onTasksClick={async () => {
                await loadDashboardData();
                setShowTasksDetail(true);
              }}
              onDevClick={() => setShowProjectCompletion(true)}
            />
            ) : null
          }
        />

      {detailTaskId && selectedProject && (
        <TaskDetailModal
          project={selectedProject}
          taskId={detailTaskId}
          runtimeSnapshot={tasks.find((t) => t.id === detailTaskId) ?? null}
          onClose={() => setDetailTaskId(null)}
        />
      )}

      {showProjectCompletion && selectedProject && scopeState && (
        <ProjectCompletionModal
          projectSlug={selectedProject}
          projectName={
            selectedProjectMeta && typeof selectedProjectMeta === "object"
              ? selectedProjectMeta.name
              : selectedProject
          }
          scope={scopeState}
          taskCount={tasks.filter((t) => t.status === "done").length}
          onClose={() => setShowProjectCompletion(false)}
        />
      )}

      {showNewProjectModal && (
        <NewProjectModal
          onClose={() => setShowNewProjectModal(false)}
          onCreated={async (created) => {
            const slug =
              typeof created === "string"
                ? created
                : created?.slug || created?.project || "";
            await loadProjects();
            if (slug) setSelectedProject(slug);
          }}
        />
      )}

      {showProjectSettings && selectedProject && (
        <ProjectSettingsModal
          projectSlug={selectedProject}
          projectMeta={selectedProjectMeta}
          canWrite={caps.canWrite}
          runningCount={runningCount}
          resetting={resetting}
          onClose={() => setShowProjectSettings(false)}
          onSaved={async () => {
            await loadProjects();
            await loadDashboardData();
          }}
          onResetProject={
            caps.canWrite ? () => handleResetProject() : undefined
          }
          onDeleteProject={
            caps.canWrite ? () => handleDeleteProject() : undefined
          }
          onConnectGit={
            caps.canWrite
              ? () => {
                  setShowProjectSettings(false);
                  setShowConnectGitModal(true);
                }
              : undefined
          }
          onRefreshProjects={loadProjects}
        />
      )}

      {showConnectGitModal && selectedProject && (
        <ConnectGitModal
          projectSlug={selectedProject}
          migrateMode={
            selectedProjectMeta &&
            typeof selectedProjectMeta === "object" &&
            selectedProjectMeta.repoMode === "managed"
          }
          onClose={() => setShowConnectGitModal(false)}
          onConnected={async () => {
            await loadProjects();
            await loadDashboardData();
          }}
        />
      )}

      {showScopeDetail && scopeState && (
        <ScopeDetailModal
          scope={scopeState}
          onClose={() => setShowScopeDetail(false)}
        />
      )}

      {showMacroDetail && selectedProject && (
        <MacroDetailModal
          projectSlug={selectedProject}
          macroId={scopeState?.macroId}
          initialScopeMd={scopeState?.macroScopeMd ?? ""}
          microCount={scopeState?.microCount ?? 0}
          macroEditable={scopeState?.macroEditable}
          canWrite={caps.canWrite}
          onClose={() => setShowMacroDetail(false)}
          onSaved={loadDashboardData}
        />
      )}

      {showMicrosDetail && scopeState && (
        <MicrosDetailModal
          micros={scopeState.micros ?? []}
          onClose={() => setShowMicrosDetail(false)}
        />
      )}

      {showTasksDetail && scopeState && (
        <TasksDetailModal
          openMicro={scopeState.openMicro}
          detail={scopeState.openMicroTasksDetail}
          onClose={() => setShowTasksDetail(false)}
        />
      )}
      </RunnerExecutionProvider>
    </RailwayPublishProvider>
  );
}
