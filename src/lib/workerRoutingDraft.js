const MAP_NAMES = ["byJobKind", "byAgentName", "byAgentFile"];

/**
 * @param {unknown} raw
 */
export function normalizeRoute(raw) {
  if (raw == null) return { provider: "luna", lunaProfile: "planning" };
  if (typeof raw === "string") {
    if (raw.trim().toLowerCase() === "cursor") return { provider: "cursor" };
    return { provider: "luna", lunaProfile: raw };
  }
  if (typeof raw === "object") {
    const provider = String(raw.provider || "luna").toLowerCase();
    if (provider === "cursor") return { provider: "cursor" };
    return {
      provider: "luna",
      lunaProfile: raw.lunaProfile || "planning",
    };
  }
  return { provider: "luna", lunaProfile: "planning" };
}

/**
 * @param {{ provider: string, lunaProfile?: string }} a
 * @param {{ provider: string, lunaProfile?: string }} b
 */
export function routesEqual(a, b) {
  const na = normalizeRoute(a);
  const nb = normalizeRoute(b);
  if (na.provider !== nb.provider) return false;
  if (na.provider === "cursor") return true;
  return na.lunaProfile === nb.lunaProfile;
}

/**
 * @param {object} globalRouting
 */
function normalizeGlobalRouting(globalRouting) {
  const g = globalRouting || {};
  return {
    defaultProvider:
      String(g.defaultProvider || "luna").toLowerCase() === "cursor"
        ? "cursor"
        : "luna",
    defaultProfile: g.defaultProfile || "planning",
    byJobKind: Object.fromEntries(
      Object.entries(g.byJobKind || {}).map(([k, v]) => [k, normalizeRoute(v)])
    ),
    byAgentName: Object.fromEntries(
      Object.entries(g.byAgentName || {}).map(([k, v]) => [k, normalizeRoute(v)])
    ),
    byAgentFile: Object.fromEntries(
      Object.entries(g.byAgentFile || {}).map(([k, v]) => [k, normalizeRoute(v)])
    ),
  };
}

/**
 * Rota efetiva de uma linha no draft (override → global → default).
 * @param {string} mapName
 * @param {string} key
 * @param {object} draft
 * @param {ReturnType<typeof normalizeGlobalRouting>} globalNorm
 */
function resolveEffectiveRowRoute(mapName, key, draft, globalNorm) {
  if (draft?.[mapName]?.[key] !== undefined) {
    return normalizeRoute(draft[mapName][key]);
  }
  if (globalNorm[mapName]?.[key] !== undefined) {
    return globalNorm[mapName][key];
  }
  return {
    provider: draft?.defaultProvider || globalNorm.defaultProvider,
    lunaProfile: draft?.defaultProfile || globalNorm.defaultProfile,
  };
}

/**
 * Rota global de referência para uma linha (sem overrides do tenant).
 * @param {string} mapName
 * @param {string} key
 * @param {ReturnType<typeof normalizeGlobalRouting>} globalNorm
 */
function resolveGlobalRowRoute(mapName, key, globalNorm) {
  if (globalNorm[mapName]?.[key] !== undefined) {
    return globalNorm[mapName][key];
  }
  return {
    provider: globalNorm.defaultProvider,
    lunaProfile: globalNorm.defaultProfile,
  };
}

/**
 * @param {{ provider: string, lunaProfile?: string }} route
 */
function serializeRoute(route) {
  return route.provider === "cursor"
    ? { provider: "cursor" }
    : {
        provider: "luna",
        lunaProfile: route.lunaProfile || "planning",
      };
}

/**
 * @param {object} draft
 * @param {object} globalRouting
 * @param {object} [previousRawWorker]
 */
