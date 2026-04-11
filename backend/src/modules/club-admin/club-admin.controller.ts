import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as service from './club-admin.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';

const searchSchema = z.object({
  q: z.string().min(1).max(100),
});

function parseId(val: string): number {
  const n = parseInt(val, 10);
  if (isNaN(n)) throw new AppError(400, 'Invalid ID.');
  return n;
}

export async function listCoaches(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.listClubCoaches(req.user!);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function searchUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const { q } = searchSchema.parse(req.query);
    const result = await service.searchUsersForPromotion(req.user!, q);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function promoteToCoach(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const result = await service.promoteToCoach(req.user!, id);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function demoteCoach(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const result = await service.demoteCoach(req.user!, id);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}
