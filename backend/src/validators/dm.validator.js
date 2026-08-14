import { body, param } from 'express-validator';

export const sendMessageValidator = [
  body('recipientId').isMongoId().withMessage('Invalid recipient ID'),
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be between 1 and 2000 characters'),
];

export const listMessagesValidator = [
  param('recipientId').isMongoId().withMessage('Invalid recipient ID'),
];

export const markAsReadValidator = [
  param('senderId').isMongoId().withMessage('Invalid sender ID'),
];
