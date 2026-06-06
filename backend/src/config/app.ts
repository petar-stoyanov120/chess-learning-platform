import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';
import { rateLimit } from 'express-rate-limit';
import { config } from './envValidation';
import { errorHandler } from '../middleware/errorHandler';
import { setCsrfCookie, verifyCsrf } from '../middleware/csrf';

// Route imports
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/users/users.routes';
import lessonRoutes from '../modules/lessons/lessons.routes';
import categoryRoutes from '../modules/categories/categories.routes';
import uploadRoutes from '../modules/uploads/uploads.routes';
import adminRoutes from '../modules/admin/admin.routes';
import profileRoutes from '../modules/profile/profile.routes';
import classroomRoutes from '../modules/classrooms/classrooms.routes';
import locationRoutes from '../modules/locations/locations.routes';
import clubAdminRoutes from '../modules/club-admin/club-admin.routes';

export function createApp(): Express {
  const app = express();

  // Security middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
      },
    })
  );
  app.use(compression());
  app.use(
    cors({
      origin: config.frontendUrl,
      credentials: true,
    })
  );

  // Rate limiting is disabled under tests so suites can issue many auth requests.
  const skipInTest = () => process.env.NODE_ENV === 'test';

  // Global rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Too many requests, please try again later.' },
    skip: skipInTest,
  });
  app.use('/api', limiter);

  // Strict rate limiting for auth endpoints
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many login attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTest,
  });
  const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: { error: 'Too many registration attempts. Try again in an hour.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTest,
  });
  const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { error: 'Too many refresh attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTest,
  });
  app.use('/api/v1/auth/login', loginLimiter);
  app.use('/api/v1/auth/register', registerLimiter);
  app.use('/api/v1/auth/refresh', refreshLimiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // CSRF protection (double-submit cookie pattern)
  // setCsrfCookie sets the token on every response; verifyCsrf checks it on mutations
  app.use(setCsrfCookie);
  app.use(verifyCsrf);

  // Static files (uploaded images)
  app.use('/uploads', express.static(path.join(__dirname, '../../public/uploads')));

  // API routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/lessons', lessonRoutes);
  app.use('/api/v1/categories', categoryRoutes);
  app.use('/api/v1/uploads', uploadRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/profile', profileRoutes);
  app.use('/api/v1/classrooms', classroomRoutes);
  app.use('/api/v1/locations', locationRoutes);
  app.use('/api/v1/club-admin', clubAdminRoutes);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
