/** @type {Record<string, string>} */
const SLUG_ALIASES = {
  postgresql: "postgresql",
  postgres: "postgresql",
  pg: "postgresql",
  react: "react",
  vite: "vite",
  node: "nodedotjs",
  nodejs: "nodedotjs",
  "node.js": "nodedotjs",
  express: "express",
  railway: "railway",
  redis: "redis",
  whatsapp: "whatsapp",
  gowa: "whatsapp",
  docker: "docker",
  stripe: "stripe",
  postmark: "postmark",
  typescript: "typescript",
  javascript: "javascript",
  nginx: "nginx",
  kubernetes: "kubernetes",
  aws: "amazonaws",
  s3: "amazons3",
  gcp: "googlecloud",
  azure: "microsoftazure",
  mongodb: "mongodb",
  mysql: "mysql",
  rabbitmq: "rabbitmq",
  kafka: "apachekafka",
  graphql: "graphql",
  openapi: "openapiinitiative",
  twilio: "twilio",
  sendgrid: "sendgrid",
  firebase: "firebase",
  supabase: "supabase",
  vercel: "vercel",
  netlify: "netlify",
  github: "github",
  gitlab: "gitlab",
};

/** @type {Record<string, string>} */
const TYPE_DEFAULT_SLUG = {
  frontend: "react",
  backend: "nodedotjs",
  database: "postgresql",
  cache: "redis",
  queue: "rabbitmq",
  external: "openapiinitiative",
  storage: "amazons3",
  cdn: "cloudflare",
};

/**
 * @param {string} text
 */
function normalizeKey(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Resolve slug Simple Icons a partir do nó.
 * @param {{ icon?: string, vendor?: string, label?: string, type?: string }} node
 * @returns {string|null}
 */
export function resolveInfraIconSlug(node) {
  const candidates = [node.icon, node.vendor, node.label].filter(Boolean);
  for (const raw of candidates) {
    const key = normalizeKey(raw);
    if (SLUG_ALIASES[key]) return SLUG_ALIASES[key];
    if (/^[a-z0-9]+$/i.test(key) && key.length >= 2) return key;
    for (const [alias, slug] of Object.entries(SLUG_ALIASES)) {
      if (key.includes(alias)) return slug;
    }
    if (key.includes("postgres")) return "postgresql";
    if (key.includes("whatsapp")) return "whatsapp";
    if (key.includes("railway")) return "railway";
    if (key.includes("postmark") || key.includes("email")) return "postmark";
    if (key.includes("react")) return "react";
    if (key.includes("node")) return "nodedotjs";
    if (key.includes("erp")) return null;
  }
  const type = normalizeKey(node.type);
  return TYPE_DEFAULT_SLUG[type] || null;
}

/**
 * @param {{ icon?: string, vendor?: string, label?: string, type?: string }} node
 * @returns {string|null}
 */
export function resolveInfraIconUrl(node) {
  const slug = resolveInfraIconSlug(node);
  if (!slug) return null;
  return `https://cdn.simpleicons.org/${slug}/e2e8f0`;
}

/**
 * @param {string} [label]
 */
export function infraIconFallbackLetter(label) {
  const t = String(label || "?").trim();
  if (!t) return "?";
  const parts = t.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return t.slice(0, 2).toUpperCase();
}
