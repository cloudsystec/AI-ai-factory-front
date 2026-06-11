import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faLock,
  faLockOpen,
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
  const [workerSetupInfo, setWorkerSetupInfo] = useState(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createRole, setCreateRole] = useState(
    isPlatformAdmin ? "auditor" : "executor"
  );

  const [editUser, setEditUser] = useState(null);
  const [editRole, setEditRole] = useState("executor");
  const [actionLoading, setActionLoading] = useState(null);

  const [showCreateTenant, setShowCreateTenant] = useState(false);
  const [newTenantEmail, setNewTenantEmail] = useState("");
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantPlan, setNewTenantPlan] = useState("starter");
  const [newAuditorEmail, setNewAuditorEmail] = useState("");

  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState("payment");
  const [blockNote, setBlockNote] = useState("");
  const [blockLoading, setBlockLoading] = useState(false);

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
    setWorkerSetupInfo(null);
  }

  function closeCreate() {
    setShowCreate(false);
    setCreateEmail("");
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
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      setMessage("Usuário criado — senha temporária enviada por e-mail.");
      closeCreate();
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  function openEdit(user) {
    setEditUser(user);
    setEditRole(user.role);
    clearFeedback();
  }

  function closeEdit() {
    setEditUser(null);
  }

  function canEditUser(user) {
    if (isPlatformAdmin) return true;
    return user.role === "executor" || user.role === "viewer";
  }

  function canDeleteUser(user) {
    if (user.role === "auditor" && !isPlatformAdmin) return false;
    return canEditUser(user) || isPlatformAdmin;
  }

  function canManageSecurity(user) {
    if (user.id === session?.userId) return false;
    if (isPlatformAdmin) return true;
    return user.role === "executor" || user.role === "viewer";
  }

  async function handleUnlock(user) {
    clearFeedback();
    setActionLoading(`unlock-${user.id}`);
    try {
      const base = usersApiBase(isPlatformAdmin, tenantId);
      const res = await apiFetch(`${base}/${user.id}/unlock`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      setMessage(`Conta de ${user.email} desbloqueada.`);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResetTemporaryPassword(user) {
    if (
      !window.confirm(
        `Gerar nova senha temporária para ${user.email}? A senha será enviada por e-mail.`
      )
    ) {
      return;
    }
    clearFeedback();
    setActionLoading(`reset-${user.id}`);
    try {
      const base = usersApiBase(isPlatformAdmin, tenantId);
      const res = await apiFetch(`${base}/${user.id}/reset-temporary-password`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      setMessage("Senha temporária enviada por e-mail.");
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
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

  async function handleBlockTenant(e) {
    e.preventDefault();
    if (!tenantId) return;
    setBlockLoading(true);
    clearFeedback();
    try {
      const res = await apiFetch(`/admin/tenants/${tenantId}/block`, {
        method: "POST",
        body: JSON.stringify({ reason: blockReason, note: blockNote.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      setMessage("Empresa bloqueada. Usuários perderão acesso imediatamente.");
      setShowBlockModal(false);
      setBlockNote("");
      await loadTenants();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBlockLoading(false);
    }
  }

  async function handleUnblockTenant() {
    if (!tenantId) return;
    if (
      !window.confirm(
        "Desbloquear esta empresa? Os usuários voltarão a conseguir entrar."
      )
    ) {
      return;
    }
    clearFeedback();
    setBlockLoading(true);
    try {
      const res = await apiFetch(`/admin/tenants/${tenantId}/unblock`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      setMessage("Empresa desbloqueada.");
      await loadTenants();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBlockLoading(false);
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
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);

      const workerSetup = data.workerSetup || null;
      setWorkerSetupInfo(workerSetup);

      let successMsg = `Empresa "${data.tenant?.name || newTenantName}" criada com sucesso.`;
      if (workerSetup?.mode === "railway") {
        successMsg += " Worker enfileirado no Railway.";
      } else if (workerSetup?.mode === "local") {
        successMsg += workerSetup.started
          ? workerSetup.pending
            ? " Worker Docker em execução (build em andamento)."
            : " Worker Docker iniciado."
          : " Worker Docker não iniciou automaticamente — use o comando abaixo.";
      }
      setMessage(successMsg);
      setShowCreateTenant(false);
      setNewTenantEmail("");
      setNewTenantName("");
      setNewTenantPlan("starter");
      setNewAuditorEmail("");
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
        {(error || message || workerSetupInfo) && (
          <div className="admin-mgmt__alerts" role="status">
            {error && <p className="msg msg--error">{error}</p>}
            {message && <p className="msg msg--ok">{message}</p>}
            {workerSetupInfo && (
              <div className="admin-mgmt__worker-setup">
                {workerSetupInfo.mode === "railway" && (
                  <p className="admin-modal__hint">
                    Provisionamento Railway enfileirado. Acompanhe em Admin → Workers.
                  </p>
                )}
                {workerSetupInfo.mode === "local" && (
                  <>
                    {workerSetupInfo.envPath && (
                      <p className="admin-modal__hint">
                        Env: <code>{workerSetupInfo.envPath}</code>
                      </p>
                    )}
                    {workerSetupInfo.error && (
                      <p className="msg msg--error">{workerSetupInfo.error}</p>
                    )}
                    {workerSetupInfo.logPath && (
                      <p className="admin-modal__hint">
                        Log: <code>{workerSetupInfo.logPath}</code>
                      </p>
                    )}
                    {workerSetupInfo.command && (
                      <p className="admin-modal__hint">
                        Comando (na raiz do <code>ai-factory-cli</code>):
                        <br />
                        <code className="admin-mgmt__worker-cmd">
                          {workerSetupInfo.command}
                        </code>
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
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
                        {t.isBlocked || t.blocked_at ? " (bloqueada)" : ""}
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
                    {(selectedTenant.isBlocked || selectedTenant.blocked_at) && (
                      <span className="admin-mgmt__chip admin-mgmt__chip--danger">
                        Bloqueada
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="admin-mgmt__company-actions">
                {selectedTenant &&
                  (selectedTenant.isBlocked || selectedTenant.blocked_at ? (
                    <button
                      type="button"
                      className="toolbar-btn"
                      disabled={blockLoading}
                      onClick={handleUnblockTenant}
                    >
                      <FontAwesomeIcon icon={faLockOpen} aria-hidden />
                      Desbloquear empresa
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="toolbar-btn toolbar-btn--danger"
                      disabled={blockLoading}
                      onClick={() => {
                        setBlockReason("payment");
                        setBlockNote("");
                        setShowBlockModal(true);
                      }}
                    >
                      <FontAwesomeIcon icon={faLock} aria-hidden />
                      Bloquear empresa
                    </button>
                  ))}
                <button
                  type="button"
                  className={`toolbar-btn${showCreateTenant ? "" : " toolbar-btn--primary"}`}
                  onClick={() => setShowCreateTenant((v) => !v)}
                >
                  <FontAwesomeIcon icon={faPlus} aria-hidden />
                  {showCreateTenant ? "Cancelar" : "Nova empresa"}
                </button>
              </div>
            </div>

            {showCreateTenant && (
              <form className="admin-form-card" onSubmit={handleCreateTenant}>
                <header className="admin-form-card__header">
                  <div>
                    <h3 className="admin-form-card__title">Nova empresa</h3>
                    <p className="admin-form-card__desc">
                      Cria o tenant, plano e o primeiro auditor. A senha temporária
                      será enviada por e-mail.
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
                    <label className="admin-mgmt__field admin-mgmt__field--full">
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
                        <div className="admin-table__status-group">
                          {u.isLocked ? (
                            <span className="admin-status admin-status--danger">
                              Bloqueado
                            </span>
                          ) : (
                            <span className="admin-status admin-status--ok">
                              Ativo
                            </span>
                          )}
                          {u.passwordMustChange && (
                            <span className="admin-status admin-status--warn">
                              Troca de senha pendente
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="admin-table__actions">
                        {canManageSecurity(u) && u.isLocked && (
                          <button
                            type="button"
                            className="admin-table__icon-btn"
                            onClick={() => handleUnlock(u)}
                            disabled={actionLoading === `unlock-${u.id}`}
                            title="Desbloquear conta"
                          >
                            <span>Desbloquear</span>
                          </button>
                        )}
                        {canManageSecurity(u) && (
                          <button
                            type="button"
                            className="admin-table__icon-btn"
                            onClick={() => handleResetTemporaryPassword(u)}
                            disabled={actionLoading === `reset-${u.id}`}
                            title="Gerar senha temporária"
                          >
                            <span>Gerar senha temp.</span>
                          </button>
                        )}
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

      {showBlockModal && (
        <AppModal
          variant="form"
          panelClassName="admin-modal"
          eyebrow="Empresa"
          title="Bloquear empresa"
          titleId="block-tenant-title"
          subtitle={
            selectedTenant
              ? selectedTenant.name || selectedTenant.email
              : "Empresa selecionada"
          }
          subtitleClassName="admin-modal__subtitle"
          onClose={() => !blockLoading && setShowBlockModal(false)}
        >
          <form className="admin-modal__form" onSubmit={handleBlockTenant}>
            <p className="admin-modal__hint">
              Todos os usuários perderão acesso imediatamente (incluindo sessões
              ativas). A execução automática será pausada em todos os projetos.
            </p>
            <GlassSelect
              label="Motivo"
              fieldClassName="admin-mgmt__field"
              labelClassName="admin-mgmt__label"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
            >
              <option value="security">Segurança</option>
              <option value="payment">Falta de pagamento</option>
              <option value="other">Outro</option>
            </GlassSelect>
            <label className="admin-mgmt__field">
              <span className="admin-mgmt__label">Nota interna (opcional)</span>
              <textarea
                className="admin-mgmt__input admin-mgmt__input--textarea"
                value={blockNote}
                onChange={(e) => setBlockNote(e.target.value)}
                rows={3}
                placeholder="Detalhes para auditoria interna"
              />
            </label>
            <footer className="admin-modal__footer">
              <button
                type="button"
                className="toolbar-btn"
                disabled={blockLoading}
                onClick={() => setShowBlockModal(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="toolbar-btn toolbar-btn--danger"
                disabled={blockLoading}
              >
                {blockLoading ? "Bloqueando…" : "Confirmar bloqueio"}
              </button>
            </footer>
          </form>
        </AppModal>
      )}
    </AppSubpagePanel>
  );
}
