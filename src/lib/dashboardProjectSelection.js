const LEGACY_KEY = "ai-factory-dashboard-project";
const KEY_PREFIX = "ai-factory-dashboard-project:";

/** @param {string|{ slug: string }} p */
export function projectSlug(p) {
  return typeof p === "string" ? p : p.slug;
}

/** @param {string|null|undefined} tenantId */
export function dashboardProjectStorageKey(tenantId) {
  if (!tenantId) return null;
  return `${KEY_PREFIX}${tenantId}`;
}

/** @param {string|null|undefined} tenantId */
export function readStoredDashboardProject(tenantId) {
  if (!tenantId) return "";
  try {
    const key = dashboardProjectStorageKey(tenantId);
    return key ? localStorage.getItem(key) || "" : "";
  } catch {
    return "";
  }
}

/**
 * @param {string|null|undefined} tenantId
 * @param {string} slug
 */
export function writeStoredDashboardProject(tenantId, slug) {
  if (!tenantId) return;
  try {
    const key = dashboardProjectStorageKey(tenantId);
    if (!key) return;
    if (slug) {
      localStorage.setItem(key, slug);
    } else {
      localStorage.removeItem(key);
    }
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
}

export function clearAllDashboardProjectStorage() {
  try {
    localStorage.removeItem(LEGACY_KEY);
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}

/**
 * @param {Array<string|{ slug: string }>} projects
 * @param {string} slug
 */
export function projectExistsInList(projects, slug) {
  if (!slug || !Array.isArray(projects)) return false;
  return projects.some((p) => projectSlug(p) === slug);
}

/**
 * @param {Array<string|{ slug: string }>} projects
 * @param {string} currentSlug
 * @param {string} storedSlug
 * @returns {string}
 */
export function resolveSelectedProject(projects, currentSlug, storedSlug) {
  if (!projects || projects.length === 0) {
    return "";
  }

  const slugs = projects.map(projectSlug);

  if (currentSlug && slugs.includes(currentSlug)) {
    return currentSlug;
  }

  if (storedSlug && slugs.includes(storedSlug)) {
    return storedSlug;
  }

  return slugs[0] || "";
}
