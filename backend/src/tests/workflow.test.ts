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

async function getIds() {
  const category = await prisma.category.findFirst({ where: { slug: 'openings' } });
  const level = await prisma.difficultyLevel.findFirst({ where: { name: 'beginner' } });
  return { categoryId: category!.id, difficultyLevelId: level!.id };
}

describe('Lesson approval workflow', () => {
  it('creates lesson as draft', async () => {
    const collab = await createTestUser('collaborator');
    const token = await loginUser(collab.email);
    const { categoryId, difficultyLevelId } = await getIds();

    const res = await request
      .post('/api/v1/lessons')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Lesson', content: '<p>Hello</p>', categoryId, difficultyLevelId });

    expect(res.status).toBe(201);
    expect(res.body.data.status.name).toBe('draft');
  });

  it('collaborator submits lesson for review', async () => {
    const collab = await createTestUser('collaborator');
    const token = await loginUser(collab.email);
    const { categoryId, difficultyLevelId } = await getIds();

    const create = await request
      .post('/api/v1/lessons')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Submit Test', content: '<p>Hello</p>', categoryId, difficultyLevelId });

    const lessonId = create.body.data.id;
    const submitRes = await request
      .patch(`/api/v1/lessons/${lessonId}/submit`)
      .set('Authorization', `Bearer ${token}`);

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.status.name).toBe('pending_review');
  });

  it('admin approves a pending lesson and it appears in public API', async () => {
    const collab = await createTestUser('collaborator');
    const collabToken = await loginUser(collab.email);
    const admin = await createTestUser('admin');
    const adminToken = await loginUser(admin.email);
    const { categoryId, difficultyLevelId } = await getIds();

    const create = await request
      .post('/api/v1/lessons')
      .set('Authorization', `Bearer ${collabToken}`)
      .send({ title: 'Approve Test', content: '<p>Content</p>', categoryId, difficultyLevelId });
    const lessonId = create.body.data.id;

    await request.patch(`/api/v1/lessons/${lessonId}/submit`).set('Authorization', `Bearer ${collabToken}`);

    const approveRes = await request
      .patch(`/api/v1/lessons/${lessonId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status.name).toBe('published');

    // Should appear in public listing
    const publicRes = await request.get('/api/v1/lessons');
    expect(publicRes.body.data.some((l: { id: number }) => l.id === lessonId)).toBe(true);
  });

  it('admin rejects a lesson with a reason', async () => {
    const collab = await createTestUser('collaborator');
    const collabToken = await loginUser(collab.email);
    const admin = await createTestUser('admin');
    const adminToken = await loginUser(admin.email);
    const { categoryId, difficultyLevelId } = await getIds();

    const create = await request
      .post('/api/v1/lessons')
      .set('Authorization', `Bearer ${collabToken}`)
      .send({ title: 'Reject Test', content: '<p>Content</p>', categoryId, difficultyLevelId });
    const lessonId = create.body.data.id;

    await request.patch(`/api/v1/lessons/${lessonId}/submit`).set('Authorization', `Bearer ${collabToken}`);

    const rejectRes = await request
      .patch(`/api/v1/lessons/${lessonId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Content needs improvement.' });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.data.status.name).toBe('rejected');
    expect(rejectRes.body.data.rejectionReason).toBe('Content needs improvement.');
  });

  it('rejected lesson does NOT appear in public listing', async () => {
    const collab = await createTestUser('collaborator');
    const collabToken = await loginUser(collab.email);
    const admin = await createTestUser('admin');
    const adminToken = await loginUser(admin.email);
    const { categoryId, difficultyLevelId } = await getIds();

    const create = await request
      .post('/api/v1/lessons')
      .set('Authorization', `Bearer ${collabToken}`)
      .send({ title: 'Hidden Lesson', content: '<p>Content</p>', categoryId, difficultyLevelId });
    const lessonId = create.body.data.id;

    await request.patch(`/api/v1/lessons/${lessonId}/submit`).set('Authorization', `Bearer ${collabToken}`);
    await request.patch(`/api/v1/lessons/${lessonId}/reject`).set('Authorization', `Bearer ${adminToken}`).send({ reason: 'No.' });

    const publicRes = await request.get('/api/v1/lessons');
    expect(publicRes.body.data.some((l: { id: number }) => l.id === lessonId)).toBe(false);
  });

  it('collaborator cannot edit another collaborators lesson', async () => {
    const collab1 = await createTestUser('collaborator', '1');
    const collab2 = await createTestUser('collaborator', '2');
    const token1 = await loginUser(collab1.email);
    const token2 = await loginUser(collab2.email);
    const { categoryId, difficultyLevelId } = await getIds();

    const create = await request
      .post('/api/v1/lessons')
      .set('Authorization', `Bearer ${token1}`)
      .send({ title: 'Collab1 Lesson', content: '<p>Content</p>', categoryId, difficultyLevelId });
    const lessonId = create.body.data.id;

    const editRes = await request
      .patch(`/api/v1/lessons/${lessonId}`)
      .set('Authorization', `Bearer ${token2}`)
      .send({ title: 'Stolen Lesson' });

    expect(editRes.status).toBe(403);
  });
});

describe('Blog post approval workflow', () => {
  it('creates blog post as draft', async () => {
    const collab = await createTestUser('collaborator', 'b');
    const token = await loginUser(collab.email);

    const res = await request
      .post('/api/v1/blog')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'My Blog Post', content: '<p>Hello world</p>' });

    expect(res.status).toBe(201);
    expect(res.body.data.status.name).toBe('draft');
  });

  it('admin approves blog post and it appears publicly', async () => {
    const collab = await createTestUser('collaborator', 'blog');
    const collabToken = await loginUser(collab.email);
    const admin = await createTestUser('admin', 'blog');
    const adminToken = await loginUser(admin.email);

    const create = await request
      .post('/api/v1/blog')
      .set('Authorization', `Bearer ${collabToken}`)
      .send({ title: 'Public Blog Post', content: '<p>Content</p>' });
    const postId = create.body.data.id;

    await request.patch(`/api/v1/blog/${postId}/submit`).set('Authorization', `Bearer ${collabToken}`);

    const approveRes = await request
      .patch(`/api/v1/blog/${postId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status.name).toBe('published');

    const publicRes = await request.get('/api/v1/blog');
    expect(publicRes.body.data.some((p: { id: number }) => p.id === postId)).toBe(true);
  });
});
