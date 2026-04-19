'use client';

import { useMemo } from 'react';
import katex from 'katex';

interface LatexTextProps {
  text: string;
  className?: string;
}

function renderLatex(raw: string): string {
  // Block math: $$...$$
  let out = raw.replace(/\$\$([^$]+?)\$\$/gs, (_, expr) => {
    try {
      return katex.renderToString(expr.trim(), { displayMode: true, throwOnError: false });
    } catch {
      return `<span class="text-red-500">$$${expr}$$</span>`;
    }
  });

  // Inline math: $...$  (not $$ — already handled above)
  out = out.replace(/\$([^$\n]+?)\$/g, (_, expr) => {
    try {
      return katex.renderToString(expr.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return `<span class="text-red-500">$${expr}$</span>`;
    }
  });

  // Preserve newlines for plain text
  out = out.replace(/\n/g, '<br/>');
  return out;
}

const HAS_LATEX = /\$[^$]/;

export function LatexText({ text, className }: LatexTextProps) {
  const html = useMemo(() => {
    if (!HAS_LATEX.test(text)) return null;
    return renderLatex(text);
  }, [text]);

  if (!html) {
    return <span className={className} style={{ whiteSpace: 'pre-wrap' }}>{text}</span>;
  }

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
