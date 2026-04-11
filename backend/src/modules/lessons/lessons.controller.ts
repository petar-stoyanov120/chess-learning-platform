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
  coverImageUrl: z.string().url('Cover image must be a valid URL.').optional().or(z.literal('')),
  metaDescription: z.string().max(300, 'Meta description must be at most 300 characters.').optional(),
  tagIds: z.array(z.number().int().positive()).optional(),
  diagrams: z.array(diagramSchema).optional(),
  variations: z.array(variationSchema).optional(),
});

const updateLessonSchema = createLessonSchema.partial();

export async function listPublished(req: Request, res: Response, next: NextFunction) {
  try {
    const { lessons, meta } = await lessonsService.listPublishedLessons(req.query as Record<string, string>);
    sendPaginated(res, lessons, meta);
  } catch (err) { next(err); }
}

export async function getBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const lesson = await lessonsService.getLessonBySlug(req.params.slug);
    // Fire-and-forget view count increment (never blocks the response)
    lessonsService.incrementViewCount(req.params.slug).catch(() => {});
    sendSuccess(res, lesson);
  } catch (err) { next(err); }
}

export async function getByCategoryAndLevel(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await lessonsService.getLessonsByCategoryAndLevel(req.params.categorySlug, req.params.levelName);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function getMyLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const lesson = await lessonsService.getMyLessonById(parseInt(req.params.id), req.user!.id);
    sendSuccess(res, lesson);
  } catch (err) { next(err); }
}

export async function getAdminLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const lesson = await lessonsService.getLessonById(parseInt(req.params.id));
    sendSuccess(res, lesson);
  } catch (err) { next(err); }
}

export async function createLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const result = createLessonSchema.safeParse(req.body);
    if (!result.success) return next(new AppError(400, result.error.errors[0].message));
    const lesson = await lessonsService.createLesson(req.user!.id, req.user!.role, result.data);
    sendSuccess(res, lesson, 201);
  } catch (err) { next(err); }
}

export async function updateLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const result = updateLessonSchema.safeParse(req.body);
    if (!result.success) return next(new AppError(400, result.error.errors[0].message));
    const lesson = await lessonsService.updateLesson(parseInt(req.params.id), req.user!.id, req.user!.role, result.data);
    sendSuccess(res, lesson);
  } catch (err) { next(err); }
}

export async function submitLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const lesson = await lessonsService.submitLesson(parseInt(req.params.id), req.user!.id, req.user!.role);
    sendSuccess(res, lesson);
  } catch (err) { next(err); }
}

export async function approveLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const lesson = await lessonsService.approveLesson(parseInt(req.params.id), req.user!.id);
    sendSuccess(res, lesson);
  } catch (err) { next(err); }
}

export async function rejectLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const result = z.object({ reason: z.string().min(1, 'Rejection reason is required.').max(1000, 'Rejection reason must be at most 1000 characters.') }).safeParse(req.body);
    if (!result.success) return next(new AppError(400, result.error.errors[0].message));
    const lesson = await lessonsService.rejectLesson(parseInt(req.params.id), result.data.reason);
    sendSuccess(res, lesson);
  } catch (err) { next(err); }
}

export async function deleteLesson(req: Request, res: Response, next: NextFunction) {
  try {
    await lessonsService.deleteLesson(parseInt(req.params.id));
    sendSuccess(res, { message: 'Lesson deleted.' });
  } catch (err) { next(err); }
}

export async function listAllAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const { lessons, meta } = await lessonsService.listAllLessons(req.query as Record<string, string>);
    sendPaginated(res, lessons, meta);
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
    const result = await lessonsService.reorderLesson(parseInt(req.params.id), req.body.sortOrder);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function markProgress(req: Request, res: Response, next: NextFunction) {
  try {
    await progressService.markLessonComplete(req.user!.id, req.params.slug);
    sendSuccess(res, { message: 'Progress recorded.' });
  } catch (err) { next(err); }
}

export async function getProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const progress = await progressService.getUserProgress(req.user!.id);
    sendSuccess(res, progress);
  } catch (err) { next(err); }
}

export async function getLessonRating(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await lessonsService.getLessonRating(req.params.slug, req.user?.id);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function rateLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const schema = z.object({ value: z.union([z.literal(1), z.literal(-1), z.literal(0)]) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(400, 'value must be 1, -1, or 0.'));
    const result = await lessonsService.rateLesson(req.user!.id, req.params.slug, parsed.data.value);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}
