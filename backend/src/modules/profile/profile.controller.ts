import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as profileService from './profile.service';
import * as avatarService from './avatar.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';
import { getDailyPostCount, DAILY_LIMIT } from '../../utils/dailyLimit';

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
});

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const result = updateProfileSchema.safeParse(req.body);
    if (!result.success) return next(new AppError(400, result.error.errors[0].message));
    const user = await profileService.updateProfile(req.user!.id, result.data);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function uploadAvatar(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) return next(new AppError(400, 'No avatar file provided.'));
    const avatarUrl = await avatarService.uploadAvatar(req.user!.id, req.file);
    sendSuccess(res, { avatarUrl });
  } catch (err) {
    next(err);
  }
}

export async function removeAvatar(req: Request, res: Response, next: NextFunction) {
  try {
    await avatarService.removeAvatar(req.user!.id);
    sendSuccess(res, { message: 'Avatar removed.' });
  } catch (err) {
    next(err);
  }
}

export async function getDailyLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const used = await getDailyPostCount(req.user!.id);
    const remaining = Math.max(0, DAILY_LIMIT - used);
    sendSuccess(res, { used, limit: DAILY_LIMIT, remaining, canPost: remaining > 0 });
  } catch (err) {
    next(err);
  }
}
