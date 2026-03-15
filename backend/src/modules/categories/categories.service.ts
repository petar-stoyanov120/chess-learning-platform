import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { invalidateCategoryCache, invalidateLevelCache } from '../../config/statusCache';

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { lessons: true } } },
  });
}

export async function getCategory(slug: string) {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: { _count: { select: { lessons: true } } },
  });
  if (!category) throw new AppError(404, 'Category not found.');
  return category;
}

export async function createCategory(data: { name: string; slug: string; description?: string }) {
  const result = await prisma.category.create({ data });
  await invalidateCategoryCache();
  return result;
}

export async function updateCategory(id: number, data: { name?: string; description?: string }) {
  const cat = await prisma.category.findUnique({ where: { id } });
  if (!cat) throw new AppError(404, 'Category not found.');
  const result = await prisma.category.update({ where: { id }, data });
  await invalidateCategoryCache();
  return result;
}

export async function deleteCategory(id: number) {
  const cat = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { lessons: true } } },
  });
  if (!cat) throw new AppError(404, 'Category not found.');
  if (cat._count.lessons > 0) throw new AppError(400, 'Cannot delete category with existing lessons.');
  await prisma.category.delete({ where: { id } });
  await invalidateCategoryCache();
}

export async function listDifficultyLevels() {
  return prisma.difficultyLevel.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { lessons: true } } },
  });
}

export async function createDifficultyLevel(data: { name: string; sortOrder: number }) {
  const result = await prisma.difficultyLevel.create({ data });
  await invalidateLevelCache();
  return result;
}

export async function updateDifficultyLevel(id: number, data: { name?: string; sortOrder?: number }) {
  const level = await prisma.difficultyLevel.findUnique({ where: { id } });
  if (!level) throw new AppError(404, 'Difficulty level not found.');
  const result = await prisma.difficultyLevel.update({ where: { id }, data });
  await invalidateLevelCache();
  return result;
}

export async function deleteDifficultyLevel(id: number) {
  const level = await prisma.difficultyLevel.findUnique({
    where: { id },
    include: { _count: { select: { lessons: true } } },
  });
  if (!level) throw new AppError(404, 'Difficulty level not found.');
  if (level._count.lessons > 0) throw new AppError(400, 'Cannot delete difficulty level with existing lessons.');
  await prisma.difficultyLevel.delete({ where: { id } });
  await invalidateLevelCache();
}
