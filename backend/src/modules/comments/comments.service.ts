import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { getPagination, buildPaginationMeta } from '../../utils/pagination';

export async function getCommentsByLesson(lessonId: number, query: Record<string, string>) {
  const { page, limit, skip } = getPagination(query);
  const [total, comments] = await Promise.all([
    prisma.comment.count({ where: { lessonId } }),
    prisma.comment.findMany({
      where: { lessonId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    }),
  ]);
  return { data: comments, meta: buildPaginationMeta(total, page, limit) };
}

export async function createComment(userId: number, lessonId: number, content: string) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true } });
  if (!lesson) throw new AppError(404, 'Lesson not found.');

  return prisma.comment.create({
    data: { userId, lessonId, content },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });
}

export async function deleteComment(commentId: number, requesterId: number, requesterRole: string) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new AppError(404, 'Comment not found.');
  if (comment.userId !== requesterId && requesterRole !== 'admin') {
    throw new AppError(403, 'You can only delete your own comments.');
  }
  await prisma.comment.delete({ where: { id: commentId } });
}
