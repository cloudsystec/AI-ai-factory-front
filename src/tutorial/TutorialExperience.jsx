import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import "../styles/dashboard-app.css";

import DashboardShell from "../layout/DashboardShell.jsx";

import DashboardTopBar from "../components/DashboardTopBar.jsx";

import MotorSidebar from "../components/MotorSidebar.jsx";

import CommandCenter from "../components/CommandCenter.jsx";

import NewProjectModal from "../NewProjectModal.jsx";

import { RunnerExecutionProvider } from "../context/RunnerExecutionContext.jsx";

import { useSession } from "../SessionContext.jsx";

import { TutorialProvider, useTutorial } from "./TutorialContext.jsx";

import TutorialOverlay from "./TutorialOverlay.jsx";

import TutorialMetricsSidebar from "./TutorialMetricsSidebar.jsx";

import TutorialUsageEventsModal from "./TutorialUsageEventsModal.jsx";

import TutorialMacroDetailModal from "./TutorialMacroDetailModal.jsx";

import TutorialMicrosDetailModal from "./TutorialMicrosDetailModal.jsx";

import TutorialAgentsPage from "./TutorialAgentsPage.jsx";

import { useMockRunnerExecution } from "./mockRunnerExecution.js";

import {

  MOCK_PROJECT,

  MOCK_SCOPE_STATE,

  TUTORIAL_PROJECT_SLUG,

  createInitialMockTasks,

} from "./mockData.js";



const KANBAN_COLUMNS = [

  { key: "todo", title: "A fazer", icon: "📥" },

  { key: "development", title: "Desenvolvimento", icon: "⚙️" },

  { key: "testing", title: "Testes / QA", icon: "🧪" },

  { key: "human_approval", title: "Revisão", icon: "👤" },

  { key: "done", title: "Concluído", icon: "✅" },

  { key: "blocked", title: "Bloqueado", icon: "⛔" },

];



const MODAL_STEPS = new Set([
  "fill_project",
  "discovery_compose",
  "discovery_send",
  "submit_project",
]);



const METRICS_MODAL_STEPS = new Set(["metrics_cost_modal", "metrics_pool_modal"]);

const SCOPE_DETAIL_MODAL_STEPS = new Set(["macro_detail_modal", "micro_detail_modal"]);

const AGENTS_STEPS = new Set(["agents_roles", "agents_editor", "agents_actions"]);

const DASHBOARD_STEPS = new Set([

  "dashboard_overview",

  "pipeline_stepper",

  "scope_generation",

  "macro_pipeline_click",

  "macro_detail_modal",

  "micro_pipeline_click",

  "micro_detail_modal",

  "motor_play",

  "kanban_progress",

  "metrics_sidebar",

  "metrics_cost_card",

  "metrics_pool_card",

  "agents_nav",

  "finish",

]);



function normalizeAgent(agent) {

  return String(agent || "").trim();

}



import { getKanbanColumn } from "../lib/kanban-column.js";



function TutorialTaskCard({ task }) {

  return (

    <article

      className="glass-card rounded-xl p-3 border-l-2 task-card-hover"

      style={{

        borderLeftColor: "rgba(20,184,166,0.55)",

        background:

          "linear-gradient(145deg,rgba(20,184,166,0.05) 0%,rgba(14,24,50,0.6) 100%)",

      }}

      data-task-id={task.id}

    >

      <p className="text-dash-body font-semibold text-slate-100 m-0">{task.title}</p>

      <p className="text-dash-caption text-slate-500 mt-1 mb-0">{task.id}</p>

    </article>

  );

}



