import { body } from 'express-validator';

export const registerValidator = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('Valid 6-digit verification OTP code is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain a number'),
];

export const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email or phone number is required')
    .custom((value) => {
      const raw = value.trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
      const isPhone = /^\+?[0-9]{10,15}$/.test(raw.replace(/[\s\-\(\)]/g, ''));
      if (!isEmail && !isPhone) {
        throw new Error('Please enter a valid email address or 10+ digit phone number');
      }
      return true;
    }),
  body('password').notEmpty().withMessage('Password is required'),
];

export const forgotPasswordValidator = [
  body('contact').trim().notEmpty().withMessage('Email or phone number is required'),
  body('method').optional().isIn(['email', 'phone']).withMessage('Method must be email or phone'),
];

export const verifyResetOtpValidator = [
  body('contact').trim().notEmpty().withMessage('Email or phone number is required'),
  body('otp').trim().isLength({ min: 6, max: 6 }).withMessage('Valid 6-digit verification code is required'),
  body('method').optional().isIn(['email', 'phone']).withMessage('Method must be email or phone'),
];

export const resetPasswordValidator = [
  body('resetToken').notEmpty().withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain a number'),
];
