import React from "react";

/**
 * @param {{
 *   tenantName?: string,
 *   email?: string,
 *   runningCount?: number,
 *   canManageUsers?: boolean,
 *   canExecute?: boolean,
 *   isPlatformAdmin?: boolean,
 *   onUsers?: () => void,
 *   onAgents?: () => void,
 *   onAdminWorkers?: () => void,
 *   onAdmin?: () => void,
 *   onLogout?: () => void,
 * }} props
 */
export default function AppHeader({
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
}) {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <h1>{tenantName || "DevForLess"}</h1>
        <p>{email || "Acompanhe o planejamento e o progresso das entregas."}</p>
      </div>
      <div className="app-header__actions">
        <div
          className={`app-header__pill app-header__pill--live${
            runningCount > 0 ? "" : " app-header__pill--idle"
          }`}
        >
          <span className="pipeline-live-badge__dot" aria-hidden />
          {runningCount > 0 ? `${runningCount} em execução` : "Sistema activo"}
        </div>
        {(canManageUsers || isPlatformAdmin) && onUsers && (
          <button type="button" className="toolbar-btn" onClick={onUsers}>
            Usuários
          </button>
        )}
        {canExecute && onAgents && (
          <button type="button" className="toolbar-btn" onClick={onAgents}>
            Agentes
          </button>
        )}
        {isPlatformAdmin && onAdminWorkers && (
          <button type="button" className="toolbar-btn" onClick={onAdminWorkers}>
            Bots
          </button>
        )}
        {isPlatformAdmin && onAdmin && (
          <button type="button" className="toolbar-btn" onClick={onAdmin}>
            Admin
          </button>
        )}
        {onLogout && (
          <button type="button" className="toolbar-btn" onClick={onLogout}>
            Sair
          </button>
        )}
      </div>
    </header>
  );
}
