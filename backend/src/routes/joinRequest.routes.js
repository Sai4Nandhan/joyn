import { Router } from 'express';
import * as joinRequestController from '../controllers/joinRequest.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/mine', joinRequestController.listMine);
router.patch('/:id/approve', joinRequestController.approve);
router.patch('/:id/reject', joinRequestController.reject);
router.delete('/:id', joinRequestController.cancel);

export default router;
