import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faPen,
  faPlus,
  faTrash,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { apiFetch } from "./api.js";
import { useCapabilities, useSession } from "./SessionContext.jsx";
import AppSubpagePanel from "./components/AppSubpagePanel.jsx";
import AppModal from "./components/AppModal.jsx";
import GlassSelect from "./components/GlassSelect.jsx";

const ROLE_LABELS = {
  executor: "Executor",
  auditor: "Auditor",
  viewer: "Visualizador",
};

const PLAN_LABELS = {
  starter: "Starter",
  team: "Team",
  scale: "Scale",
  business: "Business",
  enterprise: "Enterprise",
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

function userInitial(email) {
  const ch = String(email || "?").trim()[0];
  return ch ? ch.toUpperCase() : "?";
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

  function closeCreate() {
    setShowCreate(false);
    setCreateEmail("");
    setCreatePassword("");
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
      closeCreate();
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
  const quotaPct = usersMax > 0 ? Math.min(100, (usersUsed / usersMax) * 100) : 0;

  return (
    <AppSubpagePanel
      className="users-page admin-mgmt-page"
      eyebrow="Equipe"
      title="Usuários"
      subtitle={
        isPlatformAdmin
          ? "Gerenciamento da equipe por empresa"
          : "Membros com acesso à sua empresa"
      }
      headerActions={
        <span className="admin-mgmt__quota" title="Quota do plano">
          <FontAwesomeIcon icon={faUsers} aria-hidden />
          {usersUsed} / {usersMax}
        </span>
      }
    >
      <div className="admin-mgmt">
        {(error || message) && (
          <div className="admin-mgmt__alerts" role="status">
            {error && <p className="msg msg--error">{error}</p>}
            {message && <p className="msg msg--ok">{message}</p>}
          </div>
        )}

        {isPlatformAdmin && (
          <section className="admin-mgmt__company">
            <div className="admin-mgmt__company-bar">
              <div className="admin-mgmt__company-icon" aria-hidden>
                <FontAwesomeIcon icon={faBuilding} />
              </div>
              <div className="admin-mgmt__company-main">
                <label className="admin-mgmt__field admin-mgmt__field--grow">
                  <span className="admin-mgmt__label">Empresa</span>
                  <GlassSelect
                    wrapClassName="glass-select-wrap--fluid"
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
                {selectedTenant && (
                  <div className="admin-mgmt__chips">
                    <span className="admin-mgmt__chip">
                      Plano{" "}
                      {PLAN_LABELS[selectedTenant.plan_id] ||
                        selectedTenant.plan_id ||
                        "—"}
                    </span>
                    <span className="admin-mgmt__chip admin-mgmt__chip--teal">
                      {usersUsed}/{usersMax} usuários
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                className={`toolbar-btn${showCreateTenant ? "" : " toolbar-btn--primary"}`}
                onClick={() => setShowCreateTenant((v) => !v)}
              >
                <FontAwesomeIcon icon={faPlus} aria-hidden />
                {showCreateTenant ? "Cancelar" : "Nova empresa"}
              </button>
            </div>

            {showCreateTenant && (
              <form className="admin-form-card" onSubmit={handleCreateTenant}>
                <header className="admin-form-card__header">
                  <div>
                    <h3 className="admin-form-card__title">Nova empresa</h3>
                    <p className="admin-form-card__desc">
                      Cria o tenant, plano e o primeiro auditor de acesso.
                    </p>
                  </div>
                </header>

                <div className="admin-form-card__section">
                  <p className="admin-form-card__section-label">Dados da empresa</p>
                  <div className="admin-form-card__grid">
                    <label className="admin-mgmt__field">
                      <span className="admin-mgmt__label">Email da empresa</span>
                      <input
                        className="admin-mgmt__input"
                        type="email"
                        value={newTenantEmail}
                        onChange={(e) => setNewTenantEmail(e.target.value)}
                        required
                        placeholder="empresa@exemplo.com"
                      />
                    </label>
                    <label className="admin-mgmt__field">
                      <span className="admin-mgmt__label">Nome da empresa</span>
                      <input
                        className="admin-mgmt__input"
                        type="text"
                        value={newTenantName}
                        onChange={(e) => setNewTenantName(e.target.value)}
                        required
                        placeholder="Acme Corp"
                      />
                    </label>
                    <label className="admin-mgmt__field">
                      <span className="admin-mgmt__label">Plano</span>
                      <GlassSelect
                        value={newTenantPlan}
                        onChange={(e) => setNewTenantPlan(e.target.value)}
                      >
                        {Object.entries(PLAN_LABELS).map(([id, label]) => (
                          <option key={id} value={id}>
                            {label}
                          </option>
                        ))}
                      </GlassSelect>
                    </label>
                  </div>
                </div>

                <div className="admin-form-card__section">
                  <p className="admin-form-card__section-label">Primeiro auditor</p>
                  <div className="admin-form-card__grid">
                    <label className="admin-mgmt__field">
                      <span className="admin-mgmt__label">Email do auditor</span>
                      <input
                        className="admin-mgmt__input"
                        type="email"
                        value={newAuditorEmail}
                        onChange={(e) => setNewAuditorEmail(e.target.value)}
                        required
                        placeholder="auditor@exemplo.com"
                      />
                    </label>
                    <label className="admin-mgmt__field">
                      <span className="admin-mgmt__label">Senha do auditor</span>
                      <input
                        className="admin-mgmt__input"
                        type="password"
                        value={newAuditorPassword}
                        onChange={(e) => setNewAuditorPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete="new-password"
                      />
                    </label>
                  </div>
                </div>

                <footer className="admin-form-card__footer">
                  <button type="submit" className="toolbar-btn toolbar-btn--primary">
                    Criar empresa
                  </button>
                </footer>
              </form>
            )}
          </section>
        )}

        <section className="admin-mgmt__panel">
          <header className="admin-mgmt__panel-head">
            <div className="admin-mgmt__panel-intro">
              <h2 className="admin-mgmt__panel-title">Equipe</h2>
              <p className="admin-mgmt__panel-desc">
                {isPlatformAdmin && selectedTenant
                  ? `Usuários de ${selectedTenant.name || selectedTenant.email}`
                  : "Gerencie quem pode executar, auditar ou visualizar projetos"}
              </p>
            </div>
            <div className="admin-mgmt__panel-actions">
              <div className="admin-mgmt__quota-bar" title="Utilização da quota">
                <div
                  className="admin-mgmt__quota-fill"
                  style={{ width: `${quotaPct}%` }}
                />
              </div>
              {canAddUser && (
                <button
                  type="button"
                  className="toolbar-btn toolbar-btn--primary"
                  onClick={() => {
                    clearFeedback();
                    setShowCreate(true);
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} aria-hidden />
                  Novo usuário
                </button>
              )}
            </div>
          </header>

          {loading ? (
            <p className="msg msg--muted admin-mgmt__empty">Carregando…</p>
          ) : users.length === 0 ? (
            <p className="msg msg--muted admin-mgmt__empty">
              Nenhum usuário nesta empresa.
            </p>
          ) : (
            <div className="admin-table-wrap custom-scrollbar">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Usuário</th>
                    <th>Papel</th>
                    <th>Estado</th>
                    <th aria-label="Ações" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="admin-table__user">
                          <span className="admin-table__avatar" aria-hidden>
                            {userInitial(u.email)}
                          </span>
                          <span className="admin-table__email">{u.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-badge admin-badge--${u.role}`}>
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`admin-status admin-status--${
                            u.hasPassword ? "ok" : "warn"
                          }`}
                        >
                          {u.hasPassword ? "Senha configurada" : "Senha pendente"}
                        </span>
                      </td>
                      <td className="admin-table__actions">
                        {canEditUser(u) && (
                          <button
                            type="button"
                            className="admin-table__icon-btn"
                            onClick={() => openEdit(u)}
                            title="Editar usuário"
                          >
                            <FontAwesomeIcon icon={faPen} aria-hidden />
                            <span>Editar</span>
                          </button>
                        )}
                        {canDeleteUser(u) && (
                          <button
                            type="button"
                            className="admin-table__icon-btn admin-table__icon-btn--danger"
                            onClick={() => handleDelete(u)}
                            title="Remover usuário"
                          >
                            <FontAwesomeIcon icon={faTrash} aria-hidden />
                            <span>Remover</span>
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

      {showCreate && canAddUser && (
        <AppModal
          variant="form"
          panelClassName="admin-modal"
          eyebrow="Equipe"
          title="Novo usuário"
          titleId="create-user-title"
          subtitle="Convide alguém para acessar a plataforma nesta empresa"
          onClose={closeCreate}
        >
          <form className="admin-modal__form" onSubmit={handleCreate}>
            <label className="admin-mgmt__field">
              <span className="admin-mgmt__label">Email</span>
              <input
                className="admin-mgmt__input"
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                required
                placeholder="usuario@empresa.com"
                autoFocus
              />
            </label>
            <GlassSelect
              label="Papel"
              fieldClassName="admin-mgmt__field"
              labelClassName="admin-mgmt__label"
              value={createRole}
              onChange={(e) => setCreateRole(e.target.value)}
            >
              {creatableRoles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </GlassSelect>
            <label className="admin-mgmt__field">
              <span className="admin-mgmt__label">Senha inicial</span>
              <input
                className="admin-mgmt__input"
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
              />
            </label>
            <footer className="admin-modal__footer">
              <button type="button" className="toolbar-btn" onClick={closeCreate}>
                Cancelar
              </button>
              <button type="submit" className="toolbar-btn toolbar-btn--primary">
                Criar usuário
              </button>
            </footer>
          </form>
        </AppModal>
      )}

      {editUser && (
        <AppModal
          variant="form"
          panelClassName="admin-modal"
          eyebrow="Equipe"
          title="Editar usuário"
          titleId="edit-user-title"
          subtitle={editUser.email}
          subtitleClassName="admin-modal__subtitle"
          onClose={closeEdit}
        >
          <form className="admin-modal__form" onSubmit={handleSaveEdit}>
            <div className="admin-modal__user-preview">
              <span className="admin-table__avatar admin-table__avatar--lg" aria-hidden>
                {userInitial(editUser.email)}
              </span>
              <div>
                <p className="admin-modal__user-email">{editUser.email}</p>
                <span className={`admin-badge admin-badge--${editUser.role}`}>
                  {ROLE_LABELS[editUser.role] || editUser.role}
                </span>
              </div>
            </div>

            <label className="admin-mgmt__field">
              <span className="admin-mgmt__label">Papel</span>
              {!isPlatformAdmin && editUser.role === "auditor" ? (
                <input
                  className="admin-mgmt__input"
                  type="text"
                  readOnly
                  value={ROLE_LABELS.auditor}
                />
              ) : (
                <GlassSelect
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
                </GlassSelect>
              )}
            </label>

            {canSetPasswordFor(editUser) && (
              <label className="admin-mgmt__field">
                <span className="admin-mgmt__label">Nova senha (opcional)</span>
                <input
                  className="admin-mgmt__input"
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Deixe vazio para não alterar"
                />
                <span className="admin-mgmt__hint">Mínimo 6 caracteres</span>
              </label>
            )}

            <footer className="admin-modal__footer">
              <button type="button" className="toolbar-btn" onClick={closeEdit}>
                Cancelar
              </button>
              <button type="submit" className="toolbar-btn toolbar-btn--primary">
                Salvar alterações
              </button>
            </footer>
          </form>
        </AppModal>
      )}
    </AppSubpagePanel>
  );
}
