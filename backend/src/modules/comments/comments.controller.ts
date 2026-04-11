import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as service from './comments.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';

const createSchema = z.object({
  lessonId: z.number().int().positive('Invalid lesson ID.'),
  content: z.string().min(1, 'Comment cannot be empty.').max(2000, 'Comment is too long.'),
});

export async function getComments(req: Request, res: Response, next: NextFunction) {
  try {
    const lessonId = parseInt(req.query.lessonId as string);
    if (isNaN(lessonId)) return next(new AppError(400, 'lessonId query parameter is required.'));
    const result = await service.getCommentsByLesson(lessonId, req.query as Record<string, string>);
    res.json(result);
  } catch (err) { next(err); }
}

export async function createComment(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(400, parsed.error.errors[0].message));
    const comment = await service.createComment(req.user!.id, parsed.data.lessonId, parsed.data.content);
    sendSuccess(res, comment, 201);
  } catch (err) { next(err); }
}

export async function deleteComment(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return next(new AppError(400, 'Invalid comment ID.'));
    await service.deleteComment(id, req.user!.id, req.user!.role);
    sendSuccess(res, { message: 'Comment deleted.' });
  } catch (err) { next(err); }
}
