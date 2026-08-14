import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { updateProfileValidator } from '../validators/user.validator.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/me', userController.getMyProfile);
router.patch('/me', updateProfileValidator, validate, userController.updateMyProfile);
router.get('/me/saved', userController.listSavedActivities);
router.post('/me/saved/:activityId', userController.saveActivity);
router.delete('/me/saved/:activityId', userController.unsaveActivity);
router.get('/', userController.listPublicUsers);
router.get('/:id', userController.getUserProfile);

export default router;
