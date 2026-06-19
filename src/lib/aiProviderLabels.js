/** Valores enviados/recebidos da API — não alterar. */
export const AI_PROVIDER_ONLINE = "cursor";
export const AI_PROVIDER_LUNA = "luna";

/**
 * Rótulo amigável do provedor IA (sem expor marcas internas ao cliente).
 * @param {string | null | undefined} provider
 */
export function formatAiProviderLabel(provider) {
  const value = String(provider || "").trim().toLowerCase();
  if (value === AI_PROVIDER_ONLINE) return "Online";
  if (value === AI_PROVIDER_LUNA) return "Luna";
  return provider ? String(provider) : "—";
}

/** @param {string | null | undefined} botMode */
export function formatBotModeLabel(botMode) {
  return formatAiProviderLabel(botMode);
}
