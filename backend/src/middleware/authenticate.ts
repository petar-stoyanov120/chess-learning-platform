import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import { AppError } from './errorHandler';

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(401, 'Authentication required.'));
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, jwtConfig.accessSecret) as AuthUser;
    req.user = payload;
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token.'));
  }
}
