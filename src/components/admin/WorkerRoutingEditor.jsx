import React, { useMemo, useState } from "react";
import GlassSelect from "../GlassSelect.jsx";
import { formatAiProviderLabel } from "../../lib/aiProviderLabels.js";
import {
  catalogLabelForKey,
  collectMapRowKeys,
  normalizeRoute,
  resolveRowRoute,
  resolveRowSource,
} from "../../lib/workerRoutingDraft.js";

const MAP_SECTIONS = [
  {
    mapName: "byJobKind",
    title: "Por tipo de job",
    desc: "Roteamento por kind do job na fila CLI/worker.",
    catalogKey: "jobKinds",
  },
  {
    mapName: "byAgentName",
    title: "Por nome do agente",
    desc: "Prioridade sobre job kind quando o agentName está definido.",
    catalogKey: "agentNames",
  },
  {
    mapName: "byAgentFile",
    title: "Por ficheiro do agente",
    desc: "Prioridade máxima — caminho do prompt markdown.",
    catalogKey: "agentFiles",
  },
];

function sourceChipClass(source) {
  if (source === "tenant") return "admin-mgmt__chip--teal";
  return "admin-mgmt__chip--muted";
}

/**
 * @param {{
 *   mapName: string,
 *   title: string,
 *   desc?: string,
 *   catalogEntries: object[],
 *   draft: object,
 *   onChange: (next: object) => void,
 *   lunaProfiles: string[],
 *   rawWorker: object,
 *   globalRouting: object,
 *   readOnly?: boolean,
 *   defaultOpen?: boolean,
 *   draftOnlyRows?: boolean,
 *   editMode?: "default" | "tenant",
 * }} props
 */