function TutorialDashboardBody({

  tasks,

  scopeState,

  showDashboard,

  onLogout,

  onNewProjectClick,

  onAgentsClick,

  onMacroClick,

  onMicrosClick,

  onCostCardClick,

  onPoolCardClick,

  currentStepId,

  showAgentsPage,

}) {

  const { session, capabilities: caps } = useSession();

  const { advanceOnAction } = useTutorial();

  const [tasksState, setTasksState] = useState(tasks);

  const pipelineStepTutorialTargets = useMemo(() => {

    if (currentStepId === "macro_pipeline_click") return { macro: "pipeline-step-macro" };

    if (currentStepId === "micro_pipeline_click") return { micro: "pipeline-step-micro" };

    return {};

  }, [currentStepId]);



  const mockRunner = useMockRunnerExecution({

    autoPlayAll: currentStepId === "motor_play",

    onPlayStarted: () => {

      advanceOnAction();

    },

    onKanbanTick: (updater) => {

      setTasksState((prev) => updater(prev));

    },

  });



  useEffect(() => {

    setTasksState(tasks);

  }, [tasks]);



  useEffect(() => {

    if (currentStepId === "motor_play") {

      setTasksState(tasks);

    }

  }, [currentStepId, tasks]);



  const runningCount = mockRunner.activeSlots?.length ?? 0;

  const showFullDashboard = showDashboard || DASHBOARD_STEPS.has(currentStepId);

  const showKanbanLayout = showFullDashboard && !showAgentsPage;



  return (

    <RunnerExecutionProvider overrideValue={mockRunner}>

      <div className="tutorial-banner">

        Tour guiado — siga os passos para conhecer a plataforma

      </div>

      <div className="tutorial-shell" style={{ paddingTop: "1.75rem" }}>

        <DashboardShell

          topBar={

            <div

              data-tutorial={

                currentStepId === "pipeline_stepper" ? "pipeline-stepper" : undefined

              }

            >

              <DashboardTopBar

                tenantName={session?.tenantName}

                email={session?.email}

                runningCount={runningCount}

                canManageUsers={caps.canManageUsers}

                canExecute={caps.canExecute}

                isPlatformAdmin={false}

                onUsers={() => {}}

                onAgents={onAgentsClick}

                onAdminWorkers={() => {}}

                onAdmin={() => {}}

                activeView={showAgentsPage ? "agents" : "dashboard"}

                onHome={() => {}}

                onLogout={onLogout}

                scope={showFullDashboard ? scopeState : null}

                projectCompleted={false}

                onMacroClick={onMacroClick}

                onMicrosClick={onMicrosClick}

                onTasksClick={() => {}}

                onDevClick={() => {}}

                projects={showFullDashboard ? [MOCK_PROJECT] : []}

                selectedProject={showFullDashboard ? TUTORIAL_PROJECT_SLUG : ""}

                selectedProjectMeta={showFullDashboard ? MOCK_PROJECT : null}

                onProjectChange={() => {}}

                canWrite

                onNewProject={onNewProjectClick}

                onEditProject={undefined}

                newProjectTutorialTarget={

                  currentStepId === "click_add_project" ? "new-project-btn" : undefined

                }

                projectPickerTutorialTarget={

                  showFullDashboard ? "project-picker" : undefined

                }

                agentsNavTutorialTarget={

                  currentStepId === "agents_nav" ? "agents-nav-btn" : undefined

                }

                pipelineStepTutorialTargets={pipelineStepTutorialTargets}

              />

            </div>

          }

          motor={

            showKanbanLayout ? (

              <MotorSidebar

                playAllTutorialTarget={

                  currentStepId === "motor_play" ? "motor-play-all" : undefined

                }

              />

            ) : null

          }

          center={

            showAgentsPage ? (

              <TutorialAgentsPage currentStepId={currentStepId} />

            ) : showFullDashboard ? (

              <div

                data-tutorial="kanban-board"

                className="flex flex-col flex-1 min-h-0 h-full"

              >

                <CommandCenter

                  columns={KANBAN_COLUMNS}

                  tasks={tasksState}

                  getKanbanColumn={getKanbanColumn}

                  renderTaskCard={(task) => (

                    <TutorialTaskCard key={task.id} task={task} />

                  )}

                />

              </div>

            ) : (

              <div

                key={currentStepId}

                className="tutorial-stage-hint flex flex-1 items-center justify-center text-slate-400 text-sm px-6 text-center max-w-md mx-auto leading-relaxed"

              >

                {currentStepId === "welcome" &&

                  "Clique em Próximo para começar o tour."}

                {currentStepId === "click_add_project" &&

                  "O botão + no topo está destacado — é por aí que se cria um projeto."}

                {MODAL_STEPS.has(currentStepId) &&

                  "Preencha o formulário conforme as indicações ao lado."}

              </div>

            )

          }

          metrics={

            showKanbanLayout ? (

              <TutorialMetricsSidebar

                scope={scopeState}

                currentStepId={currentStepId}

                onCostCardClick={onCostCardClick}

                onPoolCardClick={onPoolCardClick}

              />

            ) : null

          }

        />

      </div>

      <TutorialOverlay />

    </RunnerExecutionProvider>

  );

}



