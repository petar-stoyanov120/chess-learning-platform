import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import * as ctrl from './club-admin.controller';

const router: Router = Router();

router.use(authenticate);
router.use(authorize('club_admin', 'admin'));

// ─── Coach management ─────────────────────────────────────────────────────────
router.get('/coaches', ctrl.listCoaches);
router.get('/users/search', ctrl.searchUsers);
router.post('/users/:id/promote', ctrl.promoteToCoach);
router.delete('/users/:id/demote', ctrl.demoteCoach);

export default router;
