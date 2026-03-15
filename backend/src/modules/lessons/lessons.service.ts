import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { getStatusId, getCategoryBySlug, getLevelByName } from '../../config/statusCache';
import { uniqueSlug } from '../../utils/slugify';
import { estimateReadingTime } from '../../utils/readingTime';
import { sendApprovalEmail, sendRejectionEmail } from '../../config/mailer';
import { getPagination, buildPaginationMeta } from '../../utils/pagination';
import { checkDailyLimit } from '../../utils/dailyLimit';

const lessonSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImageUrl: true,
  sortOrder: true,
  approvedAt: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, username: true } },
  category: { select: { id: true, name: true, slug: true } },
  level: { select: { id: true, name: true, sortOrder: true } },
  status: { select: { id: true, name: true } },
  lessonTags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
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
  coverImageUrl?: string;
  metaDescription?: string;
  tagIds?: number[];
  diagrams?: { fen: string; caption?: string; sortOrder?: number }[];
  variations?: VariationInput[];
};

export async function listPublishedLessons(query: Record<string, string>) {
  const { page, limit, skip } = getPagination(query);
  const where: Record<string, unknown> = { statusId: getStatusId('published') };

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
  if (query.tag) {
    where.lessonTags = { some: { tag: { slug: query.tag } } };
  }

  const [lessons, total] = await Promise.all([
    prisma.lesson.findMany({ where, skip, take: limit, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }], select: lessonSelect }),
    prisma.lesson.count({ where }),
  ]);

  return { lessons, meta: buildPaginationMeta(total, page, limit) };
}

export async function getLessonBySlug(slug: string, adminView = false) {
  const lesson = await prisma.lesson.findUnique({
    where: { slug },
    select: { ...lessonSelect, content: true, metaDescription: true, approvedBy: true },
  });

  if (!lesson) throw new AppError(404, 'Lesson not found.');
  if (!adminView && lesson.status.name !== 'published') throw new AppError(404, 'Lesson not found.');

  return { ...lesson, readingTime: estimateReadingTime(lesson.content) };
}

export async function getLessonsByCategoryAndLevel(categorySlug: string, levelName: string) {
  const category = getCategoryBySlug(categorySlug);
  const level = getLevelByName(levelName);

  if (!category) throw new AppError(404, 'Category not found.');
  if (!level) throw new AppError(404, 'Difficulty level not found.');

  const lessons = await prisma.lesson.findMany({
    where: { categoryId: category.id, difficultyLevelId: level.id, statusId: getStatusId('published') },
    orderBy: { sortOrder: 'asc' },
    select: lessonSelect,
  });

  return { category, level, lessons };
}

export async function getLessonById(id: number) {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    select: { ...lessonSelect, content: true, metaDescription: true },
  });
  if (!lesson) throw new AppError(404, 'Lesson not found.');
  return lesson;
}

export async function getMyLessonById(id: number, authorId: number) {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    select: { ...lessonSelect, content: true, metaDescription: true },
  });
  if (!lesson) throw new AppError(404, 'Lesson not found.');
  if (lesson.author.id !== authorId) throw new AppError(403, 'You can only view your own lessons.');
  return lesson;
}

export async function createLesson(authorId: number, role: string, data: LessonCreateInput) {
  await checkDailyLimit(authorId, role);

  const slug = await uniqueSlug(data.title, async (s) => {
    const exists = await prisma.lesson.findUnique({ where: { slug: s } });
    return !!exists;
  });

  const { tagIds, diagrams, variations, ...rest } = data;

  return prisma.lesson.create({
    data: {
      ...rest,
      slug,
      authorId,
      statusId: getStatusId('draft'),
      lessonTags: tagIds ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
      diagrams: diagrams ? { create: diagrams } : undefined,
      variations: variations ? { create: variations } : undefined,
    },
    select: { ...lessonSelect, content: true },
  });
}

