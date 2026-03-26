import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as controller from './bookmarks.controller';

const router: Router = Router();

router.use(authenticate);

router.get('/', controller.listBookmarks);
router.get('/check', controller.checkBookmarks);
router.post('/', controller.addBookmark);
router.delete('/:lessonId', controller.removeBookmark);

export default router;
