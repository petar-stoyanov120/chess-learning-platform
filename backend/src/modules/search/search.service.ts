import { prisma } from '../../config/database';
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

const postSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImageUrl: true,
  readingTime: true,
  createdAt: true,
  author: { select: { id: true, username: true } },
  status: { select: { id: true, name: true } },
  blogPostTags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
};

export async function search(query: Record<string, string>) {
  const q = query.q?.trim();
  if (!q) return { lessons: [], posts: [], meta: { query: '', lessonsTotal: 0, postsTotal: 0 } };

  const type = query.type || 'all';
  const { page, limit, skip } = getPagination(query);
  const publishedId = getStatusId('published');

  const searchFilter = [
    { title: { contains: q, mode: 'insensitive' as const } },
    { excerpt: { contains: q, mode: 'insensitive' as const } },
  ];

  let lessons: unknown[] = [];
  let lessonsTotal = 0;
  let posts: unknown[] = [];
  let postsTotal = 0;

  const promises: Promise<void>[] = [];

  if (type === 'all' || type === 'lessons') {
    const where = { statusId: publishedId, OR: searchFilter };
    promises.push(
      Promise.all([
        prisma.lesson.findMany({ where, select: lessonSelect, skip, take: limit, orderBy: { createdAt: 'desc' } }),
        prisma.lesson.count({ where }),
      ]).then(([l, c]) => { lessons = l; lessonsTotal = c; }),
    );
  }

  if (type === 'all' || type === 'blog') {
    const where = { statusId: publishedId, OR: searchFilter };
    promises.push(
      Promise.all([
        prisma.blogPost.findMany({ where, select: postSelect, skip, take: limit, orderBy: { createdAt: 'desc' } }),
        prisma.blogPost.count({ where }),
      ]).then(([p, c]) => { posts = p; postsTotal = c; }),
    );
  }

  await Promise.all(promises);

  return {
    lessons,
    posts,
    meta: {
      query: q,
      type,
      lessonsTotal,
      postsTotal,
      ...buildPaginationMeta(Math.max(lessonsTotal, postsTotal), page, limit),
    },
  };
}
