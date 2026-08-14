import { body } from 'express-validator';

export const createJoinRequestValidator = [
  body('message').optional().trim().isLength({ max: 500 }).withMessage('Message must be under 500 characters'),
];
