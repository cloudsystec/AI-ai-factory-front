import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import {
  PIPELINE_STEPS,
  getStepVisualState,
  isPipelineRunning,
} from "./pipeline.js";
import TaskDetailModal from "./TaskDetailModal.jsx";
import NewProjectModal from "./NewProjectModal.jsx";
import RunnerSidebar from "./RunnerSidebar.jsx";
import BillingPanel from "./BillingPanel.jsx";
import ProjectBar from "./ProjectBar.jsx";
import ScopeDetailModal from "./ScopeDetailModal.jsx";
import AdminPage from "./AdminPage.jsx";
import UsersPage from "./UsersPage.jsx";
import AgentsPage from "./AgentsPage.jsx";
import { apiFetch } from "./api.js";
import { useCapabilities, useSession } from "./SessionContext.jsx";

const columns = [
  { key: "todo", title: "A fazer", icon: "📥" },
  { key: "planning", title: "Planejamento", icon: "📋" },
  { key: "development", title: "Desenvolvimento", icon: "⚙️" },
  { key: "testing", title: "Testes / QA", icon: "🧪" },
  { key: "review", title: "Revisão", icon: "👁️" },
  { key: "human_approval", title: "Aguardando Revisão Humana", icon: "👤" },
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
  "Planner Agent": "Planeamento",
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

/** Coluna Kanban (pode divergir de `status` quando `status` é done). */
function getKanbanColumn(task) {
  if (task.status === "blocked") {
    return "blocked";
  }
  if (normalizeAgent(task.currentAgent) === "Human Approval Pending") {
    return "human_approval";
  }
  if (task.status === "done") {
    return "done";
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

function TaskCard({ task, onOpenDetail }) {
  if (isCompactDoneTask(task)) {
    return (
      <article
        className="task-card task-card--compact-done"
        data-task-id={task.id}
        title={`${task.id} — concluída`}
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

  const running = isPipelineRunning(task);
  const blocked = task.status === "blocked";
  const backlogReady = task.backlogReady === true;

  return (
    <article
      className={`task-card${running ? " task-card--running" : ""}${blocked ? " task-card--blocked" : ""}${backlogReady ? " task-card--backlog-ready" : ""}`}
      data-task-id={task.id}
    >
      <div className="task-card__id">{task.id}</div>
      <h3 className="task-card__title">
        <TaskTitleButton task={task} onOpenDetail={onOpenDetail} />
      </h3>
      <div className="task-card__meta">
        <span>{task.project}</span>
        <span>{formatUpdated(task.updatedAt)}</span>
      </div>
      {backlogReady && (
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
      {blocked && (
        <div className="pipeline-banner" role="status">
          Execução interrompida — consulte o registo em Controlo.
        </div>
      )}
    </article>
  );
}

function scopeStepIcon(state) {
  if (state === "done") return "✓";
  if (state === "active") return "●";
  return "○";
}

function isScopeStateRenderable(scope) {
  return (
    scope &&
    scope.current &&
    typeof scope.current.label === "string" &&
    Array.isArray(scope.scopeSteps) &&
    scope.scopeSteps.length > 0
  );
}

function ScopeStrip({ scope, onOpenDetail }) {
  if (!isScopeStateRenderable(scope)) {
    return (
      <section className="scope-strip scope-strip--loading msg msg--muted">
        Estado do escopo ainda não disponível — execute um job no CLI (ex.: provision ou
        scope) para sincronizar.
      </section>
    );
  }

  const waveStats = scope.waveTaskStats ?? {
    total: 0,
    pendingTl: 0,
    todoApproved: 0,
  };

  return (
    <section
      className="scope-strip scope-strip--compact"
      aria-labelledby="scope-current-heading"
    >
      <div className="scope-strip__top scope-strip__top--compact">
        <div className="scope-strip__compact-main">
          <span className="scope-strip__eyebrow">Planeamento</span>
          <div className="scope-strip__title-row">
            <h2 id="scope-current-heading" className="scope-strip__current">
              {scope.current.label}
            </h2>
            {scope.devPipelineActive && (
              <span className="scope-strip__live">
                <span className="pipeline-live-badge__dot" aria-hidden />
                Em desenvolvimento
              </span>
            )}
          </div>
          <p className="scope-strip__summary-line">
            {scope.macroId}
            {scope.openMicro
              ? ` · ${scope.openMicro.title}`
              : scope.wavesCompleteScenario
                ? " · fases concluídas"
                : ""}
            {" · "}
            {waveStats.todoApproved} prontas · {waveStats.pendingTl} em revisão
          </p>
        </div>
        {onOpenDetail && (
          <button
            type="button"
            className="scope-strip__detail-btn"
            onClick={onOpenDetail}
          >
            Detalhes
          </button>
        )}
      </div>

      <div className="scope-strip__steps scope-strip__steps--compact" role="list">
        {scope.scopeSteps.map((step, i) => (
          <React.Fragment key={step.key}>
            {i > 0 && (
              <div
                className={
                  scope.scopeSteps[i - 1].state === "done"
                    ? "scope-strip__conn scope-strip__conn--done"
                    : "scope-strip__conn"
                }
                aria-hidden
              />
            )}
            <div
              role="listitem"
              className={`scope-strip__step scope-strip__step--${step.state}${
                step.state === "active" ? " scope-strip__step--pulse" : ""
              }`}
              title={`${step.label}: ${step.state}`}
            >
              <div className="scope-strip__ring">
                <span aria-hidden>{scopeStepIcon(step.state)}</span>
              </div>
              <span className="scope-strip__step-label">{step.label}</span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}

export default function App({ onLogout }) {
  const caps = useCapabilities();
  const { isPlatformAdmin } = useSession();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(() => {
    try {
      return localStorage.getItem("ai-factory-dashboard-project") || "";
    } catch {
      return "";
    }
  });
  const [tasks, setTasks] = useState([]);
  const [scopeState, setScopeState] = useState(null);
  const [dashboardPollFast, setDashboardPollFast] = useState(false);
  const [autorun, setAutorun] = useState(false);
  const [developSettingsError, setDevelopSettingsError] = useState(null);
  const [detailTaskId, setDetailTaskId] = useState(null);
  const [projectsError, setProjectsError] = useState(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [showAgents, setShowAgents] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState(null);
  const [resetNotice, setResetNotice] = useState(null);
  const [showScopeDetail, setShowScopeDetail] = useState(false);
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
    if (selectedProject) {
      try {
        localStorage.setItem("ai-factory-dashboard-project", selectedProject);
      } catch {
        /* ignore */
      }
    }
  }, [selectedProject]);

  const loadDashboardData = useCallback(async () => {
    if (!selectedProject) return;
    const q = encodeURIComponent(selectedProject);
    try {
      let pollFast = false;
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
          if (data.meta?.activeJobId) pollFast = true;
        } else {
          setTasks([]);
        }
      } else {
        setTasks([]);
      }

      if (scopeRes.ok) {
        const scopeJson = await scopeRes.json();
        setScopeState(scopeJson);
        if (scopeJson?.dashboardMeta?.activeJobId) pollFast = true;
      } else {
        setScopeState(null);
      }

      setDashboardPollFast(pollFast);

      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        setAutorun(settings.autorun === true);
        setDevelopSettingsError(null);
      }
    } catch {
      setTasks([]);
      setScopeState(null);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (!selectedProject) {
      setTasks([]);
      setScopeState(null);
      setAutorun(false);
      setDevelopSettingsError(null);
      setResetError(null);
      setResetNotice(null);
      return;
    }

    loadDashboardData();
    const pollMs = dashboardPollFast ? 800 : 1500;
    const interval = setInterval(loadDashboardData, pollMs);
    return () => clearInterval(interval);
  }, [selectedProject, loadDashboardData, dashboardPollFast]);

  const handleResetProject = useCallback(async () => {
    if (!selectedProject || resetting) return;
    const ok = window.confirm(
      `Repor o projeto "${selectedProject}" ao zero?\n\n` +
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

  useEffect(() => {
    if (!selectedProject && projects.length > 0) {
      setSelectedProject(projects[0]);
    }
  }, [projects, selectedProject]);

  const runningCount = useMemo(
    () => tasks.filter((t) => isPipelineRunning(t)).length,
    [tasks]
  );

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

  if (showAdmin) {
    return <AdminPage onClose={() => setShowAdmin(false)} />;
  }
  if (showUsers) {
    return <UsersPage onClose={() => setShowUsers(false)} />;
  }
  if (showAgents) {
    return (
      <AgentsPage
        projectSlug={selectedProject}
        onClose={() => setShowAgents(false)}
      />
    );
  }

  return (
    <div className="page-shell">
      <main className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">AI Factory Dashboard</h1>
          <p className="page-subtitle">
            Acompanhe o planeamento e o progresso das entregas do projeto selecionado.
          </p>
        </div>
        <div className="page-header__actions">
          {selectedProject && runningCount > 0 && (
            <div className="page-header__pill">
              <span className="pipeline-live-badge__dot" aria-hidden />
              {runningCount} em execução
            </div>
          )}
          {(caps.canManageUsers || isPlatformAdmin) && (
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => setShowUsers(true)}
            >
              Utilizadores
            </button>
          )}
          {caps.canWrite && (
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => setShowAgents(true)}
            >
              Agentes
            </button>
          )}
          {isPlatformAdmin && (
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => setShowAdmin(true)}
            >
              Admin plataforma
            </button>
          )}
          {onLogout && (
            <button type="button" className="toolbar-btn" onClick={onLogout}>
              Sair
            </button>
          )}
        </div>
      </header>

      <div className="top-panels">
        <ProjectBar
          projects={projects}
          selectedProject={selectedProject}
          onProjectChange={setSelectedProject}
          canWrite={caps.canWrite}
          onNewProject={
            caps.canWrite ? () => setShowNewProjectModal(true) : undefined
          }
          onResetProject={
            caps.canWrite && selectedProject
              ? () => handleResetProject()
              : undefined
          }
          resetting={resetting}
          runningCount={runningCount}
        />
        <BillingPanel compact onSummary={setBillingSummary} />
      </div>

      {resetNotice && (
        <p className="msg msg--ok">{resetNotice}</p>
      )}

      {resetError && (
        <p className="msg msg--error">{resetError}</p>
      )}

      {developSettingsError && (
        <p className="msg msg--error">{developSettingsError}</p>
      )}

      {projectsError && (
        <p className="msg msg--error">Erro ao carregar projetos: {projectsError}</p>
      )}

      {!selectedProject && (
        <p className="msg msg--muted">Selecione um projeto para ver o quadro de tarefas.</p>
      )}

      {selectedProject &&
        (scopeState !== null ? (
          <ScopeStrip
            scope={scopeState}
            onOpenDetail={() => setShowScopeDetail(true)}
          />
        ) : (
          <p className="scope-strip scope-strip--loading msg msg--muted">
            A carregar estado do escopo…
          </p>
        ))}

      <h2 className="section-kanban-title">Tarefas</h2>

      <div className="pipeline-board">
        {columns.map((column) => {
          const colTasks = tasks.filter((task) => getKanbanColumn(task) === column.key);
          return (
            <section
              key={column.key}
              className={`pipeline-column${
                column.key === "human_approval" ? " pipeline-column--human-approval" : ""
              }`}
            >
              <div className="pipeline-column__head">
                <span className="pipeline-column__title">
                  {column.icon} {column.title}
                </span>
                <span className="pipeline-column__count">{colTasks.length}</span>
              </div>
              {colTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onOpenDetail={setDetailTaskId}
                />
              ))}
            </section>
          );
        })}
      </div>

      {detailTaskId && selectedProject && (
        <TaskDetailModal
          project={selectedProject}
          taskId={detailTaskId}
          runtimeSnapshot={tasks.find((t) => t.id === detailTaskId) ?? null}
          dashboardPollFast={dashboardPollFast}
          onClose={() => setDetailTaskId(null)}
        />
      )}

      {showNewProjectModal && (
        <NewProjectModal
          onClose={() => setShowNewProjectModal(false)}
          onCreated={async (slug) => {
            await loadProjects();
            setSelectedProject(slug);
          }}
        />
      )}

      {showScopeDetail && scopeState && (
        <ScopeDetailModal
          scope={scopeState}
          onClose={() => setShowScopeDetail(false)}
        />
      )}
      </main>

      <RunnerSidebar
        selectedProject={selectedProject}
        macroId={scopeState?.macroId}
        autorun={autorun}
        canExecute={caps.canExecute}
        canWrite={caps.canWrite}
        onAutorunChange={handleAutorunChange}
        tasks={tasks}
        detailTaskId={detailTaskId}
        onDashboardRefresh={loadDashboardData}
        billingSummary={billingSummary}
      />
    </div>
  );
}
