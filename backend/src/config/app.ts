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
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many authentication attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/v1/auth/login', authLimiter);
  app.use('/api/v1/auth/register', authLimiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

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
