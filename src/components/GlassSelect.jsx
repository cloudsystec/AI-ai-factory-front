import React from "react";

/**
 * Select nativo com visual glass padrão do sistema.
 * @param {{
 *   label?: React.ReactNode,
 *   fieldClassName?: string,
 *   labelClassName?: string,
 *   wrapClassName?: string,
 *   className?: string,
 *   id?: string,
 *   children: React.ReactNode,
 * } & React.SelectHTMLAttributes<HTMLSelectElement>} props
 */
export default function GlassSelect({
  label,
  fieldClassName = "",
  labelClassName = "glass-field__label",
  wrapClassName = "",
  className = "",
  id,
  children,
  ...selectProps
}) {
  const control = (
    <div className={`glass-select-wrap ${wrapClassName}`.trim()}>
      <select
        id={id}
        className={`glass-select ${className}`.trim()}
        {...selectProps}
      >
        {children}
      </select>
    </div>
  );

  if (!label) return control;

  return (
    <label className={`glass-field ${fieldClassName}`.trim()} htmlFor={id}>
      <span className={labelClassName}>{label}</span>
      {control}
    </label>
  );
}
