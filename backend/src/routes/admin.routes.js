import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { listQueryValidator, updateUserValidator, updateActivityStatusValidator } from '../validators/admin.validator.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/stats', adminController.getStats);

router.get('/users', listQueryValidator, validate, adminController.listUsers);
router.patch('/users/:id', updateUserValidator, validate, adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

router.get('/activities', listQueryValidator, validate, adminController.listActivities);
router.patch('/activities/:id/status', updateActivityStatusValidator, validate, adminController.updateActivityStatus);
router.delete('/activities/:id', adminController.deleteActivity);

export default router;
