import { Request, Response, NextFunction } from 'express';
import * as adminService from './admin.service';
import { sendSuccess } from '../../utils/apiResponse';

export async function getPending(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await adminService.getPendingSubmissions();
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function getStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await adminService.getDashboardStats();
    sendSuccess(res, stats);
  } catch (err) { next(err); }
}

export async function getRecentUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await adminService.getRecentUsers();
    sendSuccess(res, users);
  } catch (err) { next(err); }
}
