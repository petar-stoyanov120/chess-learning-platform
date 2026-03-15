import { Router } from 'express';
import * as controller from './admin.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router: Router = Router();

router.use(authenticate, authorize('admin'));

router.get('/pending', controller.getPending);
router.get('/stats', controller.getStats);

export default router;