export async function updateLesson(id: number, requesterId: number, requesterRole: string, data: Partial<LessonCreateInput>) {
  const lesson = await prisma.lesson.findUnique({ where: { id }, include: { status: true } });
  if (!lesson) throw new AppError(404, 'Lesson not found.');
  if (requesterRole !== 'admin' && lesson.authorId !== requesterId) {
    throw new AppError(403, 'You can only edit your own lessons.');
  }
  if (requesterRole !== 'admin' && lesson.status.name === 'published') {
    throw new AppError(403, 'Cannot edit a published lesson. Contact an admin.');
  }

  const { tagIds, diagrams, variations, ...rest } = data;

  return prisma.lesson.update({
    where: { id },
    data: {
      ...rest,
      lessonTags: tagIds
        ? { deleteMany: {}, create: tagIds.map((tagId) => ({ tagId })) }
        : undefined,
      diagrams: diagrams
        ? { deleteMany: {}, create: diagrams }
        : undefined,
      variations: variations !== undefined
        ? { deleteMany: {}, create: variations }
        : undefined,
    },
    select: { ...lessonSelect, content: true },
  });
}

export async function submitLesson(id: number, requesterId: number, requesterRole: string) {
  const lesson = await prisma.lesson.findUnique({ where: { id }, include: { status: true } });
  if (!lesson) throw new AppError(404, 'Lesson not found.');
  if (requesterRole !== 'admin' && lesson.authorId !== requesterId) {
    throw new AppError(403, 'You can only submit your own lessons.');
  }
  if (lesson.status.name !== 'draft' && lesson.status.name !== 'rejected') {
    throw new AppError(400, 'Only draft or rejected lessons can be submitted for review.');
  }

  return prisma.lesson.update({
    where: { id },
    data: { statusId: getStatusId('pending_review'), rejectionReason: null },
    select: lessonSelect,
  });
}

export async function approveLesson(id: number, approverId: number) {
  const lesson = await prisma.lesson.findUnique({ where: { id }, include: { author: true } });
  if (!lesson) throw new AppError(404, 'Lesson not found.');

  const result = await prisma.lesson.update({
    where: { id },
    data: { statusId: getStatusId('published'), approvedBy: approverId, approvedAt: new Date(), rejectionReason: null },
    select: lessonSelect,
  });

  sendApprovalEmail(lesson.author.email, lesson.title, 'lesson');
  return result;
}

export async function rejectLesson(id: number, reason: string) {
  const lesson = await prisma.lesson.findUnique({ where: { id }, include: { author: true } });
  if (!lesson) throw new AppError(404, 'Lesson not found.');

  const result = await prisma.lesson.update({
    where: { id },
    data: { statusId: getStatusId('rejected'), rejectionReason: reason },
    select: lessonSelect,
  });

  sendRejectionEmail(lesson.author.email, lesson.title, 'lesson', reason);
  return result;
}

export async function deleteLesson(id: number) {
  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson) throw new AppError(404, 'Lesson not found.');
  await prisma.lesson.delete({ where: { id } });
}

export async function listAllLessons(query: Record<string, string>) {
  const { page, limit, skip } = getPagination(query);
  const where: Record<string, unknown> = {};

  if (query.status) {
    try {
      where.statusId = getStatusId(query.status as 'draft' | 'pending_review' | 'published' | 'rejected');
    } catch {
      // unknown status name — return empty
    }
  }
  if (query.category) {
    const category = getCategoryBySlug(query.category);
    if (category) where.categoryId = category.id;
  }

  const [lessons, total] = await Promise.all([
    prisma.lesson.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, select: lessonSelect }),
    prisma.lesson.count({ where }),
  ]);

  return { lessons, meta: buildPaginationMeta(total, page, limit) };
}

export async function listMyLessons(authorId: number, query: Record<string, string>) {
  const { page, limit, skip } = getPagination(query);

  const [lessons, total] = await Promise.all([
    prisma.lesson.findMany({
      where: { authorId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: lessonSelect,
    }),
    prisma.lesson.count({ where: { authorId } }),
  ]);

  return { lessons, meta: buildPaginationMeta(total, page, limit) };
}

export async function reorderLesson(id: number, sortOrder: number) {
  return prisma.lesson.update({ where: { id }, data: { sortOrder }, select: { id: true, sortOrder: true } });
}
