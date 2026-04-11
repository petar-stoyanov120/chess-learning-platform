import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { getStatusId } from '../../config/statusCache';
import { hasLocationAccess } from '../../utils/locationAccess';

const FREE_MAX_CLASSROOMS = 3;
const FREE_MAX_PLAYLISTS = 5;
const FREE_MAX_STUDENTS = 30;

const lessonSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImageUrl: true,
  readingTime: true,
  createdAt: true,
  author: { select: { id: true, username: true } },
  category: { select: { id: true, name: true, slug: true } },
  level: { select: { id: true, name: true, sortOrder: true } },
  status: { select: { id: true, name: true } },
};

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function generateUniqueCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateInviteCode();
    const existing = await prisma.classroom.findUnique({ where: { inviteCode: code } });
    if (!existing) return code;
  }
  throw new AppError(500, 'Failed to generate unique invite code. Please try again.');
}

/** Verify a user is the owner of a classroom, throws 403/404 otherwise. */
async function requireOwner(classroomId: number, userId: number) {
  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
  if (!classroom) throw new AppError(404, 'Classroom not found.');
  if (classroom.ownerId !== userId) throw new AppError(403, 'Only the classroom owner can perform this action.');
  return classroom;
}

/** Verify a user is either the owner or an enrolled member, throws otherwise. */
async function requireAccess(classroomId: number, userId: number) {
  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    include: { members: { where: { userId } } },
  });
  if (!classroom) throw new AppError(404, 'Classroom not found.');
  if (!classroom.isActive) throw new AppError(403, 'This classroom is no longer active.');
  if (classroom.ownerId !== userId && classroom.members.length === 0) {
    throw new AppError(403, 'You are not a member of this classroom.');
  }
  return classroom;
}

// ─── Classroom CRUD ──────────────────────────────────────────────────────────

export async function listMyClassrooms(userId: number) {
  const [owned, joined] = await Promise.all([
    prisma.classroom.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { members: true, playlists: true } },
      },
    }),
    prisma.classroomMember.findMany({
      where: { userId },
      orderBy: { joinedAt: 'desc' },
      include: {
        classroom: {
          include: {
            _count: { select: { playlists: true } },
            owner: { select: { id: true, username: true, displayName: true } },
          },
        },
      },
    }),
  ]);
  return { owned, joined: joined.map((m) => ({ ...m.classroom, joinedAt: m.joinedAt })) };
}

export async function getClassroomById(classroomId: number, userId: number) {
  const classroom = await requireAccess(classroomId, userId);
  const full = await prisma.classroom.findUnique({
    where: { id: classroomId },
    include: {
      owner: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      location: { select: { id: true, name: true } },
      playlists: {
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { lessons: true } } },
      },
      _count: { select: { members: true } },
    },
  });
  const isOwner = classroom.ownerId === userId;
  return { ...full, isOwner };
}

export async function createClassroom(
  owner: { id: number; role: string; clubId?: number | null },
  data: { name: string; description?: string; locationId?: number; ageMin?: number; ageMax?: number },
) {
  if (owner.role === 'user') {
    throw new AppError(403, 'Only collaborators and admins can create classrooms.');
  }

  if (owner.role !== 'admin') {
    const count = await prisma.classroom.count({ where: { ownerId: owner.id } });
    if (count >= FREE_MAX_CLASSROOMS) {
      throw new AppError(400, `Free tier allows up to ${FREE_MAX_CLASSROOMS} classrooms. Upgrade to premium for unlimited classrooms.`);
    }
  }

  // If locationId provided, verify the owner has access to that location
  if (data.locationId) {
    const user = { id: owner.id, role: owner.role, clubId: owner.clubId ?? null } as any;
    const access = await hasLocationAccess(prisma, data.locationId, user);
    if (!access) {
      throw new AppError(403, 'You do not have access to that location.');
    }
  }

  const inviteCode = await generateUniqueCode();

  return prisma.classroom.create({
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      inviteCode,
      ownerId: owner.id,
      locationId: data.locationId ?? null,
      ageMin: data.ageMin ?? null,
      ageMax: data.ageMax ?? null,
    },
    include: {
      _count: { select: { members: true, playlists: true } },
      location: { select: { id: true, name: true } },
    },
  });
}

