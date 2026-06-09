import React, { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faCheck } from "@fortawesome/free-solid-svg-icons";
import { AGENT_ROLE_KEYS } from "../agentRoleKeys.js";
import { getAgentRoleMeta } from "../lib/agentRoleMeta.js";

/**
 * @param {{
 *   value: string,
 *   onChange: (roleKey: string) => void,
 *   disabled?: boolean,
 *   excludeRoleKeys?: string[],
 * }} props
 */
export default function AgentRolePicker({
  value,
  onChange,
  disabled = false,
  excludeRoleKeys = [],
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const visibleKeys = useMemo(() => {
    const hidden = new Set(excludeRoleKeys);
    return AGENT_ROLE_KEYS.filter((key) => !hidden.has(key));
  }, [excludeRoleKeys]);
  const selected = getAgentRoleMeta(value);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      className={`agent-role-picker${open ? " agent-role-picker--open" : ""}`}
      ref={wrapRef}
    >
      <span className="agent-role-picker__label">Papel do agente</span>
      <button
        type="button"
        className="agent-role-picker__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        <span
          className={`agent-role-picker__icon agent-role-picker__icon--${selected.tone}`}
          aria-hidden
        >
          <FontAwesomeIcon icon={selected.icon} />
        </span>
        <span className="agent-role-picker__trigger-text">
          <span className="agent-role-picker__name">{selected.label}</span>
          <span className="agent-role-picker__hint">{selected.description}</span>
        </span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className="agent-role-picker__chevron"
          aria-hidden
        />
      </button>

      {open && (
        <ul className="agent-role-picker__menu glass-menu custom-scrollbar" role="listbox">
          {visibleKeys.map((key) => {
            const meta = getAgentRoleMeta(key);
            const isActive = key === value;
            return (
              <li key={key} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  className={`agent-role-picker__option${isActive ? " agent-role-picker__option--active" : ""}`}
                  onClick={() => {
                    onChange(key);
                    setOpen(false);
                  }}
                >
                  <span
                    className={`agent-role-picker__icon agent-role-picker__icon--${meta.tone}`}
                    aria-hidden
                  >
                    <FontAwesomeIcon icon={meta.icon} />
                  </span>
                  <span className="agent-role-picker__option-text">
                    <span className="agent-role-picker__name">{meta.label}</span>
                    <span className="agent-role-picker__hint">{meta.description}</span>
                  </span>
                  {isActive ? (
                    <FontAwesomeIcon
                      icon={faCheck}
                      className="agent-role-picker__check"
                      aria-hidden
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
