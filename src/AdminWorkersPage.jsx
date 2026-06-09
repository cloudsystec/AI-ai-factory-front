import React, { useCallback, useEffect, useState } from "react";
import { apiFetch } from "./api.js";
import AppSubpagePanel from "./components/AppSubpagePanel.jsx";

/**
 * Admin plataforma — bots e workers por tenant.
 */
export default function AdminWorkersPage() {
  const [tenants, setTenants] = useState([]);
  const [tenantId, setTenantId] = useState("");
  const [slotsMax, setSlotsMax] = useState(1);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [tenantAdminKey, setTenantAdminKey] = useState("");
  const [savingSlot, setSavingSlot] = useState(null);
  const [provisioningWorker, setProvisioningWorker] = useState(false);

  const loadTenants = useCallback(async () => {
    const res = await apiFetch("/admin/tenants");
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    setTenants(data.tenants || []);
    if (data.tenants?.[0]) {
      setTenantId((prev) => prev || data.tenants[0].id);
    }
  }, []);

  const loadWorkers = useCallback(async () => {
    if (!tenantId) {
      setWorkers([]);
      return;
    }
    const res = await apiFetch(`/admin/tenants/${tenantId}/workers`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    setSlotsMax(data.slotsMax ?? 1);
    setWorkers(data.workers || []);
    const next = {};
    for (const w of data.workers || []) {
      next[w.slot] = {
        botEmail: w.botEmail || "",
        cursorWorkerApiKey: "",
      };
    }
    setDrafts(next);
  }, [tenantId]);

  useEffect(() => {
    loadTenants().catch((e) => setError(e.message));
  }, [loadTenants]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    loadWorkers()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [loadWorkers]);

  async function handleSaveSlot(slot) {
    const d = drafts[slot];
    if (!d?.botEmail?.trim()) {
      setError("Email do bot obrigatório.");
      return;
    }
    setSavingSlot(slot);
    setError(null);
    setMessage(null);
    try {
      const body = { botEmail: d.botEmail.trim() };
      if (d.cursorWorkerApiKey?.trim()) {
        body.cursorWorkerApiKey = d.cursorWorkerApiKey.trim();
      }
      const res = await apiFetch(
        `/admin/tenants/${tenantId}/workers/${slot}`,
        { method: "PUT", body: JSON.stringify(body) }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      setMessage(`Bot slot ${slot} guardado.`);
      await loadWorkers();
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingSlot(null);
    }
  }

  async function handleSaveAdminKey(e) {
    e.preventDefault();
    if (!tenantAdminKey.trim()) return;
    setError(null);
    setMessage(null);
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
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleProvisionWorker() {
    setProvisioningWorker(true);
    setError(null);
    setMessage(null);
    try {
      const res = await apiFetch(
        `/admin/tenants/${tenantId}/worker/provision`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      if (data.result?.buildPending) {
        setMessage(
          "Worker configurado — build Docker em curso no Railway."
        );
      } else if (data.deployment?.status === "deployed") {
        setMessage("Worker provisionado e deploy iniciado.");
      } else {
        setMessage("Provisionamento do worker concluído.");
      }
      await loadTenants();
    } catch (e) {
      setError(e.message);
      await loadTenants();
    } finally {
      setProvisioningWorker(false);
    }
  }

  function deployStatusLabel(status) {
    if (!status) return "Sem registo";
    const map = {
      pending: "Pendente",
      provisioning: "A provisionar…",
      configured: "Config OK / build pendente",
      deployed: "Deploy OK",
      failed: "Falhou",
    };
    return map[status] || status;
  }

  const selectedTenant = tenants.find((t) => t.id === tenantId);

  return (
    <AppSubpagePanel
      className="users-page admin-workers-page"
      eyebrow="Plataforma"
      title="Bots / Workers"
      subtitle="Um container Docker por tenant; cada slot é um bot com email e API key Cursor."
    >
      {error && <p className="msg msg--error">{error}</p>}
      {message && <p className="msg msg--ok">{message}</p>}

      <label className="users-page__tenant-select">
        Tenant
        <select
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
        >
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name || t.email} ({t.botsConfiguredCount ?? 0}/
              {t.botsTotal ?? t.agent_slots_max ?? "?"} bots)
            </option>
          ))}
        </select>
      </label>

      {loading ? (
        <p className="msg msg--muted">Carregando…</p>
      ) : (
        <>
          {selectedTenant && (
            <section className="users-panel">
              <h2>Worker Railway</h2>
              <p className="msg msg--muted">
                Deploy:{" "}
                <strong>
                  {deployStatusLabel(selectedTenant.workerDeployStatus)}
                </strong>
                {selectedTenant.workerStatus ? (
                  <>
                    {" "}
                    · CLI: <strong>{selectedTenant.workerStatus}</strong>
                  </>
                ) : null}
                {selectedTenant.railwayServiceId ? (
                  <> · serviço {selectedTenant.railwayServiceId}</>
                ) : null}
              </p>
              {selectedTenant.workerDeployError && (
                <p className="msg msg--error">{selectedTenant.workerDeployError}</p>
              )}
              <button
                type="button"
                className="toolbar-btn"
                disabled={provisioningWorker}
                onClick={handleProvisionWorker}
              >
                {provisioningWorker ? "A provisionar…" : "Reprovisionar worker"}
              </button>
            </section>
          )}

          <section className="users-panel">
            <h2>
              Slots 1–{slotsMax}
              {selectedTenant?.plan_id ? ` · plano ${selectedTenant.plan_id}` : ""}
            </h2>
            <div className="admin-workers-table-wrap">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Slot</th>
                    <th>Email do bot</th>
                    <th>API key worker</th>
                    <th>Estado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {workers.map((w) => (
                    <tr key={w.slot}>
                      <td>#{w.slot}</td>
                      <td>
                        <input
                          type="email"
                          value={drafts[w.slot]?.botEmail ?? ""}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [w.slot]: {
                                ...prev[w.slot],
                                botEmail: e.target.value,
                              },
                            }))
                          }
                          placeholder="bot@empresa.com"
                          autoComplete="off"
                        />
                      </td>
                      <td>
                        <input
                          type="password"
                          value={drafts[w.slot]?.cursorWorkerApiKey ?? ""}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [w.slot]: {
                                ...prev[w.slot],
                                cursorWorkerApiKey: e.target.value,
                              },
                            }))
                          }
                          placeholder={
                            w.hasWorkerApiKey
                              ? "Nova key (opcional)"
                              : "API key obrigatória"
                          }
                          autoComplete="off"
                        />
                      </td>
                      <td>
                        <span
                          className={
                            w.botReady
                              ? "users-status users-status--ok"
                              : "users-status users-status--warn"
                          }
                        >
                          {w.botReady ? "Configurado" : "Pendente"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="toolbar-btn"
                          disabled={savingSlot === w.slot}
                          onClick={() => handleSaveSlot(w.slot)}
                        >
                          {savingSlot === w.slot ? "…" : "Salvar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="users-panel users-panel--keys">
            <h2>Admin API key (tenant)</h2>
            <p className="msg msg--muted">
              Usada para billing Cursor (Admin API). Não é mostrada após salvar.
            </p>
            <form className="users-form-card" onSubmit={handleSaveAdminKey}>
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
                Salvar ADMIN key
              </button>
            </form>
          </section>
        </>
      )}
    </AppSubpagePanel>
  );
}
