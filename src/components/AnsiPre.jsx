import React, { useMemo } from "react";

const ANSI_COLORS = {
  "30": "#1a1a1a",
  "31": "#e74c3c",
  "32": "#2ecc71",
  "33": "#f1c40f",
  "34": "#3498db",
  "35": "#9b59b6",
  "36": "#1abc9c",
  "37": "#ecf0f1",
  "90": "#7f8c8d",
  "91": "#e74c3c",
  "92": "#2ecc71",
  "93": "#f1c40f",
  "94": "#3498db",
  "95": "#9b59b6",
  "96": "#1abc9c",
  "97": "#ecf0f1",
};

function ansiToSpans(text) {
  if (!text) return null;
  const parts = text.split(/(\x1b\[[0-9;]*m)/);
  const result = [];
  let style = {};
  let key = 0;
  for (const part of parts) {
    const m = part.match(/^\x1b\[([0-9;]*)m$/);
    if (m) {
      const codes = m[1].split(";");
      for (const c of codes) {
        if (c === "0" || c === "") style = {};
        else if (c === "1") style = { ...style, fontWeight: "bold" };
        else if (c === "2") style = { ...style, opacity: 0.7 };
        else if (ANSI_COLORS[c]) style = { ...style, color: ANSI_COLORS[c] };
      }
    } else if (part) {
      result.push(
        Object.keys(style).length > 0 ? (
          <span key={key++} style={style}>
            {part}
          </span>
        ) : (
          part
        )
      );
    }
  }
  return result;
}

/**
 * @param {{ text: string, innerRef?: React.RefObject<HTMLPreElement|null>, className?: string }} props
 */
export default function AnsiPre({ text, innerRef, className }) {
  const rendered = useMemo(() => {
    if (!text) return null;
    return text.split("\n").map((line, i) => (
      <React.Fragment key={i}>
        {i > 0 && "\n"}
        {ansiToSpans(line)}
      </React.Fragment>
    ));
  }, [text]);

  return (
    <pre ref={innerRef} className={className}>
      {rendered}
    </pre>
  );
}

export function lineMatchesLogFilter(line, filter) {
  if (!filter || filter === "all") return true;
  const lower = String(line || "").toLowerCase();
  if (filter === "ok") {
    return /\[ok\]|success|✓|conclu/i.test(line) || /\x1b\[32m/.test(line);
  }
  if (filter === "err") {
    return /\[err\]|error|falhou|✗/i.test(line) || /\x1b\[31m/.test(line);
  }
  if (filter === "warn") {
    return /\[warn\]|warning|aviso/i.test(line) || /\x1b\[33m/.test(line);
  }
  if (filter === "inf") {
    return /\[inf\]|info|\[info\]/i.test(line) || /\x1b\[36m/.test(line);
  }
  if (filter === "done") {
    return /\[done\]|done|conclu|finaliz|complete/i.test(line) || /\x1b\[35m/.test(line);
  }
  return true;
}
