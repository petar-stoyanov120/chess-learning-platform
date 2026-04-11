import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as ctrl from './locations.controller';

const router: Router = Router();

// All location routes require authentication
router.use(authenticate);

// ─── Location CRUD ────────────────────────────────────────────────────────────
router.get('/', ctrl.listLocations);
router.post('/', authorize('club_admin', 'admin'), ctrl.createLocation);
router.get('/:id', ctrl.getLocation);
router.patch('/:id', ctrl.updateLocation);
router.delete('/:id', ctrl.deleteLocation);

// ─── Classrooms at location (privacy-filtered) ────────────────────────────────
router.get('/:id/classrooms', ctrl.listLocationClassrooms);

// ─── Coaches ──────────────────────────────────────────────────────────────────
router.get('/:id/coaches', ctrl.listCoaches);
router.post('/:id/coaches', ctrl.addCoach);
router.delete('/:id/coaches/:userId', ctrl.removeCoach);

// ─── Notice board ─────────────────────────────────────────────────────────────
router.get('/:id/notices', ctrl.listNotices);
router.post('/:id/notices', ctrl.createNotice);
router.patch('/:id/notices/:nid', ctrl.updateNotice);
router.delete('/:id/notices/:nid', ctrl.deleteNotice);
router.post('/:id/notices/:nid/approve', ctrl.approveNotice);
router.post('/:id/notices/:nid/reject', ctrl.rejectNotice);

export default router;