export async function updateClassroom(
  classroomId: number,
  userId: number,
  data: { name?: string; description?: string; isActive?: boolean; locationId?: number | null; ageMin?: number | null; ageMax?: number | null },
) {
  await requireOwner(classroomId, userId);
  return prisma.classroom.update({
    where: { id: classroomId },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.description !== undefined ? { description: data.description.trim() || null } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      ...(data.locationId !== undefined ? { locationId: data.locationId } : {}),
      ...(data.ageMin !== undefined ? { ageMin: data.ageMin } : {}),
      ...(data.ageMax !== undefined ? { ageMax: data.ageMax } : {}),
    },
    include: {
      _count: { select: { members: true, playlists: true } },
      location: { select: { id: true, name: true } },
    },
  });
}

export async function deleteClassroom(classroomId: number, userId: number, userRole: string) {
  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
  if (!classroom) throw new AppError(404, 'Classroom not found.');
  if (classroom.ownerId !== userId && userRole !== 'admin') {
    throw new AppError(403, 'Only the classroom owner or an admin can delete this classroom.');
  }
  await prisma.classroom.delete({ where: { id: classroomId } });
}

// ─── Membership ───────────────────────────────────────────────────────────────

export async function joinByCode(userId: number, inviteCode: string) {
  const classroom = await prisma.classroom.findUnique({ where: { inviteCode: inviteCode.toUpperCase().trim() } });
  if (!classroom) throw new AppError(404, 'Invalid invite code. Please check and try again.');
  if (!classroom.isActive) throw new AppError(400, 'This classroom is no longer active.');
  if (classroom.ownerId === userId) {
    throw new AppError(400, 'You are the owner of this classroom.');
  }

  const existing = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId: classroom.id, userId } },
  });
  if (existing) throw new AppError(400, 'You are already a member of this classroom.');

  // Check free tier student limit
  if (classroom.tier === 'free') {
    const memberCount = await prisma.classroomMember.count({ where: { classroomId: classroom.id } });
    if (memberCount >= FREE_MAX_STUDENTS) {
      throw new AppError(400, 'This classroom has reached its student limit.');
    }
  }

  await prisma.classroomMember.create({ data: { classroomId: classroom.id, userId } });
  return prisma.classroom.findUnique({
    where: { id: classroom.id },
    include: {
      owner: { select: { id: true, username: true, displayName: true } },
      _count: { select: { members: true, playlists: true } },
    },
  });
}

export async function leaveClassroom(classroomId: number, userId: number) {
  const member = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId, userId } },
  });
  if (!member) throw new AppError(404, 'You are not a member of this classroom.');
  await prisma.classroomMember.delete({ where: { id: member.id } });
}

export async function getMembers(classroomId: number, requesterId: number) {
  await requireOwner(classroomId, requesterId);
  return prisma.classroomMember.findMany({
    where: { classroomId },
    orderBy: { joinedAt: 'asc' },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true, email: true } },
    },
  });
}

export async function removeMember(classroomId: number, ownerId: number, targetUserId: number) {
  await requireOwner(classroomId, ownerId);
  const member = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId, userId: targetUserId } },
  });
  if (!member) throw new AppError(404, 'This user is not a member of the classroom.');
  await prisma.classroomMember.delete({ where: { id: member.id } });
}

export async function getProgress(classroomId: number, requesterId: number) {
  await requireOwner(classroomId, requesterId);

  // Collect all lesson IDs from all playlists in this classroom
  const playlists = await prisma.classroomPlaylist.findMany({
    where: { classroomId },
    include: { lessons: { select: { lessonId: true } } },
  });
  const lessonIds = [...new Set(playlists.flatMap((p) => p.lessons.map((l) => l.lessonId)))];
  const totalLessons = lessonIds.length;

  // Get all members
  const members = await prisma.classroomMember.findMany({
    where: { classroomId },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });

  if (totalLessons === 0 || members.length === 0) {
    return members.map((m) => ({ user: m.user, completedCount: 0, totalCount: totalLessons, percent: 0 }));
  }

  // For each member, count completed lessons from this classroom
  const progressData = await prisma.lessonProgress.groupBy({
    by: ['userId'],
    where: {
      userId: { in: members.map((m) => m.userId) },
      lessonId: { in: lessonIds },
    },
    _count: { lessonId: true },
  });

  const progressMap = new Map(progressData.map((p) => [p.userId, p._count.lessonId]));

  return members.map((m) => {
    const completed = progressMap.get(m.userId) ?? 0;
    return {
      user: m.user,
      completedCount: completed,
      totalCount: totalLessons,
      percent: totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0,
    };
  });
}

