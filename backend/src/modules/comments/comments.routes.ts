import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as ctrl from './comments.controller';

const router: Router = Router();

router.get('/', ctrl.getComments);
router.post('/', authenticate, ctrl.createComment);
router.delete('/:id', authenticate, ctrl.deleteComment);

export default router;
