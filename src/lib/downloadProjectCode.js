import { apiFetch } from "../api.js";

/**
 * Descarrega ZIP do código de um projecto finalizado.
 * @param {string} projectSlug
 */
export async function downloadProjectCode(projectSlug) {
  const res = await apiFetch(
    `/api/projects/${encodeURIComponent(projectSlug)}/download-code`,
    { cache: "no-store" }
  );

  const contentType = res.headers.get("Content-Type") || "";
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || res.statusText || "Download falhou");
  }

  if (
    contentType.includes("application/json") ||
    (!contentType.includes("zip") && !contentType.includes("octet-stream"))
  ) {
    const text = await res.text();
    throw new Error(
      text.slice(0, 200) || "Resposta inválida do servidor (não é ZIP)."
    );
  }

  const blob = await res.blob();
  if (blob.size < 22) {
    throw new Error("Arquivo ZIP vazio ou corrompido.");
  }

  const cd = res.headers.get("Content-Disposition") || "";
  const match = cd.match(/filename="?([^";]+)"?/i);
  const fileName = match?.[1] || `${projectSlug}-code.zip`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
