import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faChevronDown,
  faFolder,
  faFolderOpen,
  faPlus,
  faRobot,
  faArrowRightFromBracket,
  faGear,
} from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import BrandLogo from "./BrandLogo.jsx";
import NotificationBell from "./NotificationBell.jsx";
import {
  isClientGitConnected,
  isWorkspacePreparing,
} from "../lib/projectGit.js";
import {
  isScopeStateRenderable,
  scopeProgressPercent,
  scopeStepDisplayLabel,
} from "../lib/scopeTimeline.js";
import { getProjectFolderPalette, resolveProjectLifecycleStatus } from "../lib/projectLifecycle.js";

function projectSlug(p) {
  return typeof p === "string" ? p : p.slug;
}

function projectName(p) {
  if (typeof p === "string") return p;
  return p.name || p.slug;
}

function HeaderStepper({ scope, onMacroClick, onMicrosClick, onTasksClick, onDevClick, projectCompleted }) {
  if (!isScopeStateRenderable(scope)) {
    return (
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        <span className="text-dash-caption" style={{ color: "#64748b" }}>
          Carregando escopo…
        </span>
      </div>
    );
  }

  const fillWidth = scopeProgressPercent(scope);
  const handlers = {
    macro: onMacroClick,
    micro: onMicrosClick,
    tasking: onTasksClick,
    dev: projectCompleted ? onDevClick : undefined,
  };

  return (
    <div className="flex-1 flex flex-col gap-1.5 min-w-0">
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
        {scope.scopeSteps.map((step, i) => {
          const label = scopeStepDisplayLabel(step.key, step.label);
          const onClick = handlers[step.key];
          const isDone = step.state === "done";
          const isActive = step.state === "active";

          return (
            <React.Fragment key={step.key}>
              {i > 0 && (
                <div
                  className="w-4 h-px flex-shrink-0"
                  style={{
                    background: isDone || isActive
                      ? "rgba(20,184,166,0.32)"
                      : "rgba(51,65,85,0.45)",
                  }}
                />
              )}
              <button
                type="button"
                className="flex items-center gap-1 flex-shrink-0"
                disabled={!onClick}
                onClick={onClick}
                title={onClick ? `Abrir ${label}` : label}
              >
                {isDone ? (
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "linear-gradient(135deg,#14b8a6,#06b6d4)",
                      boxShadow: "0 0 9px rgba(20,184,166,0.55)",
                    }}
                  >
                    <FontAwesomeIcon icon={faCheck} className="text-white" style={{ fontSize: "6px" }} />
                  </div>
                ) : isActive ? (
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 step-dot-active"
                    style={{
                      background: "rgba(8,16,36,0.97)",
                      border: "1.5px solid #14b8a6",
                      boxShadow: "0 0 11px rgba(20,184,166,0.55)",
                    }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "linear-gradient(135deg,#14b8a6,#06b6d4)" }}
                    />
                  </div>
                ) : (
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "rgba(10,18,44,0.92)",
                      border: "1.5px solid rgba(51,65,85,0.45)",
                    }}
                  >
                    <div className="w-1 h-1 rounded-full bg-slate-700" />
                  </div>
                )}
                <span
                  className={`text-dash-caption font-semibold flex-shrink-0 ${
                    isActive ? "text-white font-bold" : isDone ? "text-teal-400" : ""
                  }`}
                  style={!isActive && !isDone ? { color: "#475569" } : undefined}
                >
                  {label}
                </span>
              </button>
            </React.Fragment>
          );
        })}
      </div>
      <div className="slim-progress-track">
        <div className="slim-progress-fill" style={{ width: fillWidth }} />
      </div>
    </div>
  );
}

