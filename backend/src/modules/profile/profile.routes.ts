import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { uploadAvatar as uploadAvatarMiddleware } from '../../middleware/upload';
import * as controller from './profile.controller';

const router: Router = Router();

router.use(authenticate);

router.get('/daily-limit', controller.getDailyLimit);
router.patch('/', controller.updateProfile);
router.post('/avatar', uploadAvatarMiddleware, controller.uploadAvatar);
router.delete('/avatar', controller.removeAvatar);

export default router;
