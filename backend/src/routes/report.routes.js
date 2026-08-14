import { Router } from 'express';
import * as reportController from '../controllers/report.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createReportValidator,
  moderateReportValidator,
  listReportsQueryValidator,
} from '../validators/report.validator.js';

const router = Router();

router.use(requireAuth);

// Regular authenticated user endpoint
router.post('/', createReportValidator, validate, reportController.createReport);

// Admin-only endpoints
router.get('/admin', requireRole('admin'), listReportsQueryValidator, validate, reportController.listReports);
router.patch('/admin/:id', requireRole('admin'), moderateReportValidator, validate, reportController.moderateReport);

export default router;
