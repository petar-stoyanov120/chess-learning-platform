import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as bookmarksService from './bookmarks.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';

const addBookmarkSchema = z.object({
  lessonId: z.number().int().positive('Invalid lesson ID.'),
});

export async function listBookmarks(req: Request, res: Response, next: NextFunction) {
  try {
    const { bookmarks, meta } = await bookmarksService.listBookmarks(
      req.user!.id,
      req.query as Record<string, string>,
    );
    sendPaginated(res, bookmarks, meta);
  } catch (err) {
    next(err);
  }
}

export async function addBookmark(req: Request, res: Response, next: NextFunction) {
  try {
    const result = addBookmarkSchema.safeParse(req.body);
    if (!result.success) return next(new AppError(400, result.error.errors[0].message));
    const bookmark = await bookmarksService.addBookmark(req.user!.id, result.data.lessonId);
    sendSuccess(res, bookmark, 201);
  } catch (err) {
    next(err);
  }
}

export async function removeBookmark(req: Request, res: Response, next: NextFunction) {
  try {
    const lessonId = parseInt(req.params.lessonId);
    if (isNaN(lessonId)) return next(new AppError(400, 'Invalid lesson ID.'));
    await bookmarksService.removeBookmark(req.user!.id, lessonId);
    sendSuccess(res, { message: 'Bookmark removed.' });
  } catch (err) {
    next(err);
  }
}

export async function checkBookmarks(req: Request, res: Response, next: NextFunction) {
  try {
    const idsParam = req.query.lessonIds as string;
    if (!idsParam) return sendSuccess(res, { bookmarkedLessonIds: [] });
    const lessonIds = idsParam.split(',').map(Number).filter((n) => !isNaN(n) && n > 0);
    const bookmarkedIds = await bookmarksService.checkBookmarks(req.user!.id, lessonIds);
    sendSuccess(res, { bookmarkedLessonIds: bookmarkedIds });
  } catch (err) {
    next(err);
  }
}
