import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { createSlug } from '../../utils/slugify';

export async function listTags() {
  return prisma.tag.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { lessonTags: true, blogPostTags: true } },
    },
  });
}

export async function createTag(name: string) {
  const slug = createSlug(name);
  return prisma.tag.create({ data: { name, slug } });
}

export async function deleteTag(id: number) {
  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) throw new AppError(404, 'Tag not found.');
  await prisma.tag.delete({ where: { id } });
}