export default function DashboardTopBar({
  tenantName,
  email,
  runningCount = 0,
  canManageUsers,
  canExecute,
  isPlatformAdmin,
  onUsers,
  onAgents,
  onAdminWorkers,
  onAdmin,
  onLogout,
  activeView = "dashboard",
  onHome,
  scope,
  projectCompleted,
  onMacroClick,
  onMicrosClick,
  onTasksClick,
  onDevClick,
  projects = [],
  selectedProject,
  selectedProjectMeta = null,
  onProjectChange,
  canWrite = false,
  onNewProject,
  onEditProject,
  notificationProjectSlug = null,
  notificationProjectName = null,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const showGitUi = isClientGitConnected(selectedProjectMeta);
  const preparing = isWorkspacePreparing(selectedProjectMeta);
  const activeName =
    selectedProjectMeta && typeof selectedProjectMeta === "object"
      ? selectedProjectMeta.name || selectedProject
      : selectedProject || "Selecione um projecto";
  const selectedPalette = getProjectFolderPalette(selectedProjectMeta, scope);
  const selectedLifecycle = resolveProjectLifecycleStatus(selectedProjectMeta, scope);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
    return undefined;
  }, [dropdownOpen]);

  return (
    <header
      className="glass-panel mx-4 mt-3 mb-2 rounded-2xl flex items-center justify-between px-7 py-3 flex-shrink-0 relative overflow-visible"
      id="header"
    >
      <div className="shimmer-line" aria-hidden />
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg,transparent 0%,rgba(20,184,166,0.36) 30%,rgba(99,102,241,0.26) 70%,transparent 100%)",
        }}
        aria-hidden
      />

      <button
        type="button"
        className="flex items-center gap-3.5 flex-shrink-0 bg-transparent border-0 p-0 cursor-pointer text-left"
        onClick={onHome}
        aria-label="Ir para o dashboard"
      >
        <BrandLogo variant="symbol" className="w-9 h-9" />
        <div>
          <h1 className="text-dash-heading font-bold tracking-wide brand-text leading-tight">
            {tenantName || "DevForLess"}
          </h1>
          <span className="text-dash-caption font-medium" style={{ color: "#64748b" }}>
            {email || "—"}
          </span>
        </div>
      </button>

      <div className="hidden lg:flex flex-1 max-w-3xl mx-8 items-center gap-4" id="header-progress">
        <div className="relative flex-shrink-0" id="project-dropdown-wrap" ref={dropdownRef}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="project-selector flex items-center gap-2.5 px-3.5 py-2 rounded-xl"
              id="project-trigger"
              onClick={() => setDropdownOpen((o) => !o)}
            >
              <div
                className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: selectedPalette.iconBg,
                  border: selectedPalette.iconBorder,
                }}
                title={
                  selectedLifecycle === "completed"
                    ? "Projeto finalizado"
                    : selectedLifecycle === "started"
                      ? "Projeto em andamento"
                      : "Sem micros — escopo ainda editável"
                }
              >
                <FontAwesomeIcon
                  icon={faFolderOpen}
                  className={selectedPalette.colorClass}
                  style={{ fontSize: "8px" }}
                />
              </div>
              <div className="flex flex-col text-left">
                <span
                  className="text-dash-caption uppercase tracking-wider font-semibold leading-none mb-0.5"
                  style={{ color: "#475569" }}
                >
                  Projeto
                </span>
                <span className="text-dash-body text-teal-200 font-semibold leading-none max-w-[120px] truncate">
                  {activeName}
                </span>
              </div>
              {showGitUi && (
                <>
                  <div
                    className="w-px h-5 mx-1 flex-shrink-0"
                    style={{ background: "rgba(20,184,166,0.18)" }}
                  />
                  <div className="flex items-center gap-1">
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0"
                      style={{ boxShadow: "0 0 5px #14b8a6" }}
                    />
                    <span className="text-dash-caption text-teal-400 font-medium">Git activo</span>
                  </div>
                </>
              )}
              {preparing && (
                <span className="text-dash-caption text-amber-400">A preparar…</span>
              )}
              <FontAwesomeIcon
                icon={faChevronDown}
                className="text-dash-caption ml-1 transition-transform duration-200"
                style={{
                  color: "#475569",
                  transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>
            {canWrite && onNewProject && (
              <button
                type="button"
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg,rgba(20,184,166,0.14) 0%,rgba(6,182,212,0.08) 100%)",
                  border: "1px solid rgba(20,184,166,0.25)",
                  boxShadow: "0 0 10px rgba(20,184,166,0.07)",
                }}
                title="Adicionar projeto"
                onClick={onNewProject}
              >
                <FontAwesomeIcon icon={faPlus} className="text-teal-400 text-dash-caption" />
              </button>
            )}
          </div>

          <div
            className={`project-dropdown${dropdownOpen ? " open" : ""}`}
            id="project-dropdown"
            style={{ top: "calc(100% + 8px)", left: 0 }}
          >
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-dash-caption font-bold tracking-widest uppercase" style={{ color: "#475569" }}>
                  Projetos
                </span>
                <span className="text-dash-caption text-teal-400 font-semibold">
                  {projects.length} projecto{projects.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto custom-scrollbar" id="project-list">
                {projects.map((p) => {
                  const slug = projectSlug(p);
                  const palette = getProjectFolderPalette(p);
                  const isActive = slug === selectedProject;
                  const branch =
                    typeof p === "object" && p.defaultBranch ? p.defaultBranch : "main";
                  return (
                    <div
                      key={slug}
                      role="button"
                      tabIndex={0}
                      className={`project-item${isActive ? " active-project" : ""} rounded-xl px-3 py-2.5 flex items-center justify-between`}
                      onClick={() => {
                        onProjectChange(slug);
                        setDropdownOpen(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          onProjectChange(slug);
                          setDropdownOpen(false);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: palette.iconBg, border: palette.iconBorder }}
                        >
                          <FontAwesomeIcon icon={faFolder} className={`${palette.colorClass} text-dash-caption`} />
                        </div>
                        <div>
                          <p className="text-dash-body text-teal-100 font-semibold leading-tight">
                            {projectName(p)}
                          </p>
                          <p
                            className="text-dash-caption leading-tight flex items-center gap-1 mt-0.5"
                            style={{ color: "#475569" }}
                          >
                            <FontAwesomeIcon icon={faGithub} style={{ fontSize: "8px", color: "#475569" }} />
                            {branch}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isActive && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0"
                            style={{ boxShadow: "0 0 5px #14b8a6" }}
                          />
                        )}
                        {canWrite && onEditProject && (
                          <button
                            type="button"
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 ${palette.settingsHover}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onProjectChange(slug);
                              onEditProject();
                              setDropdownOpen(false);
                            }}
                          >
                            <FontAwesomeIcon icon={faGear} className="text-dash-caption" style={{ color: "#475569" }} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {canWrite && onNewProject && (
              <>
                <div
                  className="mx-4 my-2"
                  style={{
                    height: "1px",
                    background: "linear-gradient(90deg,transparent,rgba(20,184,166,0.18),transparent)",
                  }}
                />
                <div className="px-4 pb-4">
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-dash-caption font-semibold text-teal-400 transition-all duration-200"
                    style={{
                      background: "linear-gradient(135deg,rgba(20,184,166,0.08) 0%,rgba(6,182,212,0.045) 100%)",
                      border: "1px dashed rgba(20,184,166,0.22)",
                    }}
                    onClick={() => {
                      onNewProject();
                      setDropdownOpen(false);
                    }}
                  >
                    <FontAwesomeIcon icon={faPlus} className="text-dash-caption" />
                    Novo Projeto
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div
          className="w-px h-7 flex-shrink-0"
          style={{ background: "linear-gradient(180deg,transparent,rgba(20,184,166,0.22),transparent)" }}
        />

        {selectedProject && (
          <HeaderStepper
            scope={scope}
            projectCompleted={projectCompleted}
            onMacroClick={onMacroClick}
            onMicrosClick={onMicrosClick}
            onTasksClick={onTasksClick}
            onDevClick={onDevClick}
          />
        )}
      </div>

      <div className="flex items-center gap-2.5 flex-shrink-0">
        <NotificationBell
          projectSlug={notificationProjectSlug}
          projectName={notificationProjectName}
        />
        <div
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-dash-caption font-medium"
          style={{
            background: "linear-gradient(135deg,rgba(20,184,166,0.11) 0%,rgba(6,182,212,0.07) 100%)",
            border: "1px solid rgba(20,184,166,0.25)",
            boxShadow: "0 0 16px rgba(20,184,166,0.09)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block"
            style={{
              animation: runningCount > 0 ? "blink 2s step-end infinite" : undefined,
              boxShadow: "0 0 7px #14b8a6",
            }}
          />
          <span className="text-teal-300">
            {runningCount > 0 ? `${runningCount} em execução` : "Sistema activo"}
          </span>
        </div>
        {(canManageUsers || isPlatformAdmin) && onUsers && (
          <button
            type="button"
            className={`btn-glass px-3 py-2 rounded-xl text-dash-body${activeView === "users" ? " btn-glass--active" : " text-slate-300"}`}
            onClick={onUsers}
          >
            Usuários
          </button>
        )}
        {canExecute && onAgents && (
          <button
            type="button"
            className={`btn-glass px-3.5 py-2 rounded-xl text-dash-body font-medium flex items-center gap-2${activeView === "agents" ? " btn-glass--active" : ""}`}
            onClick={onAgents}
          >
            <FontAwesomeIcon icon={faRobot} className="text-violet-400 text-dash-body" />
            <span className={`text-dash-body${activeView === "agents" ? "" : " text-slate-300"}`}>Agentes</span>
          </button>
        )}
        {isPlatformAdmin && onAdminWorkers && (
          <button
            type="button"
            className={`btn-glass px-3 py-2 rounded-xl text-dash-body${activeView === "adminWorkers" ? " btn-glass--active" : " text-slate-300"}`}
            onClick={onAdminWorkers}
          >
            Bots
          </button>
        )}
        {isPlatformAdmin && onAdmin && (
          <button
            type="button"
            className={`btn-glass px-3 py-2 rounded-xl text-dash-body${activeView === "admin" ? " btn-glass--active" : " text-slate-300"}`}
            onClick={onAdmin}
          >
            Admin
          </button>
        )}
        {onLogout && (
          <button type="button" className="btn-glass px-3.5 py-2 rounded-xl text-dash-body font-medium flex items-center gap-2" onClick={onLogout}>
            <FontAwesomeIcon icon={faArrowRightFromBracket} className="text-dash-body" style={{ color: "#475569" }} />
            <span className="text-dash-body" style={{ color: "#94a3b8" }}>
              Sair
            </span>
          </button>
        )}
      </div>
    </header>
  );
}
