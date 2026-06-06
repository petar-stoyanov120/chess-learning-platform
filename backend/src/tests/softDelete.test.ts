import { clearDatabase, seedBase, request, createTestUser, prisma } from './helpers';
import * as lessonsService from '../modules/lessons/lessons.service';
import * as classroomsService from '../modules/classrooms/classrooms.service';
import * as usersService from '../modules/users/users.service';
import { markLessonComplete } from '../modules/lessons/progress.service';

beforeAll(async () => {
  await seedBase();
});

beforeEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

/** Create a "ready" lesson directly (createLesson always starts as draft). */
async function createReadyLesson(authorId: number, title = 'Soft Delete Lesson') {
  const category = await prisma.category.findFirstOrThrow();
  const level = await prisma.difficultyLevel.findFirstOrThrow();
  return prisma.lesson.create({
    data: { title, content: '.', authorId, categoryId: category.id, difficultyLevelId: level.id, status: 'ready' },
  });
}

describe('Lesson soft delete', () => {
  it('deleteLesson sets deletedAt and hides it from reads, restore brings it back, hard delete removes it', async () => {
    const admin = await createTestUser('admin', 'lsd');
    const lesson = await createReadyLesson(admin.id);

    await lessonsService.deleteLesson(lesson.id);

    // Row still exists but is marked deleted
    const row = await prisma.lesson.findUnique({ where: { id: lesson.id } });
    expect(row?.deletedAt).toBeInstanceOf(Date);

    // Excluded from normal reads
    const { lessons } = await lessonsService.listLessons({});
    expect(lessons.find((l) => l.id === lesson.id)).toBeUndefined();
    await expect(lessonsService.getLessonById(lesson.id)).rejects.toMatchObject({ statusCode: 404 });

    // Visible in the admin deleted listing
    const { lessons: deleted } = await lessonsService.listDeletedLessons({});
    expect(deleted.find((l) => l.id === lesson.id)).toBeDefined();

    // Restore
    await lessonsService.restoreLesson(lesson.id);
    const after = await lessonsService.getLessonById(lesson.id);
    expect(after.id).toBe(lesson.id);

    // Hard delete really removes the row
    await lessonsService.hardDeleteLesson(lesson.id);
    expect(await prisma.lesson.findUnique({ where: { id: lesson.id } })).toBeNull();
  });

  it('M5: a soft-deleted lesson drops out of a classroom playlist but its progress survives', async () => {
    const coach = await createTestUser('coach', 'm5');
    const student = await createTestUser('user', 'm5');
    const lesson = await createReadyLesson(coach.id, 'Playlist Lesson');

    const classroom = await classroomsService.createClassroom(
      { id: coach.id, role: 'coach', clubId: null },
      { name: 'M5 Classroom' },
    );
    const playlist = await classroomsService.createPlaylist(classroom.id, coach.id, { name: 'Pl' });
    await classroomsService.addLessonToPlaylist(classroom.id, playlist.id, coach.id, lesson.id);

    // Student completes the lesson
    await markLessonComplete(student.id, lesson.id);

    // Before delete: lesson is in the playlist
    const before = await classroomsService.getPlaylist(classroom.id, playlist.id, coach.id);
    expect(before.lessons.map((l) => l.id)).toContain(lesson.id);

    // Soft delete the lesson
    await lessonsService.deleteLesson(lesson.id);

    // It disappears from the playlist...
    const after = await classroomsService.getPlaylist(classroom.id, playlist.id, coach.id);
    expect(after.lessons.map((l) => l.id)).not.toContain(lesson.id);

    // ...but the student's progress record is preserved, and so is the playlist link
    const progress = await prisma.lessonProgress.findFirst({ where: { userId: student.id, lessonId: lesson.id } });
    expect(progress).not.toBeNull();
    const link = await prisma.classroomPlaylistLesson.findFirst({ where: { lessonId: lesson.id } });
    expect(link).not.toBeNull();

    // Restoring the lesson makes it reappear in the playlist
    await lessonsService.restoreLesson(lesson.id);
    const restored = await classroomsService.getPlaylist(classroom.id, playlist.id, coach.id);
    expect(restored.lessons.map((l) => l.id)).toContain(lesson.id);
  });
});

