import { Router } from 'express';
import * as controller from './uploads.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { uploadImage } from '../../middleware/upload';

const router: Router = Router();

router.post('/image', authenticate, authorize('collaborator', 'admin'), uploadImage, controller.uploadImage);

export default router;
