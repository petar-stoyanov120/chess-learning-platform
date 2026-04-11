import { Router } from 'express';
import * as controller from './lessons.controller';
import { authenticate, optionalAuthenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router: Router = Router();

// Public routes
router.get('/', controller.listPublished);
router.get('/category/:categorySlug/level/:levelName', controller.getByCategoryAndLevel);

// Authenticated named routes (must come BEFORE /:slug to avoid conflict)
router.get('/admin/all', authenticate, authorize('admin'), controller.listAllAdmin);
router.get('/admin/:id', authenticate, authorize('admin'), controller.getAdminLesson);
router.get('/my/list', authenticate, authorize('collaborator', 'admin', 'club_admin'), controller.listMine);
router.get('/my/progress', authenticate, controller.getProgress);
router.get('/my/:id', authenticate, authorize('collaborator', 'admin', 'club_admin'), controller.getMyLesson);

// Dynamic slug route (must be last of the GETs)
router.get('/:slug', controller.getBySlug);

router.post('/', authenticate, authorize('collaborator', 'admin', 'club_admin'), controller.createLesson);
router.patch('/:id', authenticate, authorize('collaborator', 'admin', 'club_admin'), controller.updateLesson);
router.delete('/:id', authenticate, authorize('admin'), controller.deleteLesson);

router.patch('/:id/submit', authenticate, authorize('collaborator', 'admin', 'club_admin'), controller.submitLesson);
router.patch('/:id/approve', authenticate, authorize('admin'), controller.approveLesson);
router.patch('/:id/reject', authenticate, authorize('admin'), controller.rejectLesson);
router.patch('/:id/reorder', authenticate, authorize('admin'), controller.reorderLesson);
router.post('/:slug/progress', authenticate, controller.markProgress);
router.get('/:slug/rating', optionalAuthenticate, controller.getLessonRating);
router.patch('/:slug/rating', authenticate, controller.rateLesson);

export default router;
