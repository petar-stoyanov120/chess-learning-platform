import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { getCategoryBySlug, getLevelByName } from '../../config/statusCache';
import { getPagination, buildPaginationMeta } from '../../utils/pagination';
import { sanitize } from '../../utils/sanitizeHtml';

type LessonStatus = 'draft' | 'ready';

const lessonSelect = {
  id: true,
  title: true,
  excerpt: true,
  sortOrder: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, username: true } },
  category: { select: { id: true, name: true, slug: true } },
  level: { select: { id: true, name: true, sortOrder: true } },
  diagrams: { orderBy: { sortOrder: 'asc' as const } },
  variations: { orderBy: { sortOrder: 'asc' as const }, select: { id: true, name: true, notation: true, sortOrder: true } },
};

type VariationInput = { name: string; notation: string; sortOrder?: number };

type LessonCreateInput = {
  title: string;
  content: string;
  excerpt?: string;
  categoryId: number;
  difficultyLevelId: number;
  diagrams?: { fen: string; caption?: string; sortOrder?: number }[];
  variations?: VariationInput[];
};

export async function listLessons(query: Record<string, string>) {
  const { page, limit, skip } = getPagination(query);
  const where: Record<string, unknown> = { deletedAt: null };

  if (query.status === 'draft' || query.status === 'ready') {
    where.status = query.status;
  }
  if (query.category) {
    const category = getCategoryBySlug(query.category);
    if (category) where.categoryId = category.id;
  }
  if (query.level) {
    const level = getLevelByName(query.level);
    if (level) where.difficultyLevelId = level.id;
  }
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { excerpt: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [lessons, total] = await Promise.all([
    prisma.lesson.findMany({ where, skip, take: limit, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }], select: lessonSelect }),
    prisma.lesson.count({ where }),
  ]);

  return { lessons, meta: buildPaginationMeta(total, page, limit) };
}

export async function getLessonById(id: number) {
  const lesson = await prisma.lesson.findFirst({
    where: { id, deletedAt: null },
    select: { ...lessonSelect, content: true },
  });
  if (!lesson) throw new AppError(404, 'Lesson not found.');
  return lesson;
}

export async function getMyLessonById(id: number, authorId: number) {
  const lesson = await prisma.lesson.findFirst({
    where: { id, deletedAt: null },
    select: { ...lessonSelect, content: true },
  });
  if (!lesson) throw new AppError(404, 'Lesson not found.');
  if (lesson.author.id !== authorId) throw new AppError(403, 'You can only view your own lessons.');
  return lesson;
}

export async function createLesson(authorId: number, data: LessonCreateInput) {
  const { diagrams, variations, ...rest } = data;

  return prisma.lesson.create({
    data: {
      ...rest,
      content: sanitize(rest.content),
      authorId,
      status: 'draft',
      diagrams: diagrams ? { create: diagrams } : undefined,
      variations: variations ? { create: variations } : undefined,
    },
    select: { ...lessonSelect, content: true },
  });
}

export async function updateLesson(id: number, requesterId: number, requesterRole: string, data: Partial<LessonCreateInput>) {
  return prisma.$transaction(async (tx) => {
    const lesson = await tx.lesson.findFirst({ where: { id, deletedAt: null } });
    if (!lesson) throw new AppError(404, 'Lesson not found.');
    if (requesterRole !== 'admin' && lesson.authorId !== requesterId) {
      throw new AppError(403, 'You can only edit your own lessons.');
    }

    const { diagrams, variations, ...rest } = data;
    if (rest.content !== undefined) rest.content = sanitize(rest.content);

    return tx.lesson.update({
      where: { id },
      data: {
        ...rest,
        diagrams: diagrams
          ? { deleteMany: {}, create: diagrams }
          : undefined,
        variations: variations !== undefined
          ? { deleteMany: {}, create: variations }
          : undefined,
      },
      select: { ...lessonSelect, content: true },
    });
  });
}

export async function setLessonStatus(id: number, requesterId: number, requesterRole: string, status: LessonStatus) {
  const lesson = await prisma.lesson.findFirst({ where: { id, deletedAt: null } });
  if (!lesson) throw new AppError(404, 'Lesson not found.');
  if (requesterRole !== 'admin' && lesson.authorId !== requesterId) {
    throw new AppError(403, 'You can only change the status of your own lessons.');
  }

  return prisma.lesson.update({
    where: { id },
    data: { status },
    select: lessonSelect,
  });
}

/** Soft delete: mark the lesson deleted so it drops out of normal reads while its
 *  playlist links and student LessonProgress rows are preserved (audit M5). */
export async function deleteLesson(id: number) {
  const lesson = await prisma.lesson.findFirst({ where: { id, deletedAt: null } });
  if (!lesson) throw new AppError(404, 'Lesson not found.');
  await prisma.lesson.update({ where: { id }, data: { deletedAt: new Date() } });
}

/** Admin-only: restore a soft-deleted lesson. */
export async function restoreLesson(id: number) {
  const lesson = await prisma.lesson.findFirst({ where: { id, deletedAt: { not: null } } });
  if (!lesson) throw new AppError(404, 'Deleted lesson not found.');
  return prisma.lesson.update({ where: { id }, data: { deletedAt: null }, select: lessonSelect });
}

/** Admin-only: permanently remove a lesson (cascades to diagrams, variations,
 *  progress and playlist links). For genuine data removal / GDPR erasure. */
export async function hardDeleteLesson(id: number) {
  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson) throw new AppError(404, 'Lesson not found.');
  await prisma.lesson.delete({ where: { id } });
}

/** Admin-only: list soft-deleted lessons so they can be restored or purged. */
export async function listDeletedLessons(query: Record<string, string>) {
  const { page, limit, skip } = getPagination(query);
  const where = { deletedAt: { not: null } };
  const [lessons, total] = await Promise.all([
    prisma.lesson.findMany({ where, skip, take: limit, orderBy: { updatedAt: 'desc' }, select: lessonSelect }),
    prisma.lesson.count({ where }),
  ]);
  return { lessons, meta: buildPaginationMeta(total, page, limit) };
}

export async function listMyLessons(authorId: number, query: Record<string, string>) {
  const { page, limit, skip } = getPagination(query);

  const [lessons, total] = await Promise.all([
    prisma.lesson.findMany({
      where: { authorId, deletedAt: null },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: lessonSelect,
    }),
    prisma.lesson.count({ where: { authorId, deletedAt: null } }),
  ]);

  return { lessons, meta: buildPaginationMeta(total, page, limit) };
}

export async function reorderLesson(id: number, sortOrder: number) {
  return prisma.lesson.update({ where: { id }, data: { sortOrder }, select: { id: true, sortOrder: true } });
}
