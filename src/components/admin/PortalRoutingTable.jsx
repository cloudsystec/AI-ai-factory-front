import React from "react";
import GlassSelect from "../GlassSelect.jsx";

/**
 * Tabela de roteamento portal (Cursor/Luna por feature).
 * @param {{
 *   rows: object[],
 *   lunaProfiles: string[],
 *   onUpdateRow: (key: string, patch: object) => void,
 *   showSource?: boolean,
 * }} props
 */
export default function PortalRoutingTable({
  rows,
  lunaProfiles,
  onUpdateRow,
  showSource = false,
}) {
  return (
    <div className="admin-ia__table-wrap">
      <table className="admin-ia__table">
        <thead>
          <tr>
            <th>Feature</th>
            <th>Provedor</th>
            <th>Perfil Luna</th>
            {showSource && <th>Origem</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td>{row.label}</td>
              <td>
                <GlassSelect
                  value={row.route.provider}
                  onChange={(e) => {
                    const provider = e.target.value;
                    onUpdateRow(row.key, {
                      provider,
                      ...(provider === "luna"
                        ? {
                            lunaProfile: row.route.lunaProfile || "planning",
                          }
                        : {}),
                    });
                  }}
                >
                  <option value="cursor">Cursor</option>
                  <option value="luna">Luna</option>
                </GlassSelect>
              </td>
              <td>
                {row.route.provider === "luna" ? (
                  <GlassSelect
                    value={row.route.lunaProfile || "planning"}
                    onChange={(e) =>
                      onUpdateRow(row.key, { lunaProfile: e.target.value })
                    }
                  >
                    {lunaProfiles.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </GlassSelect>
                ) : (
                  <span className="admin-ia__na">—</span>
                )}
              </td>
              {showSource && (
                <td>
                  <span
                    className={`admin-mgmt__chip admin-mgmt__chip--${
                      row.source === "tenant" ? "teal" : "muted"
                    }`}
                  >
                    {row.source === "tenant" ? "tenant" : "default"}
                  </span>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function routeFromEffective(entry) {
  if (!entry) return { provider: "cursor" };
  if (entry.provider === "luna") {
    return { provider: "luna", lunaProfile: entry.lunaProfile || "planning" };
  }
  return { provider: "cursor" };
}
