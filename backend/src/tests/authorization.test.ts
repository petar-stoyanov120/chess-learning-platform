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

describe('Role-based authorization', () => {
  it('blocks unauthenticated user from admin endpoints', async () => {
    const res = await request.get('/api/v1/admin/stats');
    expect(res.status).toBe(401);
  });

  it('blocks user role from admin endpoints', async () => {
    const user = await createTestUser('user');
    const token = await loginUser(user.email);

    const res = await request.get('/api/v1/admin/stats').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('blocks user role from creating lessons', async () => {
    const user = await createTestUser('user');
    const token = await loginUser(user.email);

    const res = await request.post('/api/v1/lessons').set('Authorization', `Bearer ${token}`).send({
      title: 'Test Lesson', content: '<p>test</p>', categoryId: 1, difficultyLevelId: 1,
    });
    expect(res.status).toBe(403);
  });

  it('blocks collaborator from approving lessons', async () => {
    const collaborator = await createTestUser('collaborator');
    const token = await loginUser(collaborator.email);

    const res = await request.patch('/api/v1/lessons/999/approve').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('allows admin to access admin stats', async () => {
    const admin = await createTestUser('admin');
    const token = await loginUser(admin.email);

    const res = await request.get('/api/v1/admin/stats').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('blocks collaborator from managing users', async () => {
    const collaborator = await createTestUser('collaborator');
    const token = await loginUser(collaborator.email);

    const res = await request.get('/api/v1/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