// ─── Playlists ────────────────────────────────────────────────────────────────

export async function listPlaylists(classroomId: number, requesterId: number) {
  await requireAccess(classroomId, requesterId);
  return prisma.classroomPlaylist.findMany({
    where: { classroomId },
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { lessons: true } } },
  });
}

export async function createPlaylist(classroomId: number, ownerId: number, ownerRole: string, data: { name: string; description?: string; teacherIntro?: string }) {
  const classroom = await requireOwner(classroomId, ownerId);

  if (classroom.tier === 'free' && ownerRole !== 'admin') {
    const count = await prisma.classroomPlaylist.count({ where: { classroomId } });
    if (count >= FREE_MAX_PLAYLISTS) {
      throw new AppError(400, `Free tier allows up to ${FREE_MAX_PLAYLISTS} playlists per classroom. Upgrade to premium for unlimited playlists.`);
    }
  }

  const maxSort = await prisma.classroomPlaylist.aggregate({
    where: { classroomId },
    _max: { sortOrder: true },
  });

  return prisma.classroomPlaylist.create({
    data: {
      classroomId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      teacherIntro: data.teacherIntro?.trim() || null,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
    include: { _count: { select: { lessons: true } } },
  });
}

export async function updatePlaylist(classroomId: number, playlistId: number, ownerId: number, data: { name?: string; description?: string; teacherIntro?: string }) {
  await requireOwner(classroomId, ownerId);
  const playlist = await prisma.classroomPlaylist.findUnique({ where: { id: playlistId } });
  if (!playlist || playlist.classroomId !== classroomId) throw new AppError(404, 'Playlist not found.');

  return prisma.classroomPlaylist.update({
    where: { id: playlistId },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.description !== undefined ? { description: data.description.trim() || null } : {}),
      ...(data.teacherIntro !== undefined ? { teacherIntro: data.teacherIntro.trim() || null } : {}),
    },
    include: { _count: { select: { lessons: true } } },
  });
}

export async function deletePlaylist(classroomId: number, playlistId: number, ownerId: number) {
  await requireOwner(classroomId, ownerId);
  const playlist = await prisma.classroomPlaylist.findUnique({ where: { id: playlistId } });
  if (!playlist || playlist.classroomId !== classroomId) throw new AppError(404, 'Playlist not found.');
  await prisma.classroomPlaylist.delete({ where: { id: playlistId } });
}

export async function getPlaylist(classroomId: number, playlistId: number, requesterId: number) {
  await requireAccess(classroomId, requesterId);

  const playlist = await prisma.classroomPlaylist.findUnique({
    where: { id: playlistId },
    include: {
      lessons: {
        orderBy: { sortOrder: 'asc' },
        include: { lesson: { select: lessonSelect } },
      },
    },
  });
  if (!playlist || playlist.classroomId !== classroomId) throw new AppError(404, 'Playlist not found.');

  // Attach completion status for requester
  const lessonIds = playlist.lessons.map((l) => l.lessonId);
  const completed = await prisma.lessonProgress.findMany({
    where: { userId: requesterId, lessonId: { in: lessonIds } },
    select: { lessonId: true },
  });
  const completedSet = new Set(completed.map((c) => c.lessonId));

  return {
    ...playlist,
    lessons: playlist.lessons.map((l) => ({
      ...l.lesson,
      sortOrder: l.sortOrder,
      teacherNote: l.teacherNote,
      completed: completedSet.has(l.lessonId),
    })),
  };
}

