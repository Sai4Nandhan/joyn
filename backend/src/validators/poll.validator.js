import { body } from 'express-validator';

export const createPollValidator = [
  body('question').trim().isLength({ min: 3, max: 200 }).withMessage('Question must be 3-200 characters'),
  body('options').isArray({ min: 2, max: 10 }).withMessage('A poll needs 2-10 options'),
  body('options.*').trim().isLength({ min: 1, max: 120 }).withMessage('Each option must be 1-120 characters'),
  body('allowMultiple').optional().isBoolean().withMessage('allowMultiple must be a boolean'),
  body('closesAt').optional().isISO8601().withMessage('Invalid closesAt date'),
];

export const voteValidator = [
  body('optionIds').isArray({ min: 1 }).withMessage('Select at least one option'),
  body('optionIds.*').isMongoId().withMessage('Invalid option id'),
];
