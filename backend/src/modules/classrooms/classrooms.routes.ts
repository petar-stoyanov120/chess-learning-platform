import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as ctrl from './classrooms.controller';

const router: Router = Router();

// All classroom routes require authentication
router.use(authenticate);

// ─── My classrooms list ────────────────────────────────────────────────────
router.get('/', ctrl.listMyClassrooms);

// ─── Join via invite code ─────────────────────────────────────────────────
router.post('/join', ctrl.joinClassroom);

// ─── Create (collaborator/admin/club_admin/coach only) ────────────────────
router.post('/', authorize('collaborator', 'admin', 'club_admin', 'coach'), ctrl.createClassroom);

// ─── Single classroom routes ──────────────────────────────────────────────
router.get('/:id', ctrl.getClassroom);
router.patch('/:id', ctrl.updateClassroom);
router.delete('/:id', ctrl.deleteClassroom);

// ─── Membership ───────────────────────────────────────────────────────────
router.post('/:id/leave', ctrl.leaveClassroom);
router.get('/:id/members', ctrl.getMembers);
router.delete('/:id/members/:userId', ctrl.removeMember);

// ─── Progress ─────────────────────────────────────────────────────────────
router.get('/:id/progress', ctrl.getProgress);

// ─── Playlists ────────────────────────────────────────────────────────────
router.get('/:id/playlists', ctrl.listPlaylists);
router.post('/:id/playlists', ctrl.createPlaylist);
router.get('/:id/playlists/:pid', ctrl.getPlaylist);
router.patch('/:id/playlists/:pid', ctrl.updatePlaylist);
router.delete('/:id/playlists/:pid', ctrl.deletePlaylist);

// ─── Playlist lessons ─────────────────────────────────────────────────────
router.post('/:id/playlists/:pid/lessons', ctrl.addLesson);
router.patch('/:id/playlists/:pid/lessons/:lid', ctrl.updateLesson);
router.delete('/:id/playlists/:pid/lessons/:lid', ctrl.removeLesson);

// ─── Classroom puzzles ────────────────────────────────────────────────────
router.get('/:id/puzzles', ctrl.listPuzzles);
router.post('/:id/puzzles', ctrl.createPuzzle);
router.get('/:id/puzzles/:pid/submissions', ctrl.listSubmissions);
router.patch('/:id/puzzles/:pid/submissions/:sid', ctrl.reviewSubmission);
router.get('/:id/puzzles/:pid/my-submission', ctrl.getMySubmission);
router.post('/:id/puzzles/:pid/submit', ctrl.submitPuzzle);
router.get('/:id/puzzles/:pid', ctrl.getPuzzle);
router.patch('/:id/puzzles/:pid', ctrl.updatePuzzle);
router.delete('/:id/puzzles/:pid', ctrl.deletePuzzle);

// ─── Classroom custom lessons ─────────────────────────────────────────────────
router.get('/:id/classroom-lessons', ctrl.listClassroomLessons);
router.post('/:id/classroom-lessons', ctrl.createClassroomLesson);
router.get('/:id/classroom-lessons/:lid', ctrl.getClassroomLesson);
router.patch('/:id/classroom-lessons/:lid', ctrl.updateClassroomLesson);
router.delete('/:id/classroom-lessons/:lid', ctrl.deleteClassroomLesson);

export default router;
