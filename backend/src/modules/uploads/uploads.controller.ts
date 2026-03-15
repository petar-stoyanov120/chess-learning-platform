import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../middleware/errorHandler';
import { sendSuccess } from '../../utils/apiResponse';

export async function uploadImage(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError(400, 'No image file provided.');
    const url = `/uploads/${req.file.filename}`;
    sendSuccess(res, { url }, 201);
  } catch (err) {
    next(err);
  }
}
