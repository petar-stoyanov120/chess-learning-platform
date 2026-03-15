import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export async function markLessonComplete(userId: number, lessonSlug: string) {
  const lesson = await prisma.lesson.findUnique({ where: { slug: lessonSlug }, select: { id: true } });
  if (!lesson) throw new AppError(404, 'Lesson not found.');

  return prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId: lesson.id } },
    create: { userId, lessonId: lesson.id },
    update: {},
  });
}

export async function getUserProgress(userId: number) {
  const progress = await prisma.lessonProgress.findMany({
    where: { userId },
    select: { lessonId: true, completedAt: true },
  });
  return progress;
}
