import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faBrain,
  faMicrochip,
  faRobot,
  faUsers,
  faChevronDown,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { AdminTenantProvider, useAdminTenant } from "../../context/AdminTenantContext.jsx";
import GlassSelect from "../GlassSelect.jsx";
import UsersPage from "../../UsersPage.jsx";
import AdminWorkersPage from "../../AdminWorkersPage.jsx";
import AdminPage from "../../AdminPage.jsx";
import AdminIaDefaultPage from "./AdminIaDefaultPage.jsx";
import AdminIaTenantsPage from "./AdminIaTenantsPage.jsx";

const SECTIONS = [
  { key: "users", label: "Usuários", icon: faUsers },
  { key: "bots", label: "Bots", icon: faRobot },
  { key: "agents", label: "Agentes", icon: faMicrochip },
  {
    key: "ia",
    label: "IA",
    icon: faBrain,
    children: [
      { key: "ia-default", label: "Default" },
      { key: "ia-tenants", label: "Tenants" },
    ],
  },
];

function isIaSection(section) {
  return section === "ia-default" || section === "ia-tenants";
}

function AdminShellInner({ initialSection = "users" }) {
  const [section, setSection] = useState(initialSection);
  const [iaExpanded, setIaExpanded] = useState(isIaSection(initialSection));
  const { tenants, tenantId, setTenantId, selectedTenant, loading, error } =
    useAdminTenant();

  function selectSection(key) {
    setSection(key);
    if (isIaSection(key)) setIaExpanded(true);
  }

  const showTenantSelector = !isIaSection(section) || section === "ia-tenants";

  return (
    <div className="admin-shell">
      <aside className="admin-shell__sidebar" aria-label="Menu admin">
        <p className="admin-shell__sidebar-title">Admin</p>
        <nav className="admin-shell__nav">
          {SECTIONS.map((item) => {
            if (item.children) {
              const groupActive = isIaSection(section);
              return (
                <div key={item.key} className="admin-shell__nav-group">
                  <button
                    type="button"
                    className={`admin-shell__nav-btn admin-shell__nav-btn--group${
                      groupActive ? " admin-shell__nav-btn--active" : ""
                    }`}
                    onClick={() => setIaExpanded((v) => !v)}
                    aria-expanded={iaExpanded}
                  >
                    <FontAwesomeIcon icon={item.icon} aria-hidden />
                    <span className="admin-shell__nav-label">{item.label}</span>
                    <FontAwesomeIcon
                      icon={iaExpanded ? faChevronDown : faChevronRight}
                      className="admin-shell__nav-chevron"
                      aria-hidden
                    />
                  </button>
                  {iaExpanded && (
                    <div className="admin-shell__nav-sub">
                      {item.children.map((child) => (
                        <button
                          key={child.key}
                          type="button"
                          className={`admin-shell__nav-btn admin-shell__nav-btn--sub${
                            section === child.key
                              ? " admin-shell__nav-btn--active"
                              : ""
                          }`}
                          onClick={() => selectSection(child.key)}
                        >
                          {child.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <button
                key={item.key}
                type="button"
                className={`admin-shell__nav-btn${
                  section === item.key ? " admin-shell__nav-btn--active" : ""
                }`}
                onClick={() => selectSection(item.key)}
              >
                <FontAwesomeIcon icon={item.icon} aria-hidden />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="admin-shell__main">
        <header className="admin-shell__header">
          <div className="admin-shell__header-icon" aria-hidden>
            <FontAwesomeIcon icon={faBuilding} />
          </div>
          {showTenantSelector ? (
            <>
              <label className="admin-shell__tenant-field">
                <span className="admin-shell__tenant-label">Empresa</span>
                <GlassSelect
                  wrapClassName="glass-select-wrap--fluid"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  disabled={loading || tenants.length === 0}
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name || t.email}
                      {t.isBlocked || t.blocked_at ? " (bloqueada)" : ""}
                    </option>
                  ))}
                </GlassSelect>
              </label>
              {selectedTenant && (
                <span className="admin-shell__tenant-meta">
                  {selectedTenant.email}
                </span>
              )}
            </>
          ) : (
            <span className="admin-shell__tenant-meta admin-shell__tenant-meta--global">
              Configuração global — não depende de empresa
            </span>
          )}
        </header>

        {error && <p className="msg msg--error admin-shell__error">{error}</p>}

        <div className="admin-shell__content custom-scrollbar">
          {section === "users" && <UsersPage embedded />}
          {section === "bots" && <AdminWorkersPage embedded />}
          {section === "agents" && <AdminPage embedded />}
          {section === "ia-default" && <AdminIaDefaultPage />}
          {section === "ia-tenants" && <AdminIaTenantsPage />}
        </div>
      </div>
    </div>
  );
}

/**
 * Shell unificado do admin da plataforma (sidebar + empresa persistente).
 */
export default function AdminShell({ initialSection = "users" }) {
  return (
    <AdminTenantProvider>
      <AdminShellInner initialSection={initialSection} />
    </AdminTenantProvider>
  );
}