function TutorialFlowInner({

  onLogout,

  autoTypeSignal,

  onAutoTypeComplete,

  usageModal,

  setUsageModal,

  scopeDetailModal,

  setScopeDetailModal,

}) {

  const { currentStep, advanceOnAction } = useTutorial();

  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  const [showDashboard, setShowDashboard] = useState(false);

  const [draftScope, setDraftScope] = useState("");



  const showAgentsPage = AGENTS_STEPS.has(currentStep.id);



  useEffect(() => {

    if (currentStep.id === "welcome" || currentStep.id === "click_add_project") {

      setShowNewProjectModal(false);

      setShowDashboard(false);

    } else if (MODAL_STEPS.has(currentStep.id)) {

      setShowNewProjectModal(true);

    } else if (DASHBOARD_STEPS.has(currentStep.id) || AGENTS_STEPS.has(currentStep.id)) {

      setShowNewProjectModal(false);

      setShowDashboard(true);

    }

  }, [currentStep.id]);



  useEffect(() => {

    if (currentStep.id === "metrics_cost_modal") {

      setUsageModal("cost");

    } else if (currentStep.id === "metrics_pool_modal") {

      setUsageModal("pool");

    } else if (!METRICS_MODAL_STEPS.has(currentStep.id)) {

      setUsageModal(null);

    }

  }, [currentStep.id, setUsageModal]);

  const handleMacroClick = useCallback(() => {

    if (currentStep.id === "macro_pipeline_click") {

      setScopeDetailModal("macro");

      advanceOnAction();

    }

  }, [advanceOnAction, currentStep.id, setScopeDetailModal]);

  const handleMicrosClick = useCallback(() => {

    if (currentStep.id === "micro_pipeline_click") {

      setScopeDetailModal("micro");

      advanceOnAction();

    }

  }, [advanceOnAction, currentStep.id, setScopeDetailModal]);

  useEffect(() => {

    if (currentStep.id === "macro_detail_modal") {

      setScopeDetailModal("macro");

    } else if (currentStep.id === "micro_detail_modal") {

      setScopeDetailModal("micro");

    } else if (!SCOPE_DETAIL_MODAL_STEPS.has(currentStep.id)) {

      setScopeDetailModal(null);

    }

  }, [currentStep.id, setScopeDetailModal]);

  const handleNewProjectClick = useCallback(() => {

    setShowNewProjectModal(true);

    advanceOnAction();

  }, [advanceOnAction]);



  const handleTutorialSubmit = useCallback(() => {

    setShowDashboard(true);

    setShowNewProjectModal(false);

    advanceOnAction();

  }, [advanceOnAction]);



  const handleMacroHelpDrawerOpen = useCallback(() => {

    advanceOnAction();

  }, [advanceOnAction]);



  const handleMacroHelpUsed = useCallback(() => {

    advanceOnAction();

  }, [advanceOnAction]);



  const handleCostCardClick = useCallback(() => {

    setUsageModal("cost");

    advanceOnAction();

  }, [advanceOnAction, setUsageModal]);



  const handlePoolCardClick = useCallback(() => {

    setUsageModal("pool");

    advanceOnAction();

  }, [advanceOnAction, setUsageModal]);



  const handleAgentsClick = useCallback(() => {

    advanceOnAction();

  }, [advanceOnAction]);



  const initialTasks = useMemo(() => createInitialMockTasks(), []);



  return (

    <>

      <TutorialDashboardBody

        tasks={initialTasks}

        scopeState={MOCK_SCOPE_STATE}

        showDashboard={showDashboard}

        onLogout={onLogout}

        onNewProjectClick={handleNewProjectClick}

        onAgentsClick={handleAgentsClick}

        onMacroClick={handleMacroClick}

        onMicrosClick={handleMicrosClick}

        onCostCardClick={handleCostCardClick}

        onPoolCardClick={handlePoolCardClick}

        currentStepId={currentStep.id}

        showAgentsPage={showAgentsPage}

      />



      {showNewProjectModal && (

        <NewProjectModal
          tutorialMode
          onClose={() => {}}
          onCreated={() => {}}
          onTutorialSubmit={handleTutorialSubmit}
          onMacroHelpInteraction={handleMacroHelpUsed}
          submitTutorialTarget="submit-project"
          discoveryInputTutorialTarget={
            currentStep.id === "discovery_compose" ? "discovery-input" : undefined
          }
          discoverySendTutorialTarget={
            currentStep.id === "discovery_send" ? "discovery-send" : undefined
          }
          tutorialAutoTypeSignal={autoTypeSignal}
          onTutorialAutoTypeComplete={onAutoTypeComplete}
        />

      )}



      {usageModal === "cost" && (

        <TutorialUsageEventsModal scope="project" variant="cost" onClose={() => {}} />

      )}



      {usageModal === "pool" && (

        <TutorialUsageEventsModal scope="pool" variant="pool" onClose={() => {}} />

      )}



      {scopeDetailModal === "macro" && (

        <TutorialMacroDetailModal onClose={() => {}} />

      )}



      {scopeDetailModal === "micro" && (

        <TutorialMicrosDetailModal onClose={() => {}} />

      )}

    </>

  );

}



