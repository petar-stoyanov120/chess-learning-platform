'use client';

import { useMemo } from 'react';
import DOMPurify from 'dompurify';

interface SanitizedHtmlProps {
  html: string;
  className?: string;
  as?: 'div' | 'article';
}

export default function SanitizedHtml({ html, className, as: Tag = 'div' }: SanitizedHtmlProps) {
  const clean = useMemo(() => {
    if (typeof window === 'undefined') return html;
    return DOMPurify.sanitize(html, {
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'target'],
    });
  }, [html]);

  return <Tag className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
