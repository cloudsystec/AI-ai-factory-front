import { createPortal } from "react-dom";

/**
 * Renderiza modais em document.body para escapar overflow/z-index dos cards da sidebar.
 * @param {{ children: React.ReactNode }} props
 */
export default function ModalPortal({ children }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
