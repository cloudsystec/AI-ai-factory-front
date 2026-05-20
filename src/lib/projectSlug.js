/**
 * Validação e sugestão de slug (sem depender do orchestrator).
 * @param {string} project
 */
export function isValidProjectSlug(project) {
  return typeof project === "string" && /^[a-zA-Z0-9_-]+$/.test(project);
}

/**
 * @param {string} name
 * @returns {string}
 */
export function suggestSlugFromName(name) {
  if (typeof name !== "string") return "";
  let s = name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  s = s.replace(/[\s_]+/g, "-");
  s = s.replace(/[^a-z0-9-]+/g, "");
  s = s.replace(/-+/g, "-").replace(/^-|-$/g, "");
  return s;
}
