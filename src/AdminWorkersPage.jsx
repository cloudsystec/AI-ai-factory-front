import React, { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faKey,
  faPen,
  faRobot,
  faServer,
} from "@fortawesome/free-solid-svg-icons";
import { apiFetch } from "./api.js";
import { useOptionalAdminTenant } from "./context/AdminTenantContext.jsx";
import AppSubpagePanel from "./components/AppSubpagePanel.jsx";
import AppModal from "./components/AppModal.jsx";
import GlassSelect from "./components/GlassSelect.jsx";

const PLAN_LABELS = {
  starter: "Starter",
  team: "Team",
  scale: "Scale",
  business: "Business",
  enterprise: "Enterprise",
};

/**
 * Admin plataforma — bots e workers por tenant.
 */
export default function AdminWorkersPage({ embedded = false }) {
  const adminCtx = useOptionalAdminTenant();
  const useAdminTenantCtx = embedded && adminCtx;
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
  const [editSlot, setEditSlot] = useState(null);

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
  const activeTenants = useAdminTenantCtx ? adminCtx.tenants : tenants;

  const loadWorkers = useCallback(async () => {
    if (!activeTenantId) {
      setWorkers([]);
      return;
    }
    const res = await apiFetch(`/admin/tenants/${activeTenantId}/workers`);
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
  }, [activeTenantId]);

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

  function deployStatusTone(status) {
    if (status === "deployed") return "ok";
    if (status === "failed") return "danger";
    if (status === "provisioning" || status === "pending") return "warn";
    return "muted";
  }

  function openSlotEdit(slot) {
    setEditSlot(slot);
    setError(null);
    setMessage(null);
  }

  function closeSlotEdit() {
    setEditSlot(null);
  }

  async function handleSaveSlot(slot) {
    const d = drafts[slot];
    if (!d?.botEmail?.trim()) {
      setError("Email do bot obrigatório.");
      return false;
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
        `/admin/tenants/${activeTenantId}/workers/${slot}`,
        { method: "PUT", body: JSON.stringify(body) }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      setMessage(`Bot slot ${slot} guardado.`);
      await loadWorkers();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setSavingSlot(null);
    }
  }

  async function handleSaveSlotModal(e) {
    e.preventDefault();
    if (editSlot == null) return;
    const ok = await handleSaveSlot(editSlot);
    if (ok) closeSlotEdit();
  }

  async function handleSaveAdminKey(e) {
    e.preventDefault();
    if (!tenantAdminKey.trim()) return;
    setError(null);
    setMessage(null);
    try {
      const res = await apiFetch(
        `/admin/tenants/${activeTenantId}/cursor-admin-key`,
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
        `/admin/tenants/${activeTenantId}/worker/provision`,
        { method: "POST" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      if (data.result?.buildPending) {
        setMessage("Worker configurado — build Docker em curso no Railway.");
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

  const selectedTenant = activeTenants.find((t) => t.id === activeTenantId);
  const editWorker = editSlot != null ? workers.find((w) => w.slot === editSlot) : null;
  const botsConfigured = selectedTenant?.botsConfiguredCount ?? 0;
  const botsTotal =
    selectedTenant?.botsTotal ?? selectedTenant?.agent_slots_max ?? slotsMax;

  const inner = (
    <>
      <div className="admin-mgmt">
        {(error || message) && (
          <div className="admin-mgmt__alerts" role="status">
            {error && <p className="msg msg--error">{error}</p>}
            {message && <p className="msg msg--ok">{message}</p>}
          </div>
        )}

        {!useAdminTenantCtx && (
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
                    {botsConfigured}/{botsTotal} bots
                  </span>
                  {selectedTenant.workerDeployStatus && (
                    <span
                      className={`admin-mgmt__chip admin-mgmt__chip--${deployStatusTone(
                        selectedTenant.workerDeployStatus
                      )}`}
                    >
                      Worker: {deployStatusLabel(selectedTenant.workerDeployStatus)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
        )}

        {loading ? (
          <p className="msg msg--muted admin-mgmt__empty">Carregando…</p>
        ) : (
          <>
            {selectedTenant && (
              <section className="admin-mgmt__panel admin-mgmt__panel--worker">
                <header className="admin-mgmt__panel-head">
                  <div className="admin-mgmt__panel-intro">
                    <h2 className="admin-mgmt__panel-title">
                      <FontAwesomeIcon icon={faServer} aria-hidden />
                      Worker Railway
                    </h2>
                    <p className="admin-mgmt__panel-desc">
                      Container que executa os jobs do tenant na plataforma.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="toolbar-btn"
                    disabled={provisioningWorker}
                    onClick={handleProvisionWorker}
                  >
                    {provisioningWorker ? "A provisionar…" : "Reprovisionar worker"}
                  </button>
                </header>

                <div className="admin-worker-status">
                  <div className="admin-worker-status__row">
                    <span className="admin-mgmt__label">Deploy</span>
                    <span
                      className={`admin-status admin-status--${deployStatusTone(
                        selectedTenant.workerDeployStatus
                      )}`}
                    >
                      {deployStatusLabel(selectedTenant.workerDeployStatus)}
                    </span>
                  </div>
                  {selectedTenant.workerStatus && (
                    <div className="admin-worker-status__row">
                      <span className="admin-mgmt__label">CLI</span>
                      <span className="admin-worker-status__value">
                        {selectedTenant.workerStatus}
                      </span>
                    </div>
                  )}
                  {selectedTenant.railwayServiceId && (
                    <div className="admin-worker-status__row">
                      <span className="admin-mgmt__label">Serviço</span>
                      <code className="admin-worker-status__code">
                        {selectedTenant.railwayServiceId}
                      </code>
                    </div>
                  )}
                </div>

                {selectedTenant.workerDeployError && (
                  <p className="msg msg--error admin-worker-status__error">
                    {selectedTenant.workerDeployError}
                  </p>
                )}
              </section>
            )}

            <section className="admin-mgmt__panel">
              <header className="admin-mgmt__panel-head">
                <div className="admin-mgmt__panel-intro">
                  <h2 className="admin-mgmt__panel-title">
                    <FontAwesomeIcon icon={faRobot} aria-hidden />
                    Bots · slots 1–{slotsMax}
                  </h2>
                  <p className="admin-mgmt__panel-desc">
                    Cada slot corresponde a um bot Cursor com email e API key próprios.
                  </p>
                </div>
              </header>

              <div className="admin-bot-grid">
                {workers.map((w) => (
                  <article
                    key={w.slot}
                    className={`admin-bot-card${
                      w.botReady ? " admin-bot-card--ready" : ""
                    }`}
                  >
                    <header className="admin-bot-card__head">
                      <span className="admin-bot-card__slot">Slot #{w.slot}</span>
                      <span
                        className={`admin-status admin-status--${
                          w.botReady ? "ok" : "warn"
                        }`}
                      >
                        {w.botReady ? "Configurado" : "Pendente"}
                      </span>
                    </header>
                    <div className="admin-bot-card__body">
                      <p className="admin-bot-card__email">
                        {drafts[w.slot]?.botEmail?.trim() ||
                          w.botEmail ||
                          "Sem email configurado"}
                      </p>
                      <p className="admin-bot-card__meta">
                        API key worker:{" "}
                        {w.hasWorkerApiKey ? "Configurada" : "Pendente"}
                      </p>
                    </div>
                    <footer className="admin-bot-card__footer">
                      <button
                        type="button"
                        className="toolbar-btn toolbar-btn--primary admin-bot-card__btn"
                        onClick={() => openSlotEdit(w.slot)}
                      >
                        <FontAwesomeIcon icon={faPen} aria-hidden />
                        Configurar
                      </button>
                    </footer>
                  </article>
                ))}
              </div>
            </section>

            <section className="admin-mgmt__panel admin-mgmt__panel--keys">
              <header className="admin-mgmt__panel-head">
                <div className="admin-mgmt__panel-intro">
                  <h2 className="admin-mgmt__panel-title">
                    <FontAwesomeIcon icon={faKey} aria-hidden />
                    Admin API key
                  </h2>
                  <p className="admin-mgmt__panel-desc">
                    Usada para billing Cursor (Admin API). Não é mostrada após salvar.
                  </p>
                </div>
              </header>
              <form className="admin-form-card admin-form-card--inline" onSubmit={handleSaveAdminKey}>
                <div className="admin-form-card__grid admin-form-card__grid--single">
                  <label className="admin-mgmt__field">
                    <span className="admin-mgmt__label">Nova ADMIN key</span>
                    <input
                      className="admin-mgmt__input"
                      type="password"
                      value={tenantAdminKey}
                      onChange={(e) => setTenantAdminKey(e.target.value)}
                      autoComplete="off"
                      placeholder="sk-…"
                    />
                  </label>
                </div>
                <footer className="admin-form-card__footer">
                  <button type="submit" className="toolbar-btn toolbar-btn--primary">
                    Salvar ADMIN key
                  </button>
                </footer>
              </form>
            </section>
          </>
        )}
      </div>

      {editSlot != null && editWorker && (
        <AppModal
          variant="form"
          panelClassName="admin-modal"
          eyebrow="Bots"
          title={`Configurar bot · slot #${editSlot}`}
          titleId="edit-bot-title"
          subtitle={
            editWorker.botReady
              ? "Bot configurado — altere email ou API key se necessário"
              : "Preencha email e API key para ativar este slot"
          }
          onClose={closeSlotEdit}
        >
          <form className="admin-modal__form" onSubmit={handleSaveSlotModal}>
            <label className="admin-mgmt__field">
              <span className="admin-mgmt__label">Email do bot</span>
              <input
                className="admin-mgmt__input"
                type="email"
                value={drafts[editSlot]?.botEmail ?? ""}
                onChange={(e) =>
                  setDrafts((prev) => ({
                    ...prev,
                    [editSlot]: {
                      ...prev[editSlot],
                      botEmail: e.target.value,
                    },
                  }))
                }
                placeholder="bot@empresa.com"
                autoComplete="off"
                required
                autoFocus
              />
            </label>
            <label className="admin-mgmt__field">
              <span className="admin-mgmt__label">API key worker</span>
              <input
                className="admin-mgmt__input"
                type="password"
                value={drafts[editSlot]?.cursorWorkerApiKey ?? ""}
                onChange={(e) =>
                  setDrafts((prev) => ({
                    ...prev,
                    [editSlot]: {
                      ...prev[editSlot],
                      cursorWorkerApiKey: e.target.value,
                    },
                  }))
                }
                placeholder={
                  editWorker.hasWorkerApiKey
                    ? "Nova key (opcional)"
                    : "API key obrigatória"
                }
                autoComplete="off"
              />
              <span className="admin-mgmt__hint">
                {editWorker.hasWorkerApiKey
                  ? "Deixe vazio para manter a key atual"
                  : "Obrigatória na primeira configuração"}
              </span>
            </label>
            <footer className="admin-modal__footer">
              <button type="button" className="toolbar-btn" onClick={closeSlotEdit}>
                Cancelar
              </button>
              <button
                type="submit"
                className="toolbar-btn toolbar-btn--primary"
                disabled={savingSlot === editSlot}
              >
                {savingSlot === editSlot ? "A guardar…" : "Salvar bot"}
              </button>
            </footer>
          </form>
        </AppModal>
      )}
    </>
  );

  if (embedded) {
    return inner;
  }

  return (
    <AppSubpagePanel
      className="users-page admin-workers-page admin-mgmt-page"
      eyebrow="Plataforma"
      title="Bots / Workers"
      subtitle="Container Docker por tenant — cada slot é um bot com email e API key Cursor"
      headerActions={
        selectedTenant ? (
          <span className="admin-mgmt__quota" title="Bots configurados">
            <FontAwesomeIcon icon={faRobot} aria-hidden />
            {botsConfigured}/{botsTotal}
          </span>
        ) : null
      }
    >
      {inner}
    </AppSubpagePanel>
  );
}
