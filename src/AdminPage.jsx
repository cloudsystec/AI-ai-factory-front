import React, { useCallback, useEffect, useState } from "react";
import { apiFetch } from "./api.js";
import { useOptionalAdminTenant } from "./context/AdminTenantContext.jsx";
import { AGENT_ROLE_KEYS } from "./agentRoleKeys.js";
import AppSubpagePanel from "./components/AppSubpagePanel.jsx";
import GlassSelect from "./components/GlassSelect.jsx";

/**
 * Admin plataforma — templates e overrides de agentes.
 */
export default function AdminPage({ embedded = false }) {
  const adminCtx = useOptionalAdminTenant();
  const useAdminTenantCtx = embedded && adminCtx;
  const [tenants, setTenants] = useState([]);
  const [tenantId, setTenantId] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectSlug, setProjectSlug] = useState("");
  const [mode, setMode] = useState("templates");
  const [roleKey, setRoleKey] = useState("global");
  const [content, setContent] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const loadTenants = useCallback(async () => {
    if (useAdminTenantCtx) return;
    const res = await apiFetch("/admin/tenants");
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    setTenants(data.tenants || []);
    if (data.tenants?.[0]) {
      setTenantId((prev) => prev || data.tenants[0].id);
    }
  }, [useAdminTenantCtx]);

  const activeTenantId = useAdminTenantCtx ? adminCtx.tenantId : tenantId;

  const loadProjects = useCallback(async () => {
    if (!activeTenantId) {
      setProjects([]);
      setProjectSlug("");
      return;
    }
    const res = await apiFetch(`/admin/tenants/${activeTenantId}/projects`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const list = data.projects || [];
    setProjects(list);
    setProjectSlug((prev) => {
      if (prev && list.some((p) => p.slug === prev)) return prev;
      return list[0]?.slug || "";
    });
  }, [activeTenantId]);

  const loadContent = useCallback(async () => {
    setError(null);
    setMessage(null);
    const path =
      mode === "templates"
        ? `/admin/agent-templates`
        : `/admin/tenants/${activeTenantId}/projects/${encodeURIComponent(projectSlug)}/agents`;
    const res = await apiFetch(path);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const list = mode === "templates" ? data.templates : data.overrides;
    const row = (list || []).find((r) => r.role_key === roleKey);
    setContent(row?.content || "");
  }, [mode, activeTenantId, projectSlug, roleKey]);

  useEffect(() => {
    loadTenants().catch((e) => setError(e.message));
  }, [loadTenants]);

  useEffect(() => {
    if (mode === "project" && activeTenantId) {
      loadProjects().catch((e) => setError(e.message));
    }
  }, [mode, activeTenantId, loadProjects]);

  useEffect(() => {
    if (mode === "templates") {
      loadContent().catch((e) => setError(e.message));
      return;
    }
    if (mode === "project" && activeTenantId && projectSlug) {
      loadContent().catch((e) => setError(e.message));
    }
  }, [loadContent, mode, activeTenantId, projectSlug]);

  async function handleSave(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const url =
        mode === "templates"
          ? `/admin/agent-templates/${roleKey}`
          : `/admin/tenants/${activeTenantId}/projects/${encodeURIComponent(projectSlug)}/agents/${roleKey}`;
      const res = await apiFetch(url, {
        method: "PUT",
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || res.statusText);
      }
      setMessage(
        mode === "project"
          ? "Salvo. O próximo job deste projeto sincroniza para workspaces/<slug>/agents/."
          : "Template guardado (projetos novos herdam no clone inicial)."
      );
    } catch (err) {
      setError(err.message || String(err));
    }
  }

  async function handleReset() {
    if (!activeTenantId || !projectSlug) return;
    if (
      !window.confirm(
        `Restaurar agentes do projeto "${projectSlug}" aos templates da plataforma?`
      )
    ) {
      return;
    }
    setError(null);
    const res = await apiFetch(
      `/admin/tenants/${activeTenantId}/projects/${encodeURIComponent(projectSlug)}/agents/reset`,
      { method: "POST" }
    );
    if (!res.ok) throw new Error(await res.text());
    setMessage("Agentes do projeto repostos aos templates.");
    await loadContent();
  }

  const inner = (
    <>
      <div className="admin-page__toolbar">
        <label className="admin-page__field">
          <span className="admin-page__label">Modo</span>
          <GlassSelect value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="templates">Templates plataforma</option>
            <option value="project">Overrides por projeto</option>
          </GlassSelect>
        </label>
        {mode === "project" && (
          <>
            {!useAdminTenantCtx && (
            <label className="admin-page__field">
              <span className="admin-page__label">Tenant</span>
              <GlassSelect
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name || t.email}
                  </option>
                ))}
              </GlassSelect>
            </label>
            )}
            <label className="admin-page__field">
              <span className="admin-page__label">Projeto</span>
              <GlassSelect
                value={projectSlug}
                onChange={(e) => setProjectSlug(e.target.value)}
                disabled={projects.length === 0}
              >
                {projects.length === 0 ? (
                  <option value="">Sem projetos</option>
                ) : (
                  projects.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.slug}
                    </option>
                  ))
                )}
              </GlassSelect>
            </label>
          </>
        )}
        <label className="admin-page__field">
          <span className="admin-page__label">Role</span>
          <GlassSelect value={roleKey} onChange={(e) => setRoleKey(e.target.value)}>
            {AGENT_ROLE_KEYS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </GlassSelect>
        </label>
        {mode === "project" && projectSlug && (
          <button type="button" className="toolbar-btn" onClick={handleReset}>
            Restaurar defaults do projeto
          </button>
        )}
      </div>

      {error && <p className="msg msg--error">{error}</p>}
      {message && <p className="msg msg--muted">{message}</p>}

      <form className="admin-editor" onSubmit={handleSave}>
        <label className="form-field__label" htmlFor="admin-agent-content">
          Conteúdo do prompt ({roleKey})
        </label>
        <textarea
          id="admin-agent-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={24}
          spellCheck={false}
          placeholder="Markdown do agente…"
        />
        <div className="new-project-form__actions">
          <button
            type="submit"
            className="toolbar-btn toolbar-btn--primary"
            disabled={mode === "project" && !projectSlug}
          >
            Salvar
          </button>
        </div>
      </form>
    </>
  );

  if (embedded) {
    return (
      <div className="admin-page admin-page--embedded">
        {inner}
      </div>
    );
  }

  return (
    <AppSubpagePanel
      className="admin-page"
      eyebrow="Plataforma"
      title="Admin — Agentes"
      subtitle="Templates globais e overrides por projeto."
    >
      {inner}
    </AppSubpagePanel>
  );
}