export function buildWorkerTenantPatch(draft, globalRouting, previousRawWorker = {}) {
  const global = normalizeGlobalRouting(globalRouting);
  /** @type {Record<string, unknown>} */
  const patch = {};

  const draftDefaultProvider = draft?.defaultProvider ?? global.defaultProvider;
  const draftDefaultProfile = draft?.defaultProfile ?? global.defaultProfile;

  if (draftDefaultProvider !== global.defaultProvider) {
    patch.defaultProvider = draftDefaultProvider;
  } else if (previousRawWorker?.defaultProvider !== undefined) {
    patch.defaultProvider = null;
  }

  if (draftDefaultProvider === "luna") {
    if (draftDefaultProfile !== global.defaultProfile) {
      patch.defaultProfile = draftDefaultProfile;
    } else if (previousRawWorker?.defaultProfile !== undefined) {
      patch.defaultProfile = null;
    }
  } else if (previousRawWorker?.defaultProfile !== undefined) {
    patch.defaultProfile = null;
  }

  for (const mapName of MAP_NAMES) {
    const draftMap = draft?.[mapName] || {};
    const prevMap = previousRawWorker?.[mapName] || {};

    const allKeys = new Set([
      ...Object.keys(draftMap),
      ...Object.keys(prevMap),
    ]);

    /** @type {Record<string, object | null>} */
    const diff = {};
    for (const key of allKeys) {
      const draftRoute = resolveEffectiveRowRoute(mapName, key, draft, global);
      const globalRoute = resolveGlobalRowRoute(mapName, key, global);

      if (routesEqual(draftRoute, globalRoute)) {
        if (prevMap[key] !== undefined) {
          diff[key] = null;
        }
      } else {
        const prevRoute =
          prevMap[key] !== undefined ? normalizeRoute(prevMap[key]) : null;
        if (prevRoute && routesEqual(draftRoute, prevRoute)) {
          continue;
        }
        diff[key] = serializeRoute(draftRoute);
      }
    }
    if (Object.keys(diff).length > 0) {
      patch[mapName] = diff;
    }
  }

  return patch;
}

/**
 * @param {string} mapName
 * @param {string} key
 * @param {object} rawWorker
 * @param {object} globalRouting
 */
export function resolveRowSource(mapName, key, rawWorker, defaultRouting) {
  if (rawWorker?.[mapName]?.[key] !== undefined) return "tenant";
  if (defaultRouting?.[mapName]?.[key] !== undefined) return "default";
  return "default";
}

/**
 * @param {string} mapName
 * @param {string} key
 * @param {object} draft
 * @param {object} globalRouting
 */
export function resolveRowRoute(mapName, key, draft, globalRouting) {
  if (draft?.[mapName]?.[key] !== undefined) {
    return normalizeRoute(draft[mapName][key]);
  }
  if (globalRouting?.[mapName]?.[key] !== undefined) {
    return normalizeRoute(globalRouting[mapName][key]);
  }
  return {
    provider: draft?.defaultProvider || globalRouting?.defaultProvider || "luna",
    lunaProfile:
      draft?.defaultProfile || globalRouting?.defaultProfile || "planning",
  };
}

/**
 * @param {object[]} catalogEntries
 * @param {object} draft
 * @param {object} globalRouting
 * @param {string} mapName
 */
export function collectMapRowKeys(catalogEntries, draft, globalRouting, mapName) {
  const keys = new Set();
  for (const e of catalogEntries || []) {
    if (e?.key) keys.add(e.key);
  }
  for (const k of Object.keys(draft?.[mapName] || {})) keys.add(k);
  for (const k of Object.keys(globalRouting?.[mapName] || {})) keys.add(k);
  return [...keys].sort((a, b) => a.localeCompare(b));
}

/**
 * @param {object[]} catalogEntries
 * @param {string} key
 */
export function catalogLabelForKey(catalogEntries, key) {
  const row = (catalogEntries || []).find((e) => e.key === key);
  return row?.label || null;
}

/**
 * Draft apenas com overrides gravados no tenant (não o merge efetivo).
 * @param {object} rawWorker
 */
export function workerDraftFromRaw(rawWorker) {
  const w = rawWorker || {};
  /** @type {Record<string, unknown>} */
  const draft = {};
  if (w.defaultProvider != null) {
    draft.defaultProvider =
      String(w.defaultProvider).toLowerCase() === "cursor" ? "cursor" : "luna";
  }
  if (w.defaultProfile != null) {
    draft.defaultProfile = w.defaultProfile;
  }
  for (const mapName of MAP_NAMES) {
    if (!w[mapName] || typeof w[mapName] !== "object") continue;
    draft[mapName] = {};
    for (const [key, val] of Object.entries(w[mapName])) {
      draft[mapName][key] = normalizeRoute(val);
    }
  }
  return draft;
}

/**
 * @param {object} worker
 */
export function workerDraftFromEffective(worker) {
  const w = worker || {};
  const draft = {
    defaultProvider: w.defaultProvider || "luna",
    defaultProfile: w.defaultProfile || "planning",
  };
  for (const mapName of MAP_NAMES) {
    if (!w[mapName]) continue;
    draft[mapName] = {};
    for (const [key, val] of Object.entries(w[mapName])) {
      draft[mapName][key] = normalizeRoute(val);
    }
  }
  return draft;
}

/**
 * @param {object} globalRouting
 */
export function globalRoutingDraftFromConfig(globalRouting) {
  return workerDraftFromEffective(
    normalizeGlobalRouting(globalRouting)
  );
}
