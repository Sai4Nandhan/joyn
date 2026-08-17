import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/auth.controller.js';
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  verifyResetOtpValidator,
  resetPasswordValidator,
} from '../validators/auth.validator.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

const isDev = process.env.NODE_ENV === 'development';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // In development: effectively unlimited so local testing isn't blocked.
  // In production: strict 20 attempts per 15 min window.
  max: isDev ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later' },
});

router.get('/debug-env-keys', authController.debugEnv);
router.post('/send-otp', authLimiter, authController.sendOtp);
router.post('/verify-otp', authLimiter, authController.verifyOtp);
router.post('/register', authLimiter, registerValidator, validate, authController.register);
router.post('/login', authLimiter, loginValidator, validate, authController.login);
router.post('/forgot-password', authLimiter, forgotPasswordValidator, validate, authController.forgotPassword);
router.post('/verify-reset-otp', authLimiter, verifyResetOtpValidator, validate, authController.verifyResetOtp);
router.post('/reset-password', authLimiter, resetPasswordValidator, validate, authController.resetPassword);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

export default router;
