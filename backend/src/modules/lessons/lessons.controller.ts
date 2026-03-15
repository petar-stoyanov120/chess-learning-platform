import { Request, Response, NextFunction } from 'express';
import * as lessonsService from './lessons.service';
import * as progressService from './progress.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';

export async function listPublished(req: Request, res: Response, next: NextFunction) {
  try {
    const { lessons, meta } = await lessonsService.listPublishedLessons(req.query as Record<string, string>);
    sendPaginated(res, lessons, meta);
  } catch (err) { next(err); }
}

export async function getBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const lesson = await lessonsService.getLessonBySlug(req.params.slug);
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
    const lesson = await lessonsService.createLesson(req.user!.id, req.user!.role, req.body);
    sendSuccess(res, lesson, 201);
  } catch (err) { next(err); }
}

export async function updateLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const lesson = await lessonsService.updateLesson(parseInt(req.params.id), req.user!.id, req.user!.role, req.body);
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
    const reason = req.body.reason as string;
    if (!reason) return next(new AppError(400, 'Rejection reason is required.'));
    const lesson = await lessonsService.rejectLesson(parseInt(req.params.id), reason);
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
