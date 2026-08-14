import { body, query } from 'express-validator';

export const listQueryValidator = [
  query('search').optional().trim().isLength({ max: 100 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

export const updateUserValidator = [
  body('isSuspended').optional().isBoolean().withMessage('isSuspended must be a boolean'),
  body('isIdentityVerified').optional().isBoolean().withMessage('isIdentityVerified must be a boolean'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role'),
];

export const updateActivityStatusValidator = [
  body('status').isIn(['draft', 'published', 'cancelled', 'completed']).withMessage('Invalid status'),
];
