import React from "react";

/** @param {{ onClick: () => void, disabled?: boolean }} props */
export default function MacroHelpTrigger({ onClick, disabled = false }) {
  return (
    <button
      type="button"
      className="macro-help-trigger"
      onClick={onClick}
      disabled={disabled}
    >
      Precisa de Ajuda com o escopo?
    </button>
  );
}
