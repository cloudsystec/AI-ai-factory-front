/**
 * Converte valor USD (cobrança ao cliente) para exibição em BRL.
 * @param {number} usd
 * @param {number} cotation taxa USD→BRL
 */
export function usdToBrl(usd, cotation) {
  const u = Number(usd);
  const c = Number(cotation);
  if (!Number.isFinite(u) || !Number.isFinite(c) || c <= 0) return NaN;
  return u * c;
}

/**
 * @param {number} usd
 * @param {number} cotation
 */
export function formatBrl(usd, cotation) {
  const brl = usdToBrl(usd, cotation);
  if (!Number.isFinite(brl)) return "—";
  return brl.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Referência USD (cinza, abaixo do R$). */
export function formatUsdRef(usd) {
  const n = Number(usd);
  if (!Number.isFinite(n)) return "—";
  return `$${n.toFixed(2)}`;
}

/** Custo base USD da BD (sem markup 15%). */
export function formatCostBaseUsd(usd) {
  const n = Number(usd);
  if (!Number.isFinite(n)) return "—";
  if (n === 0) return "$0.00";
  if (Math.abs(n) < 0.01) return `$${n.toFixed(6)}`;
  return `$${n.toFixed(2)}`;
}
