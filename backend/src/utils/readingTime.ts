export function estimateReadingTime(html: string): number {
  const text = html
    .replace(/<[^>]*>/g, ' ')   // tags → spaces so adjacent tags don't join words
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#\d+;/g, ' ');   // numeric entities → spaces
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}