// ─── Playlist Lessons ─────────────────────────────────────────────────────────

export async function addLessonToPlaylist(classroomId: number, playlistId: number, ownerId: number, lessonId: number, teacherNote?: string) {
  await requireOwner(classroomId, ownerId);
  const playlist = await prisma.classroomPlaylist.findUnique({ where: { id: playlistId } });
  if (!playlist || playlist.classroomId !== classroomId) throw new AppError(404, 'Playlist not found.');

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson || lesson.statusId !== getStatusId('published')) {
    throw new AppError(404, 'Lesson not found or not published.');
  }

  const existing = await prisma.classroomPlaylistLesson.findUnique({
    where: { classroomPlaylistId_lessonId: { classroomPlaylistId: playlistId, lessonId } },
  });
  if (existing) throw new AppError(400, 'This lesson is already in the playlist.');

  const maxSort = await prisma.classroomPlaylistLesson.aggregate({
    where: { classroomPlaylistId: playlistId },
    _max: { sortOrder: true },
  });

  return prisma.classroomPlaylistLesson.create({
    data: {
      classroomPlaylistId: playlistId,
      lessonId,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      teacherNote: teacherNote?.trim() || null,
    },
    include: { lesson: { select: lessonSelect } },
  });
}

export async function updatePlaylistLesson(classroomId: number, playlistId: number, lessonId: number, ownerId: number, data: { teacherNote?: string; sortOrder?: number }) {
  await requireOwner(classroomId, ownerId);
  const entry = await prisma.classroomPlaylistLesson.findUnique({
    where: { classroomPlaylistId_lessonId: { classroomPlaylistId: playlistId, lessonId } },
  });
  if (!entry) throw new AppError(404, 'Lesson not found in this playlist.');

  return prisma.classroomPlaylistLesson.update({
    where: { id: entry.id },
    data: {
      ...(data.teacherNote !== undefined ? { teacherNote: data.teacherNote.trim() || null } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
    },
    include: { lesson: { select: lessonSelect } },
  });
}

export async function removeLessonFromPlaylist(classroomId: number, playlistId: number, lessonId: number, ownerId: number) {
  await requireOwner(classroomId, ownerId);
  const entry = await prisma.classroomPlaylistLesson.findUnique({
    where: { classroomPlaylistId_lessonId: { classroomPlaylistId: playlistId, lessonId } },
  });
  if (!entry) throw new AppError(404, 'Lesson not found in this playlist.');
  await prisma.classroomPlaylistLesson.delete({ where: { id: entry.id } });
}

// ─── Admin: set tier ──────────────────────────────────────────────────────────

export async function setTier(classroomId: number, tier: 'free' | 'premium') {
  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
  if (!classroom) throw new AppError(404, 'Classroom not found.');
  return prisma.classroom.update({ where: { id: classroomId }, data: { tier } });
}

// ─── Classroom Puzzles ────────────────────────────────────────────────────────

const puzzleSelect = {
  id: true,
  classroomId: true,
  lessonId: true,
  title: true,
  description: true,
  fen: true,
  sideToMove: true,
  solution: true,
  maxMoves: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
};

export async function listPuzzles(classroomId: number, requesterId: number) {
  await requireAccess(classroomId, requesterId);
  // Only return standalone puzzles (not attached to a classroom lesson)
  return prisma.classroomPuzzle.findMany({
    where: { classroomId, lessonId: null },
    orderBy: { createdAt: 'asc' },
    select: { ...puzzleSelect, _count: { select: { submissions: true } } },
  });
}

export async function getPuzzle(classroomId: number, puzzleId: number, requesterId: number) {
  await requireAccess(classroomId, requesterId);
  const puzzle = await prisma.classroomPuzzle.findUnique({
    where: { id: puzzleId },
    select: { ...puzzleSelect, _count: { select: { submissions: true } } },
  });
  if (!puzzle || puzzle.classroomId !== classroomId) throw new AppError(404, 'Puzzle not found.');
  return puzzle;
}

export async function createPuzzle(
  classroomId: number,
  ownerId: number,
  data: { title: string; description?: string; fen: string; sideToMove: string; dueDate?: string | null; lessonId?: number | null },
) {
  await requireOwner(classroomId, ownerId);
  // If attaching to a lesson, verify the lesson belongs to this classroom
  if (data.lessonId) {
    const lesson = await prisma.classroomLesson.findUnique({ where: { id: data.lessonId } });
    if (!lesson || lesson.classroomId !== classroomId) throw new AppError(404, 'Lesson not found.');
  }
  return prisma.classroomPuzzle.create({
    data: {
      classroomId,
      lessonId: data.lessonId ?? null,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      fen: data.fen.trim(),
      sideToMove: data.sideToMove,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
    select: { ...puzzleSelect, _count: { select: { submissions: true } } },
  });
}

export async function updatePuzzle(
  classroomId: number,
  puzzleId: number,
  ownerId: number,
  data: { title?: string; description?: string; fen?: string; sideToMove?: string; dueDate?: string | null },
) {
  await requireOwner(classroomId, ownerId);
  const puzzle = await prisma.classroomPuzzle.findUnique({ where: { id: puzzleId } });
  if (!puzzle || puzzle.classroomId !== classroomId) throw new AppError(404, 'Puzzle not found.');

  const subCount = await prisma.classroomPuzzleSubmission.count({ where: { puzzleId } });
  if (subCount > 0) {
    throw new AppError(400, 'Cannot edit a puzzle that already has student submissions.');
  }

  return prisma.classroomPuzzle.update({
    where: { id: puzzleId },
    data: {
      ...(data.title !== undefined ? { title: data.title.trim() } : {}),
      ...(data.description !== undefined ? { description: data.description.trim() || null } : {}),
      ...(data.fen !== undefined ? { fen: data.fen.trim() } : {}),
      ...(data.sideToMove !== undefined ? { sideToMove: data.sideToMove } : {}),
      ...(data.dueDate !== undefined ? { dueDate: data.dueDate ? new Date(data.dueDate) : null } : {}),
    },
    select: { ...puzzleSelect, _count: { select: { submissions: true } } },
  });
}

export async function deletePuzzle(classroomId: number, puzzleId: number, ownerId: number) {
  await requireOwner(classroomId, ownerId);
  const puzzle = await prisma.classroomPuzzle.findUnique({ where: { id: puzzleId } });
  if (!puzzle || puzzle.classroomId !== classroomId) throw new AppError(404, 'Puzzle not found.');
  await prisma.classroomPuzzle.delete({ where: { id: puzzleId } });
}

export async function listSubmissions(classroomId: number, puzzleId: number, ownerId: number) {
  await requireOwner(classroomId, ownerId);
  const puzzle = await prisma.classroomPuzzle.findUnique({ where: { id: puzzleId } });
  if (!puzzle || puzzle.classroomId !== classroomId) throw new AppError(404, 'Puzzle not found.');

  return prisma.classroomPuzzleSubmission.findMany({
    where: { puzzleId },
    orderBy: { submittedAt: 'asc' },
    include: {
      user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  });
}

export async function reviewSubmission(
  classroomId: number,
  puzzleId: number,
  submissionId: number,
  ownerId: number,
  data: { isCorrect: boolean; coachFeedback?: string },
) {
  await requireOwner(classroomId, ownerId);
  const puzzle = await prisma.classroomPuzzle.findUnique({ where: { id: puzzleId } });
  if (!puzzle || puzzle.classroomId !== classroomId) throw new AppError(404, 'Puzzle not found.');

  const submission = await prisma.classroomPuzzleSubmission.findUnique({ where: { id: submissionId } });
  if (!submission || submission.puzzleId !== puzzleId) throw new AppError(404, 'Submission not found.');

  return prisma.classroomPuzzleSubmission.update({
    where: { id: submissionId },
    data: {
      isCorrect: data.isCorrect,
      coachFeedback: data.coachFeedback?.trim() || null,
      reviewedAt: new Date(),
    },
    include: {
      user: { select: { id: true, username: true, displayName: true } },
    },
  });
}

export async function getMySubmission(classroomId: number, puzzleId: number, userId: number) {
  await requireAccess(classroomId, userId);
  const puzzle = await prisma.classroomPuzzle.findUnique({ where: { id: puzzleId } });
  if (!puzzle || puzzle.classroomId !== classroomId) throw new AppError(404, 'Puzzle not found.');

  return prisma.classroomPuzzleSubmission.findUnique({
    where: { puzzleId_userId: { puzzleId, userId } },
  });
}

export async function submitPuzzle(
  classroomId: number,
  puzzleId: number,
  userId: number,
  data: { notation: string; notes?: string },
) {
  await requireAccess(classroomId, userId);
  const puzzle = await prisma.classroomPuzzle.findUnique({ where: { id: puzzleId } });
  if (!puzzle || puzzle.classroomId !== classroomId) throw new AppError(404, 'Puzzle not found.');

  const existing = await prisma.classroomPuzzleSubmission.findUnique({
    where: { puzzleId_userId: { puzzleId, userId } },
  });
  if (existing?.reviewedAt) {
    throw new AppError(403, 'This submission has been reviewed and is now locked.');
  }

  return prisma.classroomPuzzleSubmission.upsert({
    where: { puzzleId_userId: { puzzleId, userId } },
    create: {
      puzzleId,
      userId,
      notation: data.notation.trim(),
      notes: data.notes?.trim() || null,
    },
    update: {
      notation: data.notation.trim(),
      notes: data.notes?.trim() || null,
    },
  });
}

// ─── Admin: set tier ──────────────────────────────────────────────────────────

export async function adminListClassrooms(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [total, classrooms] = await Promise.all([
    prisma.classroom.count(),
    prisma.classroom.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, username: true, email: true } },
        _count: { select: { members: true, playlists: true } },
      },
    }),
  ]);
  return { classrooms, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ─── Classroom Custom Lessons ─────────────────────────────────────────────────

export async function listClassroomLessons(classroomId: number, requesterId: number) {
  await requireAccess(classroomId, requesterId);
  return prisma.classroomLesson.findMany({
    where: { classroomId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      classroomId: true,
      title: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { puzzles: true } },
    },
  });
}

