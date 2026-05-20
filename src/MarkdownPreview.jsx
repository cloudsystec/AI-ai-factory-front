import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** @param {{ content: string, className?: string }} props */
export default function MarkdownPreview({ content, className = "" }) {
  if (!content) return null;

  return (
    <div className={`md-preview ${className}`.trim()}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
