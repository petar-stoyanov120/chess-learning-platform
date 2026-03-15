import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as authService from './auth.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';

const registerSchema = z.object({
  email: z.string().email('Invalid email address.'),
  username: z.string().min(3, 'Username must be at least 3 characters.').max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const body = registerSchema.parse(req.body);
    const result = await authService.register(body.email, body.username, body.password);
    sendSuccess(res, result, 201);
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(400, err.errors[0].message));
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const body = loginSchema.parse(req.body);
    const result = await authService.login(body.email, body.password);
    sendSuccess(res, result);
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(400, err.errors[0].message));
    next(err);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.body.refreshToken as string;
    if (!token) return next(new AppError(400, 'Refresh token is required.'));
    const result = await authService.refresh(token);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.body.refreshToken as string;
    if (token) await authService.logout(token);
    sendSuccess(res, { message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
}

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters.'),
});

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const body = changePasswordSchema.parse(req.body);
    const result = await authService.changePassword(req.user!.id, body.oldPassword, body.newPassword);
    sendSuccess(res, result);
  } catch (err) {
    if (err instanceof z.ZodError) return next(new AppError(400, err.errors[0].message));
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe(req.user!.id);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}
