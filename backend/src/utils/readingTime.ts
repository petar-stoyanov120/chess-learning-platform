export function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, '');
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}
