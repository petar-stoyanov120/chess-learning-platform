import { sanitize } from '../utils/sanitizeHtml';

describe('sanitize()', () => {
  it('strips <script> tags and their content', () => {
    const result = sanitize('<p>Hello</p><script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
    expect(result).toContain('<p>Hello</p>');
  });

  it('strips event handler attributes', () => {
    const result = sanitize('<img src="/uploads/a.jpg" onerror="alert(1)">');
    expect(result).not.toContain('onerror');
    expect(result).toContain('/uploads/a.jpg');
  });

  it('strips both <script> and onerror in the same input', () => {
    const dirty = '<p>ok</p><script>evil()</script><img src="/uploads/x.png" onerror="evil()">';
    const clean = sanitize(dirty);
    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('onerror');
  });

  it('allows headings, paragraphs, bold, italic, and lists', () => {
    const html = '<h2>Title</h2><p><strong>bold</strong> <em>italic</em></p><ul><li>item</li></ul>';
    expect(sanitize(html)).toBe(html);
  });

  it('allows images served from /uploads/', () => {
    const result = sanitize('<img src="/uploads/photo.jpg" alt="photo">');
    expect(result).toContain('/uploads/photo.jpg');
  });

  it('strips images with external src', () => {
    const result = sanitize('<img src="https://evil.com/xss.jpg" alt="x">');
    expect(result).not.toContain('<img');
    expect(result).not.toContain('evil.com');
  });

  it('allows http/https links', () => {
    const result = sanitize('<a href="https://example.com">link</a>');
    expect(result).toContain('href="https://example.com"');
  });

  it('strips javascript: links', () => {
    const result = sanitize('<a href="javascript:alert(1)">click</a>');
    expect(result).not.toContain('javascript:');
  });
});
