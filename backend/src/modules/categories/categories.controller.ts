import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as categoriesService from './categories.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';

const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required.').max(100),
  slug: z.string().min(1, 'Category slug is required.').max(100),
  description: z.string().max(500).optional(),
});

const updateCategorySchema = createCategorySchema.partial();

const createDifficultyLevelSchema = z.object({
  name: z.string().min(1, 'Difficulty level name is required.').max(100),
  sortOrder: z.number().int().nonnegative('Sort order must be a non-negative integer.'),
});

const updateDifficultyLevelSchema = createDifficultyLevelSchema.partial();

export async function listCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await categoriesService.listCategories();
    sendSuccess(res, categories);
  } catch (err) {
    next(err);
  }
}

export async function getCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await categoriesService.getCategory(req.params.slug);
    sendSuccess(res, category);
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const result = createCategorySchema.safeParse(req.body);
    if (!result.success) return next(new AppError(400, result.error.errors[0].message));
    const category = await categoriesService.createCategory({
      name: result.data.name.trim(),
      slug: result.data.slug.trim(),
      description: result.data.description,
    });
    sendSuccess(res, category, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return next(new AppError(400, 'Invalid category ID.'));
    const result = updateCategorySchema.safeParse(req.body);
    if (!result.success) return next(new AppError(400, result.error.errors[0].message));
    const category = await categoriesService.updateCategory(id, result.data);
    sendSuccess(res, category);
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return next(new AppError(400, 'Invalid category ID.'));
    await categoriesService.deleteCategory(id);
    sendSuccess(res, { message: 'Category deleted.' });
  } catch (err) {
    next(err);
  }
}

export async function listDifficultyLevels(_req: Request, res: Response, next: NextFunction) {
  try {
    const levels = await categoriesService.listDifficultyLevels();
    sendSuccess(res, levels);
  } catch (err) {
    next(err);
  }
}

export async function createDifficultyLevel(req: Request, res: Response, next: NextFunction) {
  try {
    const result = createDifficultyLevelSchema.safeParse(req.body);
    if (!result.success) return next(new AppError(400, result.error.errors[0].message));
    const level = await categoriesService.createDifficultyLevel({ name: result.data.name.trim(), sortOrder: result.data.sortOrder });
    sendSuccess(res, level, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateDifficultyLevel(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return next(new AppError(400, 'Invalid difficulty level ID.'));
    const result = updateDifficultyLevelSchema.safeParse(req.body);
    if (!result.success) return next(new AppError(400, result.error.errors[0].message));
    const level = await categoriesService.updateDifficultyLevel(id, result.data);
    sendSuccess(res, level);
  } catch (err) {
    next(err);
  }
}

export async function deleteDifficultyLevel(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return next(new AppError(400, 'Invalid difficulty level ID.'));
    await categoriesService.deleteDifficultyLevel(id);
    sendSuccess(res, { message: 'Difficulty level deleted.' });
  } catch (err) {
    next(err);
  }
}
