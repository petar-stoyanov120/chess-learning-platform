import { Router } from 'express';
import * as controller from './lessons.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router: Router = Router();

// Internal coach-only lesson library (all routes authenticated)

// Named routes (must come BEFORE /:id to avoid conflict)
router.get('/my/list', authenticate, authorize('admin', 'club_admin', 'coach'), controller.listMine);
router.get('/my/progress', authenticate, controller.getProgress);
router.get('/my/:id', authenticate, authorize('admin', 'club_admin', 'coach'), controller.getMyLesson);

// Admin-only soft-delete management (must come BEFORE /:id)
router.get('/deleted', authenticate, authorize('admin'), controller.listDeleted);
router.post('/:id/restore', authenticate, authorize('admin'), controller.restoreLesson);
router.delete('/:id/hard', authenticate, authorize('admin'), controller.hardDeleteLesson);

router.get('/', authenticate, authorize('admin', 'club_admin', 'coach'), controller.listLessons);
router.get('/:id', authenticate, authorize('admin', 'club_admin', 'coach'), controller.getById);

router.post('/', authenticate, authorize('admin', 'club_admin', 'coach'), controller.createLesson);
router.patch('/:id', authenticate, authorize('admin', 'club_admin', 'coach'), controller.updateLesson);
router.patch('/:id/status', authenticate, authorize('admin', 'club_admin', 'coach'), controller.setStatus);
router.patch('/:id/reorder', authenticate, authorize('admin'), controller.reorderLesson);
router.delete('/:id', authenticate, authorize('admin'), controller.deleteLesson);

router.post('/:id/progress', authenticate, controller.markProgress);

export default router;
