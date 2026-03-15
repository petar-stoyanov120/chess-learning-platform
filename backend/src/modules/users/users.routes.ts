import { Router } from 'express';
import * as controller from './users.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router: Router = Router();

router.use(authenticate, authorize('admin'));

router.get('/', controller.listUsers);
router.get('/:id', controller.getUser);
router.patch('/:id/role', controller.updateRole);
router.patch('/:id/status', controller.updateStatus);
router.patch('/:id/unlock', controller.unlockUser);
router.delete('/:id', controller.deleteUser);

export default router;
