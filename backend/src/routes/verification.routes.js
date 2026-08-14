import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { uploadVerificationFiles } from '../middleware/upload.middleware.js';
import * as verificationController from '../controllers/verification.controller.js';

const router = Router();

// Unauthenticated webhook route for identity verification provider callbacks
router.post('/webhook', verificationController.handleVerificationWebhook);

router.use(requireAuth);

router.get('/status', verificationController.getVerificationStatus);
router.post('/submit', uploadVerificationFiles, verificationController.submitVerification);

// Admin review endpoints
router.get('/admin/list', requireRole('admin'), verificationController.listPendingVerifications);
router.post('/admin/review/:userId', requireRole('admin'), verificationController.adminReviewVerification);

export default router;


