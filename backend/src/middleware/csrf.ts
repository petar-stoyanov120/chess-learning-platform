import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

const CSRF_COOKIE = 'csrfToken';
const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Auth endpoints are excluded from CSRF:
// - login/register require credentials in the body (attacker can't fake them)
// - refresh/logout cookies are SameSite=Lax — cross-site POSTs won't include them
const CSRF_EXEMPT_PATHS = new Set([
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/auth/logout',
]);

/**
 * Sets a readable (non-httpOnly) CSRF token cookie on every response.
 * The frontend reads this cookie and echoes it back as an X-CSRF-Token header.
 */
export function setCsrfCookie(req: Request, res: Response, next: NextFunction): void {
  // Only set a new token if one doesn't already exist
  if (!req.cookies?.[CSRF_COOKIE]) {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,      // Must be readable by JavaScript
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
  next();
}

/**
 * Verifies that the X-CSRF-Token header matches the csrfToken cookie.
 * Applied to all state-changing requests (POST, PATCH, DELETE).
 */
export function verifyCsrf(req: Request, _res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  if (CSRF_EXEMPT_PATHS.has(req.path)) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE] as string | undefined;
  const headerToken = req.headers[CSRF_HEADER] as string | undefined;

  if (!cookieToken || !headerToken) {
    return next(new AppError(403, 'CSRF token mismatch. Request rejected.'));
  }

  // Use constant-time comparison to prevent timing attacks
  const a = Buffer.from(cookieToken);
  const b = Buffer.from(headerToken);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return next(new AppError(403, 'CSRF token mismatch. Request rejected.'));
  }

  next();
}
