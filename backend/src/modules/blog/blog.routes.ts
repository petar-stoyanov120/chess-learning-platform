import { Router } from 'express';
import * as controller from './blog.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router: Router = Router();

// Public routes
router.get('/', controller.listPublished);

// Authenticated named routes (must come BEFORE /:slug to avoid conflict)
router.get('/admin/all', authenticate, authorize('admin'), controller.listAllAdmin);
router.get('/admin/:id', authenticate, authorize('admin'), controller.getAdminPost);
router.get('/my/list', authenticate, authorize('collaborator', 'admin'), controller.listMine);
router.get('/my/:id', authenticate, authorize('collaborator', 'admin'), controller.getMyPost);

// Dynamic slug route (must be last of the GETs)
router.get('/:slug', controller.getBySlug);

router.post('/', authenticate, authorize('collaborator', 'admin'), controller.createPost);
router.patch('/:id', authenticate, authorize('collaborator', 'admin'), controller.updatePost);
router.delete('/:id', authenticate, authorize('admin'), controller.deletePost);

router.patch('/:id/submit', authenticate, authorize('collaborator', 'admin'), controller.submitPost);
router.patch('/:id/approve', authenticate, authorize('admin'), controller.approvePost);
router.patch('/:id/reject', authenticate, authorize('admin'), controller.rejectPost);

export default router;
