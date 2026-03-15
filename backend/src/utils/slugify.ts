import slugLib from 'slug';

export function createSlug(text: string): string {
  return slugLib(text, { lower: true });
}

export async function uniqueSlug(
  base: string,
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  const baseSlug = createSlug(base);
  let slug = baseSlug;
  let counter = 2;

  while (await checkExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