describe('Classroom soft delete', () => {
  it('soft delete hides the classroom, restore brings it back, hard delete removes it', async () => {
    const coach = await createTestUser('coach', 'csd');
    const classroom = await classroomsService.createClassroom(
      { id: coach.id, role: 'coach', clubId: null },
      { name: 'CSD Classroom' },
    );

    await classroomsService.deleteClassroom(classroom.id, coach.id, 'coach');

    // Marked deleted, excluded from the owner's list and the admin list
    const row = await prisma.classroom.findUnique({ where: { id: classroom.id } });
    expect(row?.deletedAt).toBeInstanceOf(Date);
    const mine = await classroomsService.listMyClassrooms(coach.id);
    expect(mine.owned.find((c) => c.id === classroom.id)).toBeUndefined();
    const adminList = await classroomsService.adminListClassrooms();
    expect(adminList.classrooms.find((c) => c.id === classroom.id)).toBeUndefined();
    const adminDeleted = await classroomsService.adminListDeletedClassrooms();
    expect(adminDeleted.classrooms.find((c) => c.id === classroom.id)).toBeDefined();

    // Restore
    await classroomsService.restoreClassroom(classroom.id);
    const restored = await classroomsService.listMyClassrooms(coach.id);
    expect(restored.owned.find((c) => c.id === classroom.id)).toBeDefined();

    // Hard delete
    await classroomsService.hardDeleteClassroom(classroom.id);
    expect(await prisma.classroom.findUnique({ where: { id: classroom.id } })).toBeNull();
  });
});

describe('User soft delete', () => {
  it('soft delete hides the user from reads and hard delete removes them', async () => {
    const admin = await createTestUser('admin', 'usd');
    const victim = await createTestUser('user', 'usd');

    await usersService.deleteUser(victim.id);

    const row = await prisma.user.findUnique({ where: { id: victim.id } });
    expect(row?.deletedAt).toBeInstanceOf(Date);
    await expect(usersService.getUser(victim.id)).rejects.toMatchObject({ statusCode: 404 });
    const { users } = await usersService.listUsers({});
    expect(users.find((u) => u.id === victim.id)).toBeUndefined();
    const { users: deleted } = await usersService.listDeletedUsers({});
    expect(deleted.find((u) => u.id === victim.id)).toBeDefined();

    await usersService.hardDeleteUser(victim.id);
    expect(await prisma.user.findUnique({ where: { id: victim.id } })).toBeNull();
    // admin untouched
    expect(await prisma.user.findUnique({ where: { id: admin.id } })).not.toBeNull();
  });

  it('a soft-deleted user can no longer log in or use an existing token', async () => {
    const user = await createTestUser('user', 'authsd');

    // Token issued while active
    const loginRes = await request.post('/api/v1/auth/login').send({ email: user.email, password: 'password123' });
    expect(loginRes.status).toBe(200);
    const token: string = loginRes.body.data.accessToken;

    await usersService.deleteUser(user.id);

    // Existing token is rejected
    const meRes = await request.get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);
    expect(meRes.status).toBe(401);

    // Fresh login is rejected
    const reloginRes = await request.post('/api/v1/auth/login').send({ email: user.email, password: 'password123' });
    expect(reloginRes.status).toBe(401);
  });
});

describe('Soft-delete admin endpoints are admin-only', () => {
  it('non-admins cannot list deleted lessons or users', async () => {
    const coach = await createTestUser('coach', 'authz');
    const loginRes = await request.post('/api/v1/auth/login').send({ email: coach.email, password: 'password123' });
    const token: string = loginRes.body.data.accessToken;

    const lessonsRes = await request.get('/api/v1/lessons/deleted').set('Authorization', `Bearer ${token}`);
    expect(lessonsRes.status).toBe(403);

    const usersRes = await request.get('/api/v1/users/deleted').set('Authorization', `Bearer ${token}`);
    expect(usersRes.status).toBe(403);
  });
});
