import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import { AppError } from './errorHandler';
import { prisma } from '../config/database';

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  role: string;
  clubId: number | null;
  tokenVersion: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Sets req.user if a valid token is present, but never returns 401 — for public routes that behave differently when authenticated.
export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, jwtConfig.accessSecret) as AuthUser;
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { tokenVersion: true, isActive: true },
    });
    if (dbUser && dbUser.isActive && dbUser.tokenVersion === payload.tokenVersion) {
      req.user = payload;
    }
  } catch {
    // ignore invalid tokens — treat as unauthenticated
  }
  next();
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(401, 'Authentication required.'));
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, jwtConfig.accessSecret) as AuthUser;

    // Verify token version matches DB (catches password-change invalidation)
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { tokenVersion: true, isActive: true },
    });

    if (!dbUser || !dbUser.isActive || dbUser.tokenVersion !== payload.tokenVersion) {
      return next(new AppError(401, 'Invalid or expired token.'));
    }

    req.user = payload;
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token.'));
  }
}
