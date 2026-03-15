import { clearDatabase, seedBase, request, createTestUser, loginUser, prisma } from './helpers';

beforeAll(async () => {
  await seedBase();
});

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Slug uniqueness', () => {
  it('generates unique slugs for duplicate titles', async () => {
    const admin = await createTestUser('admin', 'slug');
    const token = await loginUser(admin.email);
    const { categoryId, difficultyLevelId } = await getCategoryAndLevel();

    const r1 = await request.post('/api/v1/lessons').set('Authorization', `Bearer ${token}`)
      .send({ title: 'Italian Game', content: '<p>.</p>', categoryId, difficultyLevelId });
    const r2 = await request.post('/api/v1/lessons').set('Authorization', `Bearer ${token}`)
      .send({ title: 'Italian Game', content: '<p>.</p>', categoryId, difficultyLevelId });

    expect(r1.body.data.slug).toBe('italian-game');
    expect(r2.body.data.slug).toBe('italian-game-2');
  });
});

describe('Lesson filtering', () => {
  it('filters lessons by category', async () => {
    const admin = await createTestUser('admin', 'filter');
    const token = await loginUser(admin.email);
    const category = await prisma.category.findUnique({ where: { slug: 'openings' } });
    const otherCategory = await prisma.category.findUnique({ where: { slug: 'endgames' } });
    const level = await prisma.difficultyLevel.findFirst({ where: { name: 'beginner' } });
    const published = await prisma.postStatus.findUnique({ where: { name: 'published' } });

    await prisma.lesson.createMany({
      data: [
        { title: 'Opening Lesson', slug: 'opening-lesson', content: '.', authorId: admin.id, categoryId: category!.id, difficultyLevelId: level!.id, statusId: published!.id },
        { title: 'Endgame Lesson', slug: 'endgame-lesson', content: '.', authorId: admin.id, categoryId: otherCategory!.id, difficultyLevelId: level!.id, statusId: published!.id },
      ],
    });

    const res = await request.get('/api/v1/lessons?category=openings');
    expect(res.status).toBe(200);
    expect(res.body.data.every((l: { category: { slug: string } }) => l.category.slug === 'openings')).toBe(true);
  });
});

describe('Pagination', () => {
  it('returns correct page size', async () => {
    const admin = await createTestUser('admin', 'page');
    const published = await prisma.postStatus.findUnique({ where: { name: 'published' } });
    const category = await prisma.category.findFirst();
    const level = await prisma.difficultyLevel.findFirst();

    const lessons = Array.from({ length: 15 }, (_, i) => ({
      title: `Lesson ${i}`,
      slug: `lesson-${i}`,
      content: '.',
      authorId: admin.id,
      categoryId: category!.id,
      difficultyLevelId: level!.id,
      statusId: published!.id,
    }));
    await prisma.lesson.createMany({ data: lessons });

    const res = await request.get('/api/v1/lessons?page=1&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(5);
    expect(res.body.meta.total).toBe(15);
    expect(res.body.meta.totalPages).toBe(3);
  });
});

describe('Categories and difficulty levels', () => {
  it('returns all 3 categories', async () => {
    const res = await request.get('/api/v1/categories');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
  });

  it('returns all 3 difficulty levels', async () => {
    const res = await request.get('/api/v1/categories/difficulty-levels');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(3);
  });
});

async function getCategoryAndLevel() {
  const category = await prisma.category.findFirst({ where: { slug: 'openings' } });
  const level = await prisma.difficultyLevel.findFirst({ where: { name: 'beginner' } });
  return { categoryId: category!.id, difficultyLevelId: level!.id };
}
