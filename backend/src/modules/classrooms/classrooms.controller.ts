import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as service from './classrooms.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createClassroomSchema = z.object({
  name: z.string().min(1, 'Classroom name is required.').max(80, 'Name must be at most 80 characters.'),
  description: z.string().max(500).optional(),
  locationId: z.number().int().positive().optional(),
  ageMin: z.number().int().min(0).max(99).optional(),
  ageMax: z.number().int().min(0).max(99).optional(),
});

const updateClassroomSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  locationId: z.number().int().positive().nullable().optional(),
  ageMin: z.number().int().min(0).max(99).nullable().optional(),
  ageMax: z.number().int().min(0).max(99).nullable().optional(),
});

const createPlaylistSchema = z.object({
  name: z.string().min(1, 'Playlist name is required.').max(80, 'Name must be at most 80 characters.'),
  description: z.string().max(500).optional(),
  teacherIntro: z.string().max(2000).optional(),
});

const updatePlaylistSchema = createPlaylistSchema.partial();

const addLessonSchema = z.object({
  lessonId: z.number().int().positive('Invalid lesson ID.'),
  teacherNote: z.string().max(1000).optional(),
});

const updatePlaylistLessonSchema = z.object({
  teacherNote: z.string().max(1000).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

function parseId(val: string): number {
  const n = parseInt(val);
  if (isNaN(n)) throw new AppError(400, 'Invalid ID.');
  return n;
}

// ─── Classroom CRUD ───────────────────────────────────────────────────────────

export async function listMyClassrooms(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.listMyClassrooms(req.user!.id);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function getClassroom(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const result = await service.getClassroomById(id, req.user!.id);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function createClassroom(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createClassroomSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(400, parsed.error.errors[0].message));
    const result = await service.createClassroom(
      { id: req.user!.id, role: req.user!.role, clubId: req.user!.clubId },
      parsed.data,
    );
    sendSuccess(res, result, 201);
  } catch (err) { next(err); }
}

export async function updateClassroom(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const parsed = updateClassroomSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(400, parsed.error.errors[0].message));
    const result = await service.updateClassroom(id, req.user!.id, parsed.data);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function deleteClassroom(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    await service.deleteClassroom(id, req.user!.id, req.user!.role);
    sendSuccess(res, { message: 'Classroom deleted.' });
  } catch (err) { next(err); }
}

// ─── Membership ───────────────────────────────────────────────────────────────

export async function joinClassroom(req: Request, res: Response, next: NextFunction) {
  try {
    const schema = z.object({ inviteCode: z.string().min(1, 'Invite code is required.') });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(400, parsed.error.errors[0].message));
    const result = await service.joinByCode(req.user!.id, parsed.data.inviteCode);
    sendSuccess(res, result, 201);
  } catch (err) { next(err); }
}

export async function leaveClassroom(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    await service.leaveClassroom(id, req.user!.id);
    sendSuccess(res, { message: 'You have left the classroom.' });
  } catch (err) { next(err); }
}

export async function getMembers(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const members = await service.getMembers(id, req.user!.id);
    sendSuccess(res, members);
  } catch (err) { next(err); }
}

export async function removeMember(req: Request, res: Response, next: NextFunction) {
  try {
    const classroomId = parseId(req.params.id);
    const userId = parseId(req.params.userId);
    await service.removeMember(classroomId, req.user!.id, userId);
    sendSuccess(res, { message: 'Member removed.' });
  } catch (err) { next(err); }
}

export async function getProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const progress = await service.getProgress(id, req.user!.id);
    sendSuccess(res, progress);
  } catch (err) { next(err); }
}

// ─── Playlists ────────────────────────────────────────────────────────────────

export async function listPlaylists(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const playlists = await service.listPlaylists(id, req.user!.id);
    sendSuccess(res, playlists);
  } catch (err) { next(err); }
}

export async function createPlaylist(req: Request, res: Response, next: NextFunction) {
  try {
    const classroomId = parseId(req.params.id);
    const parsed = createPlaylistSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(400, parsed.error.errors[0].message));
    const result = await service.createPlaylist(classroomId, req.user!.id, req.user!.role, parsed.data);
    sendSuccess(res, result, 201);
  } catch (err) { next(err); }
}

