import React from "react";

/**
 * Shell visual partilhado (fundo, orbs) para páginas e telas fora do dashboard.
 * @param {{ children: React.ReactNode, className?: string }} props
 */
export default function AppGlassLayout({ children, className = "" }) {
  return (
    <div className="app-glass-shell">
      <div className="app-glass-shell__orb app-glass-shell__orb--1" aria-hidden />
      <div className="app-glass-shell__orb app-glass-shell__orb--2" aria-hidden />
      <div className="app-glass-shell__orb app-glass-shell__orb--3" aria-hidden />
      <div className={`app-glass-shell__inner${className ? ` ${className}` : ""}`}>
        {children}
      </div>
    </div>
  );
}
