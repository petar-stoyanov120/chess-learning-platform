import { clearDatabase, seedBase, request, prisma } from './helpers';

beforeAll(async () => {
  await seedBase();
});

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/v1/auth/register', () => {
  it('registers a new user and returns tokens', async () => {
    const res = await request.post('/api/v1/auth/register').send({
      email: 'new@test.com',
      username: 'newuser',
      password: 'password123',
    });
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user.role).toBe('user');
  });

  it('returns 400 for invalid email', async () => {
    const res = await request.post('/api/v1/auth/register').send({
      email: 'not-an-email',
      username: 'test',
      password: 'password123',
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 for short password', async () => {
    const res = await request.post('/api/v1/auth/register').send({
      email: 'test@test.com',
      username: 'testuser',
      password: 'short',
    });
    expect(res.status).toBe(400);
  });

  it('returns 409 for duplicate email', async () => {
    await request.post('/api/v1/auth/register').send({
      email: 'dup@test.com', username: 'user1', password: 'password123',
    });
    const res = await request.post('/api/v1/auth/register').send({
      email: 'dup@test.com', username: 'user2', password: 'password123',
    });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await request.post('/api/v1/auth/register').send({
      email: 'login@test.com', username: 'loginuser', password: 'password123',
    });
  });

  it('logs in with correct credentials', async () => {
    const res = await request.post('/api/v1/auth/login').send({
      email: 'login@test.com', password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
  });

  it('returns 401 for wrong password', async () => {
    const res = await request.post('/api/v1/auth/login').send({
      email: 'login@test.com', password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 for unknown email', async () => {
    const res = await request.post('/api/v1/auth/login').send({
      email: 'nobody@test.com', password: 'password123',
    });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/auth/me', () => {
  it('returns current user with valid token', async () => {
    const reg = await request.post('/api/v1/auth/register').send({
      email: 'me@test.com', username: 'meuser', password: 'password123',
    });
    const token = reg.body.data.accessToken;

    const res = await request.get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('me@test.com');
  });

  it('returns 401 without token', async () => {
    const res = await request.get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request.get('/api/v1/auth/me').set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('issues new access token with valid refresh token', async () => {
    const reg = await request.post('/api/v1/auth/register').send({
      email: 'refresh@test.com', username: 'refreshuser', password: 'password123',
    });
    const { refreshToken } = reg.body.data;

    const res = await request.post('/api/v1/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
  });

  it('returns 401 for invalid refresh token', async () => {
    const res = await request.post('/api/v1/auth/refresh').send({ refreshToken: 'bogus-token' });
    expect(res.status).toBe(401);
  });
});
