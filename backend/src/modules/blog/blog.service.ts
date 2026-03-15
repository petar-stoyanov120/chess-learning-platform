import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { getStatusId } from '../../config/statusCache';
import { uniqueSlug } from '../../utils/slugify';
import { estimateReadingTime } from '../../utils/readingTime';
import { sendApprovalEmail, sendRejectionEmail } from '../../config/mailer';
import { getPagination, buildPaginationMeta } from '../../utils/pagination';
import { checkDailyLimit } from '../../utils/dailyLimit';

const postSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImageUrl: true,
  approvedAt: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, username: true } },
  status: { select: { id: true, name: true } },
  blogPostTags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
  variations: { orderBy: { sortOrder: 'asc' as const }, select: { id: true, name: true, notation: true, sortOrder: true } },
};

type VariationInput = { name: string; notation: string; sortOrder?: number };

type PostCreateInput = {
  title: string;
  content: string;
  excerpt?: string;
  coverImageUrl?: string;
  metaDescription?: string;
  tagIds?: number[];
  variations?: VariationInput[];
};

export async function listPublishedPosts(query: Record<string, string>) {
  const { page, limit, skip } = getPagination(query);
  const where: Record<string, unknown> = { statusId: getStatusId('published') };

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { excerpt: { contains: query.search, mode: 'insensitive' } },
    ];
  }
  if (query.tag) {
    where.blogPostTags = { some: { tag: { slug: query.tag } } };
  }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, select: postSelect }),
    prisma.blogPost.count({ where }),
  ]);

  return { posts, meta: buildPaginationMeta(total, page, limit) };
}

export async function getPostBySlug(slug: string, adminView = false) {
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    select: { ...postSelect, content: true, metaDescription: true },
  });

  if (!post) throw new AppError(404, 'Blog post not found.');
  if (!adminView && post.status.name !== 'published') throw new AppError(404, 'Blog post not found.');

  return { ...post, readingTime: estimateReadingTime(post.content) };
}

export async function getPostById(id: number) {
  const post = await prisma.blogPost.findUnique({
    where: { id },
    select: { ...postSelect, content: true, metaDescription: true },
  });
  if (!post) throw new AppError(404, 'Blog post not found.');
  return post;
}

export async function getMyPostById(id: number, authorId: number) {
  const post = await prisma.blogPost.findUnique({
    where: { id },
    select: { ...postSelect, content: true, metaDescription: true },
  });
  if (!post) throw new AppError(404, 'Blog post not found.');
  if (post.author.id !== authorId) throw new AppError(403, 'You can only view your own blog posts.');
  return post;
}

export async function createPost(authorId: number, role: string, data: PostCreateInput) {
  await checkDailyLimit(authorId, role);

  const slug = await uniqueSlug(data.title, async (s) => {
    const exists = await prisma.blogPost.findUnique({ where: { slug: s } });
    return !!exists;
  });

  const { tagIds, variations, ...rest } = data;

  return prisma.blogPost.create({
    data: {
      ...rest,
      slug,
      authorId,
      statusId: getStatusId('draft'),
      blogPostTags: tagIds ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
      variations: variations ? { create: variations } : undefined,
    },
    select: { ...postSelect, content: true },
  });
}

export async function updatePost(id: number, requesterId: number, requesterRole: string, data: Partial<PostCreateInput>) {
  const post = await prisma.blogPost.findUnique({ where: { id }, include: { status: true } });
  if (!post) throw new AppError(404, 'Blog post not found.');
  if (requesterRole !== 'admin' && post.authorId !== requesterId) {
    throw new AppError(403, 'You can only edit your own blog posts.');
  }
  if (requesterRole !== 'admin' && post.status.name === 'published') {
    throw new AppError(403, 'Cannot edit a published post. Contact an admin.');
  }

  const { tagIds, variations, ...rest } = data;

  return prisma.blogPost.update({
    where: { id },
    data: {
      ...rest,
      blogPostTags: tagIds
        ? { deleteMany: {}, create: tagIds.map((tagId) => ({ tagId })) }
        : undefined,
      variations: variations !== undefined
        ? { deleteMany: {}, create: variations }
        : undefined,
    },
    select: { ...postSelect, content: true },
  });
}

export async function submitPost(id: number, requesterId: number, requesterRole: string) {
  const post = await prisma.blogPost.findUnique({ where: { id }, include: { status: true } });
  if (!post) throw new AppError(404, 'Blog post not found.');
  if (requesterRole !== 'admin' && post.authorId !== requesterId) {
    throw new AppError(403, 'You can only submit your own blog posts.');
  }
  if (post.status.name !== 'draft' && post.status.name !== 'rejected') {
    throw new AppError(400, 'Only draft or rejected posts can be submitted for review.');
  }

  return prisma.blogPost.update({
    where: { id },
    data: { statusId: getStatusId('pending_review'), rejectionReason: null },
    select: postSelect,
  });
}

export async function approvePost(id: number, approverId: number) {
  const post = await prisma.blogPost.findUnique({ where: { id }, include: { author: true } });
  if (!post) throw new AppError(404, 'Blog post not found.');

  const result = await prisma.blogPost.update({
    where: { id },
    data: { statusId: getStatusId('published'), approvedBy: approverId, approvedAt: new Date(), rejectionReason: null },
    select: postSelect,
  });

  sendApprovalEmail(post.author.email, post.title, 'blog post');
  return result;
}

export async function rejectPost(id: number, reason: string) {
  const post = await prisma.blogPost.findUnique({ where: { id }, include: { author: true } });
  if (!post) throw new AppError(404, 'Blog post not found.');

  const result = await prisma.blogPost.update({
    where: { id },
    data: { statusId: getStatusId('rejected'), rejectionReason: reason },
    select: postSelect,
  });

  sendRejectionEmail(post.author.email, post.title, 'blog post', reason);
  return result;
}

export async function deletePost(id: number) {
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) throw new AppError(404, 'Blog post not found.');
  await prisma.blogPost.delete({ where: { id } });
}

export async function listAllPosts(query: Record<string, string>) {
  const { page, limit, skip } = getPagination(query);
  const where: Record<string, unknown> = {};

  if (query.status) {
    try {
      where.statusId = getStatusId(query.status as 'draft' | 'pending_review' | 'published' | 'rejected');
    } catch {
      // unknown status name — return empty
    }
  }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, select: postSelect }),
    prisma.blogPost.count({ where }),
  ]);

  return { posts, meta: buildPaginationMeta(total, page, limit) };
}

export async function listMyPosts(authorId: number, query: Record<string, string>) {
  const { page, limit, skip } = getPagination(query);

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where: { authorId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: postSelect,
    }),
    prisma.blogPost.count({ where: { authorId } }),
  ]);

  return { posts, meta: buildPaginationMeta(total, page, limit) };
}
