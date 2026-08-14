import { body, query } from 'express-validator';

export const createReportValidator = [
  body('targetType')
    .isIn(['activity', 'user'])
    .withMessage('targetType must be either activity or user'),
  body('targetUser')
    .isMongoId()
    .withMessage('targetUser must be a valid Mongo ID'),
  body('targetActivity')
    .optional()
    .isMongoId()
    .withMessage('targetActivity must be a valid Mongo ID'),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('reason is required')
    .isLength({ max: 100 })
    .withMessage('reason must be under 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('description must be under 1000 characters'),
];

export const moderateReportValidator = [
  body('action')
    .isIn(['resolve', 'dismiss'])
    .withMessage('action must be either resolve or dismiss'),
  body('actionTaken')
    .optional()
    .isIn(['none', 'warned', 'suspended', 'activity_deleted'])
    .withMessage('Invalid actionTaken'),
];

export const listReportsQueryValidator = [
  query('status')
    .optional()
    .isIn(['pending', 'resolved', 'dismissed'])
    .withMessage('Invalid status filter'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100'),
];
