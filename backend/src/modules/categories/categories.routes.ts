import { Router } from 'express';
import * as controller from './categories.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router: Router = Router();

router.get('/', controller.listCategories);
router.get('/difficulty-levels', controller.listDifficultyLevels);
router.post('/difficulty-levels', authenticate, authorize('admin'), controller.createDifficultyLevel);
router.patch('/difficulty-levels/:id', authenticate, authorize('admin'), controller.updateDifficultyLevel);
router.delete('/difficulty-levels/:id', authenticate, authorize('admin'), controller.deleteDifficultyLevel);
router.get('/:slug', controller.getCategory);
router.post('/', authenticate, authorize('admin'), controller.createCategory);
router.patch('/:id', authenticate, authorize('admin'), controller.updateCategory);
router.delete('/:id', authenticate, authorize('admin'), controller.deleteCategory);

export default router;
