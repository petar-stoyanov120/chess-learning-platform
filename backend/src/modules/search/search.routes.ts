import { Router } from 'express';
import * as controller from './search.controller';

const router: Router = Router();

router.get('/', controller.search);

export default router;
