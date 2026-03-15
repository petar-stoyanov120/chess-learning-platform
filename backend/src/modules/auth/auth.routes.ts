import { Router } from 'express';
import * as controller from './auth.controller';
import { authenticate } from '../../middleware/authenticate';

const router: Router = Router();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/refresh', controller.refreshToken);
router.post('/logout', controller.logout);
router.patch('/password', authenticate, controller.changePassword);
router.get('/me', authenticate, controller.me);

export default router;
