'use client';

import { useMemo } from 'react';

interface SanitizedHtmlProps {
  html: string;
  className?: string;
  as?: 'div' | 'article';
}

export default function SanitizedHtml({ html, className, as: Tag = 'div' }: SanitizedHtmlProps) {
  const clean = useMemo(() => {
    // dompurify requires a browser DOM — skip sanitization during SSR (Node.js).
    // Client-side hydration will re-run this with the real DOMPurify.
    // Return empty string during SSR — DOMPurify needs a real DOM.
    // Client hydration will re-run this with sanitized output.
    if (typeof window === 'undefined') return '';
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const raw = require('dompurify');
    // Handle both ESM default export and CJS module shapes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const purify: { sanitize: (html: string, cfg?: Record<string, unknown>) => string } = typeof (raw as any).sanitize === 'function' ? raw : (raw as any).default;
    return purify.sanitize(html, {
      // target="_blank" is safe and needed for external links; no other extras
      ADD_ATTR: ['target'],
    });
  }, [html]);

  return <Tag className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
