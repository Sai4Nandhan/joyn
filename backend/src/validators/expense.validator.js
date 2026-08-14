import { body } from 'express-validator';

export const createExpenseValidator = [
  body('description').trim().isLength({ min: 1, max: 200 }).withMessage('Description is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter code'),
  body('paidBy').optional().isMongoId().withMessage('Invalid paidBy user'),
  body('splitBetween').optional().isArray().withMessage('splitBetween must be an array of user ids'),
  body('splitBetween.*').optional().isMongoId().withMessage('Invalid user id in splitBetween'),
];
