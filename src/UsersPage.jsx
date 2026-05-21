import React, { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "./api.js";
import { useCapabilities, useSession } from "./SessionContext.jsx";

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
 * @param {{ onClose: () => void }} props
 */
export default function UsersPage({ onClose }) {
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
  const [editCursorKey, setEditCursorKey] = useState("");

  const [tenantAdminKey, setTenantAdminKey] = useState("");
  const [showKeysPanel, setShowKeysPanel] = useState(false);

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
      setMessage("Utilizador criado com sucesso.");
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
    setEditCursorKey("");
    clearFeedback();
  }

  function closeEdit() {
    setEditUser(null);
    setEditPassword("");
    setEditCursorKey("");
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

      if (
        isPlatformAdmin &&
        editUser.role === "executor" &&
        editCursorKey.trim()
      ) {
        const res = await apiFetch(
          `/admin/tenants/${tenantId}/users/${editUser.id}/cursor-api-key`,
          {
            method: "PUT",
            body: JSON.stringify({ cursorApiKey: editCursorKey.trim() }),
          }
        );
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
      setMessage("Utilizador removido.");
      if (editUser?.id === user.id) closeEdit();
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSaveTenantAdminKey(e) {
    e.preventDefault();
    if (!tenantAdminKey.trim() || !isPlatformAdmin) return;
    clearFeedback();
    try {
      const res = await apiFetch(
        `/admin/tenants/${tenantId}/cursor-admin-key`,
        {
          method: "PUT",
          body: JSON.stringify({ cursorAdminApiKey: tenantAdminKey.trim() }),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      setMessage("ADMIN key do tenant gravada.");
      setTenantAdminKey("");
    } catch (err) {
      setError(err.message);
    }
  }

  if (!canOpenPage) {
    return (
      <div className="users-page">
        <p className="msg msg--error">Sem permissão para gerir utilizadores.</p>
        <button type="button" className="toolbar-btn" onClick={onClose}>
          Voltar
        </button>
      </div>
    );
  }

  const selectedTenant = tenants.find((t) => t.id === tenantId);

  return (
    <div className="users-page">
      <header className="users-page__header">
        <div>
          <h1>Utilizadores</h1>
          <p className="users-page__subtitle">
            {isPlatformAdmin
              ? "Gestão da equipa por empresa (admin plataforma)"
              : "Equipa da sua empresa"}
          </p>
        </div>
        <div className="users-page__header-actions">
          <span className="users-page__quota" title="Quota do plano">
            {usersUsed} / {usersMax}
          </span>
          <button type="button" className="toolbar-btn" onClick={onClose}>
            Voltar
          </button>
        </div>
      </header>

      {isPlatformAdmin && (
        <div className="users-page__toolbar">
          <label className="users-page__field">
            <span className="users-page__label">Empresa (tenant)</span>
            <select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.email}
                </option>
              ))}
            </select>
          </label>
          {selectedTenant && (
            <span className="users-page__meta">
              Plano: {selectedTenant.plan_id || "—"}
            </span>
          )}
        </div>
      )}

      {error && <p className="msg msg--error">{error}</p>}
      {message && <p className="msg msg--ok">{message}</p>}

      <div className="users-page__main">
        <section className="users-panel">
          <div className="users-panel__head">
            <h2>Equipa</h2>
            {canAddUser && (
              <button
                type="button"
                className="toolbar-btn toolbar-btn--primary"
                onClick={() => setShowCreate((v) => !v)}
              >
                {showCreate ? "Cancelar" : "+ Novo utilizador"}
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
                Criar utilizador
              </button>
            </form>
          )}

          {loading ? (
            <p className="msg msg--muted">A carregar…</p>
          ) : users.length === 0 ? (
            <p className="msg msg--muted">Nenhum utilizador neste tenant.</p>
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
                        {u.role === "executor" && (
                          <span
                            className={
                              u.hasCursorKey
                                ? "users-status users-status--ok"
                                : "users-status users-status--warn"
                            }
                          >
                            Key {u.hasCursorKey ? "ok" : "pendente"}
                          </span>
                        )}
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

        {isPlatformAdmin && (
          <section className="users-panel users-panel--keys">
            <button
              type="button"
              className="users-panel__toggle"
              onClick={() => setShowKeysPanel((v) => !v)}
            >
              Chaves Cursor (tenant) {showKeysPanel ? "▾" : "▸"}
            </button>
            {showKeysPanel && (
              <form
                className="users-form-card"
                onSubmit={handleSaveTenantAdminKey}
              >
                <p className="msg msg--muted">
                  ADMIN key para billing. Não é mostrada após gravar.
                </p>
                <label>
                  Nova ADMIN key
                  <input
                    type="password"
                    value={tenantAdminKey}
                    onChange={(e) => setTenantAdminKey(e.target.value)}
                    autoComplete="off"
                  />
                </label>
                <button type="submit" className="toolbar-btn">
                  Gravar ADMIN key
                </button>
              </form>
            )}
          </section>
        )}
      </div>

      {editUser && (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEdit();
          }}
        >
          <div
            className="users-modal"
            role="dialog"
            aria-labelledby="edit-user-title"
          >
            <header className="users-modal__header">
              <h2 id="edit-user-title">Editar utilizador</h2>
              <button
                type="button"
                className="toolbar-btn"
                onClick={closeEdit}
                aria-label="Fechar"
              >
                ✕
              </button>
            </header>
            <p className="users-modal__email">{editUser.email}</p>
            <form onSubmit={handleSaveEdit}>
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

              {isPlatformAdmin && editRole === "executor" && (
                <label>
                  API key Cursor (executor)
                  <input
                    type="password"
                    value={editCursorKey}
                    onChange={(e) => setEditCursorKey(e.target.value)}
                    autoComplete="off"
                    placeholder={
                      editUser.hasCursorKey
                        ? "Nova key (substitui a anterior)"
                        : "Obrigatória para executar jobs"
                    }
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
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
