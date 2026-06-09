import React, { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "./api.js";
import { useCapabilities, useSession } from "./SessionContext.jsx";
import AppSubpagePanel from "./components/AppSubpagePanel.jsx";
import AppModal from "./components/AppModal.jsx";

const ROLE_LABELS = {
  executor: "Executor",
  auditor: "Auditor",
  viewer: "Visualizador",
};

/**
 * @param {boolean} isPlatformAdmin
 * @param {string} tenantId
 */
function usersApiBase(isPlatformAdmin, tenantId) {
  if (isPlatformAdmin && tenantId) {
    return `/admin/tenants/${tenantId}/users`;
  }
  return "/api/tenant-users";
}

/**
 * Gestão de usuários da empresa (dentro do dashboard).
 */
export default function UsersPage() {
  const caps = useCapabilities();
  const { isPlatformAdmin, session } = useSession();

  const [tenants, setTenants] = useState([]);
  const [tenantId, setTenantId] = useState(session?.tenantId || "");
  const [users, setUsers] = useState([]);
  const [usersUsed, setUsersUsed] = useState(0);
  const [usersMax, setUsersMax] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createRole, setCreateRole] = useState(
    isPlatformAdmin ? "auditor" : "executor"
  );
  const [createPassword, setCreatePassword] = useState("");

  const [editUser, setEditUser] = useState(null);
  const [editRole, setEditRole] = useState("executor");
  const [editPassword, setEditPassword] = useState("");

  const [showCreateTenant, setShowCreateTenant] = useState(false);
  const [newTenantEmail, setNewTenantEmail] = useState("");
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantPlan, setNewTenantPlan] = useState("starter");
  const [newAuditorEmail, setNewAuditorEmail] = useState("");
  const [newAuditorPassword, setNewAuditorPassword] = useState("");

  const creatableRoles = useMemo(() => {
    if (isPlatformAdmin) {
      return ["auditor", "executor", "viewer"];
    }
    return ["executor", "viewer"];
  }, [isPlatformAdmin]);

  const canAddUser = isPlatformAdmin
    ? usersUsed < usersMax
    : caps.canAddUser;

  const canOpenPage = caps.canManageUsers || isPlatformAdmin;

  const loadTenants = useCallback(async () => {
    if (!isPlatformAdmin) return;
    const res = await apiFetch("/admin/tenants");
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    const list = data.tenants || [];
    setTenants(list);
    setTenantId((prev) => {
      if (prev && list.some((t) => t.id === prev)) return prev;
      return list[0]?.id || prev;
    });
  }, [isPlatformAdmin]);

  const loadUsers = useCallback(async () => {
    if (!tenantId) {
      setUsers([]);
      setLoading(false);
      return;
    }
    const base = usersApiBase(isPlatformAdmin, tenantId);
    const res = await apiFetch(base);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || res.statusText);
    }
    const data = await res.json();
    setUsers(data.users || []);
    setUsersUsed(data.usersUsed ?? 0);
    setUsersMax(data.usersMax ?? 5);
  }, [isPlatformAdmin, tenantId]);

  useEffect(() => {
    if (!canOpenPage) return;
    loadTenants().catch((e) => setError(e.message));
  }, [canOpenPage, loadTenants]);

  useEffect(() => {
    if (!canOpenPage) return;
    setLoading(true);
    setError(null);
    loadUsers()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [canOpenPage, loadUsers]);

  function clearFeedback() {
    setError(null);
    setMessage(null);
  }

  async function handleCreate(e) {
    e.preventDefault();
    clearFeedback();
    try {
      const base = usersApiBase(isPlatformAdmin, tenantId);
      const res = await apiFetch(base, {
        method: "POST",
        body: JSON.stringify({
          email: createEmail,
          role: createRole,
          password: createPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      setMessage("Usuário criado com sucesso.");
      setCreateEmail("");
      setCreatePassword("");
      setShowCreate(false);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  function openEdit(user) {
    setEditUser(user);
    setEditRole(user.role);
    setEditPassword("");
    clearFeedback();
  }

  function closeEdit() {
    setEditUser(null);
    setEditPassword("");
  }

  function canEditUser(user) {
    if (isPlatformAdmin) return true;
    return user.role === "executor" || user.role === "viewer";
  }

  function canDeleteUser(user) {
    if (user.role === "auditor" && !isPlatformAdmin) return false;
    return canEditUser(user) || isPlatformAdmin;
  }

  function canSetPasswordFor(user) {
    if (isPlatformAdmin) return true;
    return user.role === "executor" || user.role === "viewer";
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if (!editUser) return;
    clearFeedback();
    const base = usersApiBase(isPlatformAdmin, tenantId);
    try {
      if (editRole !== editUser.role) {
        const res = await apiFetch(`${base}/${editUser.id}`, {
          method: "PATCH",
          body: JSON.stringify({ role: editRole }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || res.statusText);
      }

      if (editPassword.length >= 6 && canSetPasswordFor(editUser)) {
        const res = await apiFetch(`${base}/${editUser.id}/password`, {
          method: "PUT",
          body: JSON.stringify({ password: editPassword }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || res.statusText);
      }

      setMessage("Alterações guardadas.");
      closeEdit();
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(user) {
    if (!window.confirm(`Remover ${user.email}?`)) return;
    clearFeedback();
    try {
      const base = usersApiBase(isPlatformAdmin, tenantId);
      const res = await apiFetch(`${base}/${user.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      setMessage("Usuário removido.");
      if (editUser?.id === user.id) closeEdit();
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateTenant(e) {
    e.preventDefault();
    clearFeedback();
    try {
      const res = await apiFetch("/admin/tenants", {
        method: "POST",
        body: JSON.stringify({
          email: newTenantEmail,
          name: newTenantName,
          planId: newTenantPlan,
          auditorEmail: newAuditorEmail,
          auditorPassword: newAuditorPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      setMessage(`Empresa "${data.tenant?.name || newTenantName}" criada com sucesso.`);
      setShowCreateTenant(false);
      setNewTenantEmail("");
      setNewTenantName("");
      setNewTenantPlan("starter");
      setNewAuditorEmail("");
      setNewAuditorPassword("");
      await loadTenants();
      if (data.tenant?.id) setTenantId(data.tenant.id);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!canOpenPage) {
    return (
      <AppSubpagePanel className="users-page" title="Usuários">
        <p className="msg msg--error">Sem permissão para gerenciar usuários.</p>
      </AppSubpagePanel>
    );
  }

  const selectedTenant = tenants.find((t) => t.id === tenantId);

  return (
    <AppSubpagePanel
      className="users-page"
      eyebrow="Equipe"
      title="Usuários"
      subtitle={
        isPlatformAdmin
          ? "Gerenciamento da equipe por empresa (admin plataforma)"
          : "Equipe da sua empresa"
      }
      headerActions={
        <span className="users-page__quota" title="Quota do plano">
          {usersUsed} / {usersMax}
        </span>
      }
    >

      {isPlatformAdmin && (
        <>
          <div className="users-page__toolbar">
            <label className="users-page__field">
              <span className="users-page__label">Empresa (tenant)</span>
              <select
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name || t.email}
                  </option>
                ))}
              </select>
            </label>
            {selectedTenant && (
              <span className="users-page__meta">
                Plano: {selectedTenant.plan_id || "—"}
              </span>
            )}
            <button
              type="button"
              className="toolbar-btn toolbar-btn--primary"
              onClick={() => setShowCreateTenant((v) => !v)}
            >
              {showCreateTenant ? "Cancelar" : "+ Nova empresa"}
            </button>
          </div>

          {showCreateTenant && (
            <form className="users-form-card" onSubmit={handleCreateTenant}>
              <h3 style={{ margin: "0 0 8px" }}>Nova empresa</h3>
              <div className="users-form-card__grid">
                <label>
                  Email da empresa
                  <input
                    type="email"
                    value={newTenantEmail}
                    onChange={(e) => setNewTenantEmail(e.target.value)}
                    required
                    placeholder="empresa@exemplo.com"
                  />
                </label>
                <label>
                  Nome da empresa
                  <input
                    type="text"
                    value={newTenantName}
                    onChange={(e) => setNewTenantName(e.target.value)}
                    required
                    placeholder="Acme Corp"
                  />
                </label>
                <label>
                  Plano
                  <select
                    value={newTenantPlan}
                    onChange={(e) => setNewTenantPlan(e.target.value)}
                  >
                    <option value="starter">Starter</option>
                    <option value="team">Team</option>
                    <option value="scale">Scale</option>
                    <option value="business">Business</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </label>
              </div>
              <h4 style={{ margin: "12px 0 4px" }}>Primeiro auditor</h4>
              <div className="users-form-card__grid">
                <label>
                  Email do auditor
                  <input
                    type="email"
                    value={newAuditorEmail}
                    onChange={(e) => setNewAuditorEmail(e.target.value)}
                    required
                    placeholder="auditor@exemplo.com"
                  />
                </label>
                <label>
                  Senha do auditor
                  <input
                    type="password"
                    value={newAuditorPassword}
                    onChange={(e) => setNewAuditorPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </label>
              </div>
              <button
                type="submit"
                className="toolbar-btn toolbar-btn--primary"
                style={{ marginTop: 8 }}
              >
                Criar empresa
              </button>
            </form>
          )}
        </>
      )}

      {error && <p className="msg msg--error">{error}</p>}
      {message && <p className="msg msg--ok">{message}</p>}

      <div className="users-page__main">
        <section className="users-panel">
          <div className="users-panel__head">
            <h2>Equipe</h2>
            {canAddUser && (
              <button
                type="button"
                className="toolbar-btn toolbar-btn--primary"
                onClick={() => setShowCreate((v) => !v)}
              >
                {showCreate ? "Cancelar" : "+ Novo usuário"}
              </button>
            )}
          </div>

          {showCreate && canAddUser && (
            <form className="users-form-card" onSubmit={handleCreate}>
              <div className="users-form-card__grid">
                <label>
                  Email
                  <input
                    type="email"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Papel
                  <select
                    value={createRole}
                    onChange={(e) => setCreateRole(e.target.value)}
                  >
                    {creatableRoles.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Senha inicial
                  <input
                    type="password"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </label>
              </div>
              <button
                type="submit"
                className="toolbar-btn toolbar-btn--primary"
              >
                Criar usuário
              </button>
            </form>
          )}

          {loading ? (
            <p className="msg msg--muted">Carregando…</p>
          ) : users.length === 0 ? (
            <p className="msg msg--muted">Nenhum usuário neste tenant.</p>
          ) : (
            <div className="users-table-wrap">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Papel</th>
                    <th>Estado</th>
                    <th aria-label="Ações" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="users-table__email">{u.email}</td>
                      <td>
                        <span className={`users-badge users-badge--${u.role}`}>
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td className="users-table__status">
                        <span
                          className={
                            u.hasPassword
                              ? "users-status users-status--ok"
                              : "users-status users-status--warn"
                          }
                        >
                          Senha {u.hasPassword ? "ok" : "pendente"}
                        </span>
                      </td>
                      <td className="users-table__actions">
                        {canEditUser(u) && (
                          <button
                            type="button"
                            className="toolbar-btn"
                            onClick={() => openEdit(u)}
                          >
                            Editar
                          </button>
                        )}
                        {canDeleteUser(u) && (
                          <button
                            type="button"
                            className="toolbar-btn toolbar-btn--danger"
                            onClick={() => handleDelete(u)}
                          >
                            Remover
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>

      {editUser && (
        <AppModal
          variant="form"
          panelClassName="users-modal"
          eyebrow="Administração"
          title="Editar usuário"
          titleId="edit-user-title"
          subtitle={editUser.email}
          subtitleClassName="users-modal__email"
          onClose={closeEdit}
        >
          <form className="modal-panel__body users-modal__form" onSubmit={handleSaveEdit}>
              <label>
                Papel
                {!isPlatformAdmin && editUser.role === "auditor" ? (
                  <input type="text" readOnly value={ROLE_LABELS.auditor} />
                ) : (
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                  >
                    {(isPlatformAdmin
                      ? ["auditor", "executor", "viewer"]
                      : creatableRoles
                    ).map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                )}
              </label>

              {canSetPasswordFor(editUser) && (
                <label>
                  Nova senha (opcional, mín. 6)
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="Deixe vazio para não alterar"
                  />
                </label>
              )}

              <div className="users-modal__actions">
                <button
                  type="button"
                  className="toolbar-btn"
                  onClick={closeEdit}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="toolbar-btn toolbar-btn--primary"
                >
                  Salvar
                </button>
              </div>
            </form>
        </AppModal>
      )}
    </AppSubpagePanel>
  );
}
