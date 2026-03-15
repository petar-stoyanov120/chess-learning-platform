import { Router } from 'express';
import * as controller from './tags.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router: Router = Router();

router.get('/', controller.listTags);
router.post('/', authenticate, authorize('admin'), controller.createTag);
router.delete('/:id', authenticate, authorize('admin'), controller.deleteTag);

export default router;
