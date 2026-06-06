import { prisma } from './database';

export interface CachedCategory { id: number; name: string; slug: string; }
export interface CachedLevel { id: number; name: string; sortOrder: number; }

let categoriesCache: CachedCategory[] = [];
let levelsCache: CachedLevel[] = [];

export async function loadStatusCache() {
  await reloadCategoryCache();
  await reloadLevelCache();
}

async function reloadCategoryCache() {
  categoriesCache = await prisma.category.findMany({ orderBy: { name: 'asc' } });
}

async function reloadLevelCache() {
  levelsCache = await prisma.difficultyLevel.findMany({ orderBy: { sortOrder: 'asc' } });
}

export function getCategoryBySlug(slug: string): CachedCategory | undefined {
  return categoriesCache.find((c) => c.slug === slug);
}

export function getLevelByName(name: string): CachedLevel | undefined {
  return levelsCache.find((l) => l.name === name);
}

export async function invalidateCategoryCache() {
  await reloadCategoryCache();
}

export async function invalidateLevelCache() {
  await reloadLevelCache();
}
