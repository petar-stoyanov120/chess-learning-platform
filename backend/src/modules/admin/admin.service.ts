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

export async function getRecentUsers(take = 5) {
  return prisma.user.findMany({
    take,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
      isActive: true,
      role: { select: { name: true } },
    },
  });
}

export async function getDashboardStats() {
  const publishedId = getStatusId('published');
  const pendingId = getStatusId('pending_review');
  const draftId = getStatusId('draft');
  const rejectedId = getStatusId('rejected');

  const [
    totalUsers,
    totalLessons,
    publishedLessons,
    pendingLessons,
    draftLessons,
    rejectedLessons,
    totalPosts,
    publishedPosts,
    pendingPosts,
    draftPosts,
    rejectedPosts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.lesson.count(),
    prisma.lesson.count({ where: { statusId: publishedId } }),
    prisma.lesson.count({ where: { statusId: pendingId } }),
    prisma.lesson.count({ where: { statusId: draftId } }),
    prisma.lesson.count({ where: { statusId: rejectedId } }),
    prisma.blogPost.count(),
    prisma.blogPost.count({ where: { statusId: publishedId } }),
    prisma.blogPost.count({ where: { statusId: pendingId } }),
    prisma.blogPost.count({ where: { statusId: draftId } }),
    prisma.blogPost.count({ where: { statusId: rejectedId } }),
  ]);

  return {
    users: totalUsers,
    lessons: {
      total: totalLessons,
      published: publishedLessons,
      pending: pendingLessons,
      draft: draftLessons,
      rejected: rejectedLessons,
    },
    posts: {
      total: totalPosts,
      published: publishedPosts,
      pending: pendingPosts,
      draft: draftPosts,
      rejected: rejectedPosts,
    },
    totalPending: pendingLessons + pendingPosts,
  };
}