export async function getClassroomLesson(classroomId: number, lessonId: number, requesterId: number) {
  await requireAccess(classroomId, requesterId);
  const lesson = await prisma.classroomLesson.findUnique({
    where: { id: lessonId },
    include: {
      puzzles: {
        orderBy: { createdAt: 'asc' },
        select: { ...puzzleSelect, _count: { select: { submissions: true } } },
      },
    },
  });
  if (!lesson || lesson.classroomId !== classroomId) throw new AppError(404, 'Lesson not found.');
  return lesson;
}

export async function createClassroomLesson(
  classroomId: number,
  ownerId: number,
  data: { title: string; content: string; sortOrder?: number },
) {
  await requireOwner(classroomId, ownerId);
  const nextOrder = data.sortOrder ?? (await prisma.classroomLesson.count({ where: { classroomId } }));
  return prisma.classroomLesson.create({
    data: {
      classroomId,
      title: data.title.trim(),
      content: data.content,
      sortOrder: nextOrder,
    },
  });
}

export async function updateClassroomLesson(
  classroomId: number,
  lessonId: number,
  ownerId: number,
  data: { title?: string; content?: string; sortOrder?: number },
) {
  await requireOwner(classroomId, ownerId);
  const lesson = await prisma.classroomLesson.findUnique({ where: { id: lessonId } });
  if (!lesson || lesson.classroomId !== classroomId) throw new AppError(404, 'Lesson not found.');
  return prisma.classroomLesson.update({
    where: { id: lessonId },
    data: {
      ...(data.title !== undefined ? { title: data.title.trim() } : {}),
      ...(data.content !== undefined ? { content: data.content } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
    },
  });
}

export async function deleteClassroomLesson(classroomId: number, lessonId: number, ownerId: number) {
  await requireOwner(classroomId, ownerId);
  const lesson = await prisma.classroomLesson.findUnique({ where: { id: lessonId } });
  if (!lesson || lesson.classroomId !== classroomId) throw new AppError(404, 'Lesson not found.');
  await prisma.classroomLesson.delete({ where: { id: lessonId } });
}