/**

 * @param {{ onFinish: () => Promise<void>, onLogout: () => void }} props

 */

export default function TutorialExperience({ onFinish, onLogout }) {

  const autoTypeResolverRef = useRef(null);

  const [autoTypeSignal, setAutoTypeSignal] = useState(0);

  const [usageModal, setUsageModal] = useState(null);

  const [scopeDetailModal, setScopeDetailModal] = useState(null);



  const stepHandlers = useMemo(

    () => ({

      macro_help_compose: (advance) =>
        new Promise((resolve) => {
          autoTypeResolverRef.current = () => {
            autoTypeResolverRef.current = null;
            advance();
            resolve();
          };
          setAutoTypeSignal((n) => n + 1);
        }),

      discovery_compose: (advance) =>
        new Promise((resolve) => {
          autoTypeResolverRef.current = () => {
            autoTypeResolverRef.current = null;
            advance();
            resolve();
          };
          setAutoTypeSignal((n) => n + 1);
        }),

      macro_detail_modal: (advance) => {

        setScopeDetailModal(null);

        advance();

      },

      micro_detail_modal: (advance) => {

        setScopeDetailModal(null);

        advance();

      },

      metrics_cost_modal: (advance) => {

        setUsageModal(null);

        advance();

      },

      metrics_pool_modal: (advance) => {

        setUsageModal(null);

        advance();

      },

    }),

    []

  );



  const handleAutoTypeComplete = useCallback(() => {

    autoTypeResolverRef.current?.();

  }, []);



  return (

    <TutorialProvider onFinish={onFinish} stepHandlers={stepHandlers}>

      <TutorialFlowInner

        onLogout={onLogout}

        autoTypeSignal={autoTypeSignal}

        onAutoTypeComplete={handleAutoTypeComplete}

        usageModal={usageModal}

        setUsageModal={setUsageModal}

        scopeDetailModal={scopeDetailModal}

        setScopeDetailModal={setScopeDetailModal}

      />

    </TutorialProvider>

  );

}


