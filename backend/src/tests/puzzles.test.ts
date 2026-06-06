import { clearDatabase, seedBase, request, createTestUser, prisma } from './helpers';

beforeAll(async () => {
  await seedBase();
});

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

const TEST_FEN = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
const TEST_SOLUTION = '1...e5 2. Nf3';

/**
 * Log in and return the access token + CSRF values extracted from the login
 * response's Set-Cookie header. All mutating requests (POST/PATCH/DELETE) that
 * fall outside the auth-exempt paths need the CSRF cookie+header pair.
 */
async function loginWithCsrf(email: string): Promise<{ token: string; csrfCookie: string; csrfToken: string }> {
  const res = await request.post('/api/v1/auth/login').send({ email, password: 'password123' });
  const raw = res.headers['set-cookie'];
  const cookieArr: string[] = Array.isArray(raw) ? raw : raw ? [raw as string] : [];
  const entry = cookieArr.find((c) => c.startsWith('csrfToken=')) ?? '';
  const cookiePair = entry.split(';')[0]; // "csrfToken=<value>"
  const csrfToken = cookiePair.split('=')[1] ?? '';
  return { token: res.body.data.accessToken, csrfCookie: cookiePair, csrfToken };
}

/** Create a coach-owned classroom with one puzzle that has a known solution. */
async function setupClassroomWithPuzzle(suffix: string) {
  const coach = await createTestUser('coach', suffix);
  const { token: coachToken, csrfCookie, csrfToken } = await loginWithCsrf(coach.email);

  const classroomRes = await request
    .post('/api/v1/classrooms')
    .set('Authorization', `Bearer ${coachToken}`)
    .set('Cookie', csrfCookie)
    .set('x-csrf-token', csrfToken)
    .send({ name: 'Test Classroom' });
  expect(classroomRes.status).toBe(201);

  const classroomId: number = classroomRes.body.data.id;
  const inviteCode: string = classroomRes.body.data.inviteCode;

  const puzzleRes = await request
    .post(`/api/v1/classrooms/${classroomId}/puzzles`)
    .set('Authorization', `Bearer ${coachToken}`)
    .set('Cookie', csrfCookie)
    .set('x-csrf-token', csrfToken)
    .send({ title: 'Test Puzzle', fen: TEST_FEN, sideToMove: 'black', solution: TEST_SOLUTION });
  expect(puzzleRes.status).toBe(201);

  return {
    coach,
    coachToken,
    classroomId,
    inviteCode,
    puzzleId: puzzleRes.body.data.id as number,
  };
}

describe('Puzzle solution visibility', () => {
  it('student member does NOT receive the solution field', async () => {
    const { inviteCode, classroomId, puzzleId } = await setupClassroomWithPuzzle('sol1');

    const student = await createTestUser('user', 'sol1');
    const { token: studentToken, csrfCookie: sCsrfCookie, csrfToken: sCsrfToken } = await loginWithCsrf(student.email);

    const joinRes = await request
      .post('/api/v1/classrooms/join')
      .set('Authorization', `Bearer ${studentToken}`)
      .set('Cookie', sCsrfCookie)
      .set('x-csrf-token', sCsrfToken)
      .send({ inviteCode });
    expect(joinRes.status).toBe(201);

    // GET single puzzle — solution field must be absent
    const getRes = await request
      .get(`/api/v1/classrooms/${classroomId}/puzzles/${puzzleId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data).not.toHaveProperty('solution');

    // LIST puzzles — solution field must be absent on every item
    const listRes = await request
      .get(`/api/v1/classrooms/${classroomId}/puzzles`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(listRes.status).toBe(200);
    for (const puzzle of listRes.body.data as unknown[]) {
      expect(puzzle).not.toHaveProperty('solution');
    }
  });

  it('coach (classroom owner) DOES receive the solution field', async () => {
    const { coachToken, classroomId, puzzleId } = await setupClassroomWithPuzzle('sol2');

    // GET single puzzle — solution must be present and correct
    const getRes = await request
      .get(`/api/v1/classrooms/${classroomId}/puzzles/${puzzleId}`)
      .set('Authorization', `Bearer ${coachToken}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data).toHaveProperty('solution', TEST_SOLUTION);

    // LIST puzzles — solution must be present on every item
    const listRes = await request
      .get(`/api/v1/classrooms/${classroomId}/puzzles`)
      .set('Authorization', `Bearer ${coachToken}`);
    expect(listRes.status).toBe(200);
    expect((listRes.body.data as unknown[]).length).toBeGreaterThan(0);
    for (const puzzle of listRes.body.data as unknown[]) {
      expect(puzzle).toHaveProperty('solution');
    }
  });
});
