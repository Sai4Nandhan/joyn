import { body } from 'express-validator';

export const createChecklistItemValidator = [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required'),
  body('assignedTo').optional().isMongoId().withMessage('Invalid assignedTo user'),
];

export const updateChecklistItemValidator = [
  body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
  body('isDone').optional().isBoolean().withMessage('isDone must be a boolean'),
  body('assignedTo').optional({ nullable: true }).isMongoId().withMessage('Invalid assignedTo user'),
];
