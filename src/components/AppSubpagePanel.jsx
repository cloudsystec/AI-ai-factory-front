import React from "react";

/**
 * Painel de conteúdo abaixo do header fixo do dashboard.
 * @param {{
 *   eyebrow?: React.ReactNode,
 *   title: React.ReactNode,
 *   subtitle?: React.ReactNode,
 *   headerActions?: React.ReactNode,
 *   children: React.ReactNode,
 *   className?: string,
 * }} props
 */
export default function AppSubpagePanel({
  eyebrow,
  title,
  subtitle,
  headerActions,
  children,
  className = "",
}) {
  return (
    <div
      className={`app-subpage glass-panel rounded-2xl flex flex-col flex-1 min-h-0 overflow-hidden ${className}`.trim()}
    >
      <header className="app-subpage__header">
        <div className="app-subpage__header-text min-w-0">
          {eyebrow ? (
            <p className="app-subpage__eyebrow dash-section-label">{eyebrow}</p>
          ) : null}
          <h1 className="app-subpage__title">{title}</h1>
          {subtitle ? <p className="app-subpage__subtitle">{subtitle}</p> : null}
        </div>
        {headerActions ? (
          <div className="app-subpage__header-actions">{headerActions}</div>
        ) : null}
      </header>
      <div className="app-subpage__body custom-scrollbar">{children}</div>
    </div>
  );
}
