import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';
import { rateLimit } from 'express-rate-limit';
import { config } from './envValidation';
import { errorHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/authenticate';
import { setCsrfCookie, verifyCsrf } from '../middleware/csrf';
import { getDailyPostCount, DAILY_LIMIT } from '../utils/dailyLimit';

// Route imports
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/users/users.routes';
import lessonRoutes from '../modules/lessons/lessons.routes';
import blogRoutes from '../modules/blog/blog.routes';
import categoryRoutes from '../modules/categories/categories.routes';
import tagRoutes from '../modules/tags/tags.routes';
import uploadRoutes from '../modules/uploads/uploads.routes';
import adminRoutes from '../modules/admin/admin.routes';
import searchRoutes from '../modules/search/search.routes';
import profileRoutes from '../modules/profile/profile.routes';
import bookmarkRoutes from '../modules/bookmarks/bookmarks.routes';
import playlistRoutes from '../modules/playlists/playlists.routes';
import classroomRoutes from '../modules/classrooms/classrooms.routes';
import commentRoutes from '../modules/comments/comments.routes';
import locationRoutes from '../modules/locations/locations.routes';
import clubAdminRoutes from '../modules/club-admin/club-admin.routes';

export function createApp(): Express {
  const app = express();

  // Security middleware
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());
  app.use(
    cors({
      origin: config.frontendUrl,
      credentials: true,
    })
  );

  // Global rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Too many requests, please try again later.' },
  });
  app.use('/api', limiter);

  // Strict rate limiting for auth endpoints
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many login attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: { error: 'Too many registration attempts. Try again in an hour.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { error: 'Too many refresh attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
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
  app.use('/api/v1/blog', blogRoutes);
  app.use('/api/v1/categories', categoryRoutes);
  app.use('/api/v1/tags', tagRoutes);
  app.use('/api/v1/uploads', uploadRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/search', searchRoutes);
  app.use('/api/v1/profile', profileRoutes);
  app.use('/api/v1/bookmarks', bookmarkRoutes);
  app.use('/api/v1/playlists', playlistRoutes);
  app.use('/api/v1/classrooms', classroomRoutes);
  app.use('/api/v1/comments', commentRoutes);
  app.use('/api/v1/locations', locationRoutes);
  app.use('/api/v1/club-admin', clubAdminRoutes);

  // Daily post limit status
  app.get('/api/v1/daily-limit', authenticate, async (req, res, next) => {
    try {
      const role = req.user!.role;
      if (role === 'admin') {
        return res.json({ used: 0, limit: null, remaining: null, canPost: true });
      }
      const used = await getDailyPostCount(req.user!.id);
      const remaining = Math.max(0, DAILY_LIMIT - used);
      res.json({ used, limit: DAILY_LIMIT, remaining, canPost: remaining > 0 });
    } catch (err) { next(err); }
  });

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
