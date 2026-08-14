import { body } from 'express-validator';

export const createRatingValidator = [
  body('rateeId').isMongoId().withMessage('Invalid user to rate'),
  body('stars').isInt({ min: 1, max: 5 }).withMessage('Stars must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 500 }).withMessage('Comment must be under 500 characters'),
  body('behavioralFeedback').optional().isObject().withMessage('behavioralFeedback must be an object'),
  body('behavioralFeedback.reliable').optional().isBoolean(),
  body('behavioralFeedback.onTime').optional().isBoolean(),
  body('behavioralFeedback.respectful').optional().isBoolean(),
  body('behavioralFeedback.goodCommunication').optional().isBoolean(),
  body('behavioralFeedback.matchedExpectations').optional().isBoolean(),
];
