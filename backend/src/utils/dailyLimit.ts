import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

const DAILY_LIMIT = 1;

function todayUTC(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export async function getDailyPostCount(authorId: number): Promise<number> {
  const { start, end } = todayUTC();
  const [lessons, posts] = await Promise.all([
    prisma.lesson.count({ where: { authorId, createdAt: { gte: start, lt: end } } }),
    prisma.blogPost.count({ where: { authorId, createdAt: { gte: start, lt: end } } }),
  ]);
  return lessons + posts;
}

export async function checkDailyLimit(authorId: number, role: string): Promise<void> {
  if (role === 'admin') return;
  const used = await getDailyPostCount(authorId);
  if (used >= DAILY_LIMIT) {
    throw new AppError(429, `You have reached your daily limit of ${DAILY_LIMIT} post. Limit resets at midnight UTC.`);
  }
}

export { DAILY_LIMIT };
