import { prisma } from '../../config/database';
import { getStatusId } from '../../config/statusCache';

export async function getPendingSubmissions() {
  const pendingId = getStatusId('pending_review');

  const [lessons, posts] = await Promise.all([
    prisma.lesson.findMany({
      where: { statusId: pendingId },
      take: 50,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, title: true, slug: true, createdAt: true,
        author: { select: { id: true, username: true } },
        category: { select: { name: true, slug: true } },
        level: { select: { name: true } },
      },
    }),
    prisma.blogPost.findMany({
      where: { statusId: pendingId },
      take: 50,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, title: true, slug: true, createdAt: true,
        author: { select: { id: true, username: true } },
      },
    }),
  ]);

  return { lessons, posts, total: lessons.length + posts.length };
}

export async function getDashboardStats() {
  const publishedId = getStatusId('published');
  const pendingId = getStatusId('pending_review');

  const [
    totalUsers,
    totalLessons,
    publishedLessons,
    pendingLessons,
    totalPosts,
    publishedPosts,
    pendingPosts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.lesson.count(),
    prisma.lesson.count({ where: { statusId: publishedId } }),
    prisma.lesson.count({ where: { statusId: pendingId } }),
    prisma.blogPost.count(),
    prisma.blogPost.count({ where: { statusId: publishedId } }),
    prisma.blogPost.count({ where: { statusId: pendingId } }),
  ]);

  return {
    users: totalUsers,
    lessons: { total: totalLessons, published: publishedLessons, pending: pendingLessons },
    posts: { total: totalPosts, published: publishedPosts, pending: pendingPosts },
    totalPending: pendingLessons + pendingPosts,
  };
}
