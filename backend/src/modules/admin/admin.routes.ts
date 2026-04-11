import { Router } from 'express';
import * as controller from './admin.controller';
import * as classroomsCtrl from '../classrooms/classrooms.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router: Router = Router();

router.use(authenticate, authorize('admin'));

router.get('/pending', controller.getPending);
router.get('/stats', controller.getStats);
router.get('/recent-users', controller.getRecentUsers);

// ─── Classroom admin endpoints ────────────────────────────────────────────────
router.get('/classrooms', classroomsCtrl.adminListClassrooms);
router.patch('/classrooms/:id/tier', classroomsCtrl.adminSetTier);

// ─── Club management ──────────────────────────────────────────────────────────
router.get('/clubs', controller.listClubs);
router.post('/clubs', controller.createClub);
router.patch('/clubs/:id', controller.updateClub);
router.delete('/clubs/:id', controller.deleteClub);

// ─── User role assignment ─────────────────────────────────────────────────────
router.patch('/users/:id/role', controller.setUserRole);

export default router;
