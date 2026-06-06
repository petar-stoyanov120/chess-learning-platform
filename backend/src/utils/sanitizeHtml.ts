import sanitizeHtml from 'sanitize-html';

/**
 * Sanitizes user-authored rich HTML (from Tiptap) before persistence.
 * Strips scripts, event handlers, iframes, inline styles, and any images
 * not served from our own /uploads/ path.
 */
export function sanitize(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'strong', 'em', 'u', 's',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
      th: ['colspan', 'rowspan'],
      td: ['colspan', 'rowspan'],
    },
    // Only http/https are valid link schemes; javascript: and data: are stripped.
    allowedSchemes: ['http', 'https'],
    allowedSchemesAppliedToAttributes: ['href'],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, rel: 'noopener noreferrer' },
      }),
      // Only allow images served from our own upload path.
      img: (_tagName, attribs) => {
        const src: string = attribs['src'] ?? '';
        if (!src.startsWith('/uploads/')) {
          return { tagName: 'span', attribs: {} };
        }
        return { tagName: 'img', attribs };
      },
    },
    disallowedTagsMode: 'discard',
  });
}
