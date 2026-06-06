import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as lessonsService from './lessons.service';
import * as progressService from './progress.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';
import { variationSchema } from '../../schemas/common';

const diagramSchema = z.object({
  fen: z.string().min(1, 'FEN string is required.').max(512, 'FEN string is too long.'),
  caption: z.string().max(500).optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

const createLessonSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.').max(200, 'Title must be at most 200 characters.'),
  content: z.string().min(1, 'Content is required.'),
  excerpt: z.string().max(500).optional(),
  categoryId: z.number().int().positive('Invalid category.'),
  difficultyLevelId: z.number().int().positive('Invalid difficulty level.'),
  diagrams: z.array(diagramSchema).optional(),
  variations: z.array(variationSchema).optional(),
});

const updateLessonSchema = createLessonSchema.partial();

const setStatusSchema = z.object({ status: z.enum(['draft', 'ready']) });

function parseId(value: string): number {
  const id = parseInt(value, 10);
  if (isNaN(id)) throw new AppError(400, 'Invalid lesson id.');
  return id;
}

export async function listLessons(req: Request, res: Response, next: NextFunction) {
  try {
    const { lessons, meta } = await lessonsService.listLessons(req.query as Record<string, string>);
    sendPaginated(res, lessons, meta);
  } catch (err) { next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const lesson = await lessonsService.getLessonById(parseId(req.params.id));
    sendSuccess(res, lesson);
  } catch (err) { next(err); }
}

export async function getMyLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const lesson = await lessonsService.getMyLessonById(parseId(req.params.id), req.user!.id);
    sendSuccess(res, lesson);
  } catch (err) { next(err); }
}

export async function createLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const result = createLessonSchema.safeParse(req.body);
    if (!result.success) return next(new AppError(400, result.error.errors[0].message));
    const lesson = await lessonsService.createLesson(req.user!.id, result.data);
    sendSuccess(res, lesson, 201);
  } catch (err) { next(err); }
}

export async function updateLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const result = updateLessonSchema.safeParse(req.body);
    if (!result.success) return next(new AppError(400, result.error.errors[0].message));
    const lesson = await lessonsService.updateLesson(parseId(req.params.id), req.user!.id, req.user!.role, result.data);
    sendSuccess(res, lesson);
  } catch (err) { next(err); }
}

export async function setStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const result = setStatusSchema.safeParse(req.body);
    if (!result.success) return next(new AppError(400, result.error.errors[0].message));
    const lesson = await lessonsService.setLessonStatus(parseId(req.params.id), req.user!.id, req.user!.role, result.data.status);
    sendSuccess(res, lesson);
  } catch (err) { next(err); }
}

export async function deleteLesson(req: Request, res: Response, next: NextFunction) {
  try {
    await lessonsService.deleteLesson(parseId(req.params.id));
    sendSuccess(res, { message: 'Lesson deleted.' });
  } catch (err) { next(err); }
}

export async function listDeleted(req: Request, res: Response, next: NextFunction) {
  try {
    const { lessons, meta } = await lessonsService.listDeletedLessons(req.query as Record<string, string>);
    sendPaginated(res, lessons, meta);
  } catch (err) { next(err); }
}

export async function restoreLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const lesson = await lessonsService.restoreLesson(parseId(req.params.id));
    sendSuccess(res, lesson);
  } catch (err) { next(err); }
}

export async function hardDeleteLesson(req: Request, res: Response, next: NextFunction) {
  try {
    await lessonsService.hardDeleteLesson(parseId(req.params.id));
    sendSuccess(res, { message: 'Lesson permanently deleted.' });
  } catch (err) { next(err); }
}

export async function listMine(req: Request, res: Response, next: NextFunction) {
  try {
    const { lessons, meta } = await lessonsService.listMyLessons(req.user!.id, req.query as Record<string, string>);
    sendPaginated(res, lessons, meta);
  } catch (err) { next(err); }
}

export async function reorderLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await lessonsService.reorderLesson(parseId(req.params.id), req.body.sortOrder);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function markProgress(req: Request, res: Response, next: NextFunction) {
  try {
    await progressService.markLessonComplete(req.user!.id, parseId(req.params.id));
    sendSuccess(res, { message: 'Progress recorded.' });
  } catch (err) { next(err); }
}

export async function getProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const progress = await progressService.getUserProgress(req.user!.id);
    sendSuccess(res, progress);
  } catch (err) { next(err); }
}
