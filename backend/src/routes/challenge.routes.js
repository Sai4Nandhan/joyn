import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import * as challengeController from '../controllers/challenge.controller.js';

const router = Router();

router.get('/my-progress', requireAuth, challengeController.getMyChallengeProgress);

export default router;