function RoutingMapTable({
  mapName,
  title,
  desc,
  catalogEntries,
  draft,
  onChange,
  lunaProfiles,
  rawWorker,
  globalRouting,
  readOnly = false,
  defaultOpen = true,
  draftOnlyRows = false,
  editMode = "tenant",
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [newKey, setNewKey] = useState("");
  const [newProvider, setNewProvider] = useState("luna");
  const [newProfile, setNewProfile] = useState(lunaProfiles[0] || "planning");

  function patchMap(key, route) {
    const map = { ...(draft[mapName] || {}) };
    if (route == null) {
      delete map[key];
    } else {
      map[key] =
        route.provider === "cursor"
          ? { provider: "cursor" }
          : {
              provider: "luna",
              lunaProfile: route.lunaProfile || "planning",
            };
    }
    const next = { ...draft };
    if (Object.keys(map).length > 0) next[mapName] = map;
    else delete next[mapName];
    onChange(next);
  }

  function removeRow(key) {
    patchMap(key, null);
  }

  function addRow() {
    const key = String(newKey || "").trim();
    if (!key) return;
    if (rowKeys.includes(key)) return;
    patchMap(
      key,
      newProvider === "cursor"
        ? { provider: "cursor" }
        : { provider: "luna", lunaProfile: newProfile }
    );
    setNewKey("");
  }

  const rowKeys = useMemo(() => {
    if (draftOnlyRows) {
      return Object.keys(draft[mapName] || {}).sort((a, b) => a.localeCompare(b));
    }
    return collectMapRowKeys(catalogEntries, draft, globalRouting, mapName);
  }, [catalogEntries, draft, globalRouting, mapName, draftOnlyRows]);

  const canRemove = (key, source) => {
    if (readOnly) return false;
    if (editMode === "default") {
      return draft[mapName]?.[key] !== undefined;
    }
    return (
      draftOnlyRows ||
      source === "tenant" ||
      draft[mapName]?.[key] !== undefined
    );
  };

  function displaySource(mapName, key) {
    if (editMode === "default") return "global";
    return resolveRowSource(mapName, key, rawWorker, globalRouting);
  }

  function displaySourceLabel(source) {
    if (editMode === "default") return "global";
    return source === "default" ? "default" : source;
  }

  return (
    <section className="admin-ia__worker-section admin-mgmt__panel">
      <header className="admin-mgmt__panel-head">
        <div className="admin-mgmt__panel-intro">
          <button
            type="button"
            className="admin-ia__section-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            {title} {open ? "▾" : "▸"}
          </button>
          {desc && <p className="admin-mgmt__panel-desc">{desc}</p>}
        </div>
      </header>

      {open && (
        <>
          <div className="admin-ia__table-wrap">
            <table className="admin-ia__table">
              <thead>
                <tr>
                  <th>Chave</th>
                  <th>Provedor</th>
                  <th>Perfil Luna</th>
                  <th>Origem</th>
                  {!readOnly && <th aria-label="Ações" />}
                </tr>
              </thead>
              <tbody>
                {rowKeys.length === 0 ? (
                  <tr>
                    <td colSpan={readOnly ? 4 : 5} className="admin-ia__empty-row">
                      Sem entradas configuradas.
                    </td>
                  </tr>
                ) : (
                  rowKeys.map((key) => {
                    const label = catalogLabelForKey(catalogEntries, key);
                    const source = displaySource(mapName, key);
                    const route = resolveRowRoute(
                      mapName,
                      key,
                      draft,
                      globalRouting
                    );
                    const isCustom = !label;

                    return (
                      <tr key={key}>
                        <td>
                          {isCustom && !readOnly ? (
                            <input
                              className="admin-mgmt__input admin-ia__key-input"
                              value={key}
                              readOnly
                              title={key}
                            />
                          ) : (
                            <div>
                              <span>{label || key}</span>
                              <code className="admin-ia__key-code">{key}</code>
                            </div>
                          )}
                        </td>
                        <td>
                          {readOnly ? (
                            <span>{formatAiProviderLabel(route.provider)}</span>
                          ) : (
                            <GlassSelect
                              value={route.provider}
                              onChange={(e) => {
                                const provider = e.target.value;
                                patchMap(
                                  key,
                                  provider === "cursor"
                                    ? { provider: "cursor" }
                                    : {
                                        provider: "luna",
                                        lunaProfile:
                                          route.lunaProfile ||
                                          lunaProfiles[0] ||
                                          "planning",
                                      }
                                );
                              }}
                            >
                              <option value="cursor">{formatAiProviderLabel("cursor")}</option>
                              <option value="luna">{formatAiProviderLabel("luna")}</option>
                            </GlassSelect>
                          )}
                        </td>
                        <td>
                          {route.provider === "luna" ? (
                            readOnly ? (
                              <span>{route.lunaProfile || "planning"}</span>
                            ) : (
                              <GlassSelect
                                value={route.lunaProfile || "planning"}
                                onChange={(e) =>
                                  patchMap(key, {
                                    provider: "luna",
                                    lunaProfile: e.target.value,
                                  })
                                }
                              >
                                {lunaProfiles.map((p) => (
                                  <option key={p} value={p}>
                                    {p}
                                  </option>
                                ))}
                              </GlassSelect>
                            )
                          ) : (
                            <span className="admin-ia__na">—</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`admin-mgmt__chip ${sourceChipClass(source)}`}
                          >
                            {displaySourceLabel(source)}
                          </span>
                        </td>
                        {!readOnly && (
                          <td>
                            {canRemove(key, source) && (
                              <button
                                type="button"
                                className="admin-ia__row-remove"
                                onClick={() => removeRow(key)}
                                title={
                                  editMode === "default"
                                    ? "Usar provedor/perfil por defeito"
                                    : "Remover override"
                                }
                              >
                                Remover
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!readOnly && (
            <div className="admin-ia__map-actions">
              <input
                className="admin-mgmt__input admin-ia__key-input"
                placeholder="Nova chave…"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
              />
              <GlassSelect
                value={newProvider}
                onChange={(e) => setNewProvider(e.target.value)}
              >
                <option value="luna">{formatAiProviderLabel("luna")}</option>
                <option value="cursor">{formatAiProviderLabel("cursor")}</option>
              </GlassSelect>
              {newProvider === "luna" && (
                <GlassSelect
                  value={newProfile}
                  onChange={(e) => setNewProfile(e.target.value)}
                >
                  {lunaProfiles.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </GlassSelect>
              )}
              <button
                type="button"
                className="btn-glass px-3 py-2 rounded-xl text-dash-body"
                onClick={addRow}
              >
                + Adicionar linha
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

/**
 * Editor estruturado de roteamento worker/CLI.
 */
export default function WorkerRoutingEditor({
  value,
  onChange,
  lunaProfiles,
  catalog,
  rawWorker = {},
  globalRouting = {},
  readOnly = false,
  draftOnlyRows = false,
  editMode = "tenant",
}) {
  const draft = value || {};
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [jsonText, setJsonText] = useState("");

  function patch(partial) {
    onChange({ ...draft, ...partial });
  }

  function openAdvanced() {
    setJsonText(
      JSON.stringify(
        {
          defaultProvider: draft.defaultProvider || "luna",
          defaultProfile: draft.defaultProfile || "planning",
          ...(draft.byJobKind ? { byJobKind: draft.byJobKind } : {}),
          ...(draft.byAgentName ? { byAgentName: draft.byAgentName } : {}),
          ...(draft.byAgentFile ? { byAgentFile: draft.byAgentFile } : {}),
        },
        null,
        2
      )
    );
    setShowAdvanced(true);
  }

  function applyJson() {
    try {
      const parsed = JSON.parse(jsonText);
      onChange({
        defaultProvider: parsed.defaultProvider || "luna",
        defaultProfile: parsed.defaultProfile || "planning",
        ...(parsed.byJobKind ? { byJobKind: parsed.byJobKind } : {}),
        ...(parsed.byAgentName ? { byAgentName: parsed.byAgentName } : {}),
        ...(parsed.byAgentFile ? { byAgentFile: parsed.byAgentFile } : {}),
      });
      setShowAdvanced(false);
    } catch {
      window.alert("JSON inválido");
    }
  }

  const workerCatalog = catalog?.worker || {};

  return (
    <div className="admin-ia__worker-form">
      <section className="admin-ia__worker-section">
        <div className="admin-ia__default-row">
          <label className="admin-mgmt__field">
            <span className="admin-mgmt__label">Provedor por defeito</span>
            {readOnly ? (
              <span>
                {formatAiProviderLabel(
                  draft.defaultProvider || globalRouting?.defaultProvider || "luna"
                )}
              </span>
            ) : (
              <GlassSelect
                value={draft.defaultProvider || globalRouting?.defaultProvider || "luna"}
                onChange={(e) => patch({ defaultProvider: e.target.value })}
              >
                <option value="luna">{formatAiProviderLabel("luna")}</option>
                <option value="cursor">{formatAiProviderLabel("cursor")}</option>
              </GlassSelect>
            )}
          </label>
          {(draft.defaultProvider ||
            globalRouting?.defaultProvider ||
            "luna") !== "cursor" && (
            <label className="admin-mgmt__field">
              <span className="admin-mgmt__label">Perfil Luna por defeito</span>
              {readOnly ? (
                <span>{draft.defaultProfile || globalRouting?.defaultProfile || "planning"}</span>
              ) : (
                <GlassSelect
                  value={draft.defaultProfile || globalRouting?.defaultProfile || "planning"}
                  onChange={(e) => patch({ defaultProfile: e.target.value })}
                >
                  {lunaProfiles.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </GlassSelect>
              )}
            </label>
          )}
        </div>
        <p className="admin-mgmt__hint">
          Usado quando nenhum mapa abaixo corresponde à chamada.
        </p>
      </section>

      {MAP_SECTIONS.map((section) => (
        <RoutingMapTable
          key={section.mapName}
          mapName={section.mapName}
          title={section.title}
          desc={section.desc}
          catalogEntries={workerCatalog[section.catalogKey] || []}
          draft={draft}
          onChange={onChange}
          lunaProfiles={lunaProfiles}
          rawWorker={rawWorker}
          globalRouting={globalRouting}
          readOnly={readOnly}
          draftOnlyRows={draftOnlyRows}
          editMode={editMode}
        />
      ))}

      {!readOnly && (
        <section className="admin-ia__worker-section admin-ia__advanced">
          <button
            type="button"
            className="admin-ia__global-toggle"
            onClick={() => (showAdvanced ? setShowAdvanced(false) : openAdvanced())}
            aria-expanded={showAdvanced}
          >
            Avançado (JSON) {showAdvanced ? "▾" : "▸"}
          </button>
          {showAdvanced && (
            <div className="admin-ia__worker-json">
              <textarea
                className="admin-mgmt__input admin-mgmt__input--textarea"
                rows={12}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
              />
              <div className="admin-ia__map-actions">
                <button
                  type="button"
                  className="btn-glass px-3 py-2 rounded-xl text-dash-body"
                  onClick={applyJson}
                >
                  Aplicar JSON
                </button>
                <button
                  type="button"
                  className="btn-glass px-3 py-2 rounded-xl text-dash-body"
                  onClick={() => setShowAdvanced(false)}
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