export async function updatePlaylist(req: Request, res: Response, next: NextFunction) {
  try {
    const classroomId = parseId(req.params.id);
    const playlistId = parseId(req.params.pid);
    const parsed = updatePlaylistSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(400, parsed.error.errors[0].message));
    const result = await service.updatePlaylist(classroomId, playlistId, req.user!.id, parsed.data);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function deletePlaylist(req: Request, res: Response, next: NextFunction) {
  try {
    const classroomId = parseId(req.params.id);
    const playlistId = parseId(req.params.pid);
    await service.deletePlaylist(classroomId, playlistId, req.user!.id);
    sendSuccess(res, { message: 'Playlist deleted.' });
  } catch (err) { next(err); }
}

export async function getPlaylist(req: Request, res: Response, next: NextFunction) {
  try {
    const classroomId = parseId(req.params.id);
    const playlistId = parseId(req.params.pid);
    const result = await service.getPlaylist(classroomId, playlistId, req.user!.id);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

// ─── Playlist Lessons ─────────────────────────────────────────────────────────

export async function addLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const classroomId = parseId(req.params.id);
    const playlistId = parseId(req.params.pid);
    const parsed = addLessonSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(400, parsed.error.errors[0].message));
    const result = await service.addLessonToPlaylist(classroomId, playlistId, req.user!.id, parsed.data.lessonId, parsed.data.teacherNote);
    sendSuccess(res, result, 201);
  } catch (err) { next(err); }
}

export async function updateLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const classroomId = parseId(req.params.id);
    const playlistId = parseId(req.params.pid);
    const lessonId = parseId(req.params.lid);
    const parsed = updatePlaylistLessonSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(400, parsed.error.errors[0].message));
    const result = await service.updatePlaylistLesson(classroomId, playlistId, lessonId, req.user!.id, parsed.data);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function removeLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const classroomId = parseId(req.params.id);
    const playlistId = parseId(req.params.pid);
    const lessonId = parseId(req.params.lid);
    await service.removeLessonFromPlaylist(classroomId, playlistId, lessonId, req.user!.id);
    sendSuccess(res, { message: 'Lesson removed from playlist.' });
  } catch (err) { next(err); }
}

// ─── Classroom Puzzles ────────────────────────────────────────────────────────

