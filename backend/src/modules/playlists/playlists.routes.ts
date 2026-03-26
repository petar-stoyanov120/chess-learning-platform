import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import * as controller from './playlists.controller';

const router: Router = Router();

router.use(authenticate);

router.get('/', controller.listPlaylists);
router.post('/', controller.createPlaylist);
router.get('/:id', controller.getPlaylist);
router.patch('/:id', controller.updatePlaylist);
router.delete('/:id', controller.deletePlaylist);
router.post('/:id/lessons', controller.addLesson);
router.delete('/:id/lessons/:lessonId', controller.removeLesson);

export default router;
