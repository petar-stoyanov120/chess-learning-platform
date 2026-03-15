import { prisma } from './database';

type StatusName = 'draft' | 'pending_review' | 'published' | 'rejected';

const statusCache: Partial<Record<StatusName, number>> = {};

export interface CachedCategory { id: number; name: string; slug: string; }
export interface CachedLevel { id: number; name: string; sortOrder: number; }

let categoriesCache: CachedCategory[] = [];
let levelsCache: CachedLevel[] = [];

export async function loadStatusCache() {
  const statuses = await prisma.postStatus.findMany();
  for (const s of statuses) {
    statusCache[s.name as StatusName] = s.id;
  }
  await reloadCategoryCache();
  await reloadLevelCache();
}

export function getStatusId(name: StatusName): number {
  const id = statusCache[name];
  if (!id) throw new Error(`Status "${name}" not found in cache. Was the database seeded?`);
  return id;
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
