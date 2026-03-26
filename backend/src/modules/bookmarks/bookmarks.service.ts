import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { getStatusId } from '../../config/statusCache';
import { getPagination, buildPaginationMeta } from '../../utils/pagination';

const lessonSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImageUrl: true,
  readingTime: true,
  createdAt: true,
  author: { select: { id: true, username: true } },
  category: { select: { id: true, name: true, slug: true } },
  level: { select: { id: true, name: true, sortOrder: true } },
  status: { select: { id: true, name: true } },
  lessonTags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
};

export async function listBookmarks(userId: number, query: Record<string, string>) {
  const { page, limit, skip } = getPagination(query);
  const where = { userId };

  const [bookmarks, total] = await Promise.all([
    prisma.bookmark.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { lesson: { select: lessonSelect } },
    }),
    prisma.bookmark.count({ where }),
  ]);

  return {
    bookmarks: bookmarks.map((b) => ({ ...b.lesson, bookmarkedAt: b.createdAt })),
    meta: buildPaginationMeta(total, page, limit),
  };
}

export async function addBookmark(userId: number, lessonId: number) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson || lesson.statusId !== getStatusId('published')) {
    throw new AppError(404, 'Lesson not found.');
  }

  const existing = await prisma.bookmark.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });
  if (existing) return existing;

  return prisma.bookmark.create({ data: { userId, lessonId } });
}

export async function removeBookmark(userId: number, lessonId: number) {
  const existing = await prisma.bookmark.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });
  if (!existing) throw new AppError(404, 'Bookmark not found.');

  await prisma.bookmark.delete({ where: { id: existing.id } });
}

export async function checkBookmarks(userId: number, lessonIds: number[]) {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId, lessonId: { in: lessonIds } },
    select: { lessonId: true },
  });
  return bookmarks.map((b) => b.lessonId);
}
