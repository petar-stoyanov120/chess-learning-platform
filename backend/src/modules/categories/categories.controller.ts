import { Request, Response, NextFunction } from 'express';
import * as categoriesService from './categories.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';

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
    const { name, slug, description } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) return next(new AppError(400, 'Category name is required.'));
    if (!slug || typeof slug !== 'string' || !slug.trim()) return next(new AppError(400, 'Category slug is required.'));
    const category = await categoriesService.createCategory({ name: name.trim(), slug: slug.trim(), description });
    sendSuccess(res, category, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return next(new AppError(400, 'Invalid category ID.'));
    const category = await categoriesService.updateCategory(id, req.body);
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
    const { name, sortOrder } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) return next(new AppError(400, 'Difficulty level name is required.'));
    if (sortOrder === undefined || typeof sortOrder !== 'number') return next(new AppError(400, 'Sort order (number) is required.'));
    const level = await categoriesService.createDifficultyLevel({ name: name.trim(), sortOrder });
    sendSuccess(res, level, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateDifficultyLevel(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return next(new AppError(400, 'Invalid difficulty level ID.'));
    const level = await categoriesService.updateDifficultyLevel(id, req.body);
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