const createPuzzleSchema = z.object({
  title: z.string().min(1, 'Puzzle title is required.').max(120),
  description: z.string().max(2000).optional(),
  fen: z.string().min(1, 'FEN position is required.'),
  sideToMove: z.enum(['white', 'black']),
  solution: z.string().max(2000).optional().nullable(),
  maxMoves: z.number().int().min(1).max(30).optional().nullable(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
  lessonId: z.number().int().positive().optional().nullable(),
});

const updatePuzzleSchema = createPuzzleSchema.partial();

const submitPuzzleSchema = z.object({
  notation: z.string().min(1, 'Notation is required.'),
  notes: z.string().optional(),
});

const reviewSchema = z.object({
  isCorrect: z.boolean(),
  coachFeedback: z.string().max(2000).optional(),
});

export async function listPuzzles(req: Request, res: Response, next: NextFunction) {
  try {
    const classroomId = parseId(req.params.id);
    const result = await service.listPuzzles(classroomId, req.user!.id);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function createPuzzle(req: Request, res: Response, next: NextFunction) {
  try {
    const classroomId = parseId(req.params.id);
    const parsed = createPuzzleSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(400, parsed.error.errors[0].message));
    const result = await service.createPuzzle(classroomId, req.user!.id, parsed.data);
    sendSuccess(res, result, 201);
  } catch (err) { next(err); }
}

export async function getPuzzle(req: Request, res: Response, next: NextFunction) {
  try {
    const classroomId = parseId(req.params.id);
    const puzzleId = parseId(req.params.pid);
    const result = await service.getPuzzle(classroomId, puzzleId, req.user!.id);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function updatePuzzle(req: Request, res: Response, next: NextFunction) {
  try {
    const classroomId = parseId(req.params.id);
    const puzzleId = parseId(req.params.pid);
    const parsed = updatePuzzleSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(400, parsed.error.errors[0].message));
    const result = await service.updatePuzzle(classroomId, puzzleId, req.user!.id, parsed.data);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function deletePuzzle(req: Request, res: Response, next: NextFunction) {
  try {
    const classroomId = parseId(req.params.id);
    const puzzleId = parseId(req.params.pid);
    await service.deletePuzzle(classroomId, puzzleId, req.user!.id);
    sendSuccess(res, { message: 'Puzzle deleted.' });
  } catch (err) { next(err); }
}

export async function listSubmissions(req: Request, res: Response, next: NextFunction) {
  try {
    const classroomId = parseId(req.params.id);
    const puzzleId = parseId(req.params.pid);
    const result = await service.listSubmissions(classroomId, puzzleId, req.user!.id);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function reviewSubmission(req: Request, res: Response, next: NextFunction) {
  try {
    const classroomId = parseId(req.params.id);
    const puzzleId = parseId(req.params.pid);
    const submissionId = parseId(req.params.sid);
    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(400, parsed.error.errors[0].message));
    const result = await service.reviewSubmission(classroomId, puzzleId, submissionId, req.user!.id, parsed.data);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function getMySubmission(req: Request, res: Response, next: NextFunction) {
  try {
    const classroomId = parseId(req.params.id);
    const puzzleId = parseId(req.params.pid);
    const result = await service.getMySubmission(classroomId, puzzleId, req.user!.id);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function submitPuzzle(req: Request, res: Response, next: NextFunction) {
  try {
    const classroomId = parseId(req.params.id);
    const puzzleId = parseId(req.params.pid);
    const parsed = submitPuzzleSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(400, parsed.error.errors[0].message));
    const result = await service.submitPuzzle(classroomId, puzzleId, req.user!.id, parsed.data);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

// ─── Classroom Custom Lessons ─────────────────────────────────────────────────

const createClassroomLessonSchema = z.object({
  title: z.string().min(1, 'Lesson title is required.').max(200),
  content: z.string().min(1, 'Content is required.'),
  sortOrder: z.number().int().min(0).optional(),
});

const updateClassroomLessonSchema = createClassroomLessonSchema.partial();

export async function listClassroomLessons(req: Request, res: Response, next: NextFunction) {
  try {
    const classroomId = parseId(req.params.id);
    const result = await service.listClassroomLessons(classroomId, req.user!.id);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function getClassroomLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const classroomId = parseId(req.params.id);
    const lessonId = parseId(req.params.lid);
    const result = await service.getClassroomLesson(classroomId, lessonId, req.user!.id);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function createClassroomLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const classroomId = parseId(req.params.id);
    const parsed = createClassroomLessonSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(400, parsed.error.errors[0].message));
    const result = await service.createClassroomLesson(classroomId, req.user!.id, parsed.data);
    sendSuccess(res, result, 201);
  } catch (err) { next(err); }
}

export async function updateClassroomLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const classroomId = parseId(req.params.id);
    const lessonId = parseId(req.params.lid);
    const parsed = updateClassroomLessonSchema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(400, parsed.error.errors[0].message));
    const result = await service.updateClassroomLesson(classroomId, lessonId, req.user!.id, parsed.data);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function deleteClassroomLesson(req: Request, res: Response, next: NextFunction) {
  try {
    const classroomId = parseId(req.params.id);
    const lessonId = parseId(req.params.lid);
    await service.deleteClassroomLesson(classroomId, lessonId, req.user!.id);
    sendSuccess(res, { message: 'Lesson deleted.' });
  } catch (err) { next(err); }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function adminListClassrooms(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await service.adminListClassrooms(page, limit);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function adminSetTier(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    const schema = z.object({ tier: z.enum(['free', 'premium']) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return next(new AppError(400, parsed.error.errors[0].message));
    const result = await service.setTier(id, parsed.data.tier);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}
