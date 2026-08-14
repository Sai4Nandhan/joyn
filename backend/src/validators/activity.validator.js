import { body } from 'express-validator';
import { ACTIVITY_CATEGORIES } from '../models/Activity.js';

export const createActivityValidator = [
  body('title').trim().isLength({ min: 5, max: 120 }).withMessage('Title must be 5-120 characters'),
  body('description').trim().isLength({ min: 20, max: 3000 }).withMessage('Description must be at least 20 characters'),
  body('category').isIn(ACTIVITY_CATEGORIES).withMessage('Invalid category'),

  body('schedule.startAt')
    .isISO8601()
    .toDate()
    .withMessage('Valid start date required')
    .custom((startAt) => {
      if (new Date(startAt) <= new Date()) {
        throw new Error('Start time must be in the future');
      }
      return true;
    }),
  body('schedule.endAt')
    .isISO8601()
    .toDate()
    .withMessage('Valid end date required')
    .custom((endAt, { req }) => {
      if (req.body.schedule?.startAt && new Date(endAt) <= new Date(req.body.schedule.startAt)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),

  body('approxLocation.placeName').trim().notEmpty().withMessage('Approximate area name is required'),
  body('approxLocation.point.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('approxLocation coordinates must be [lng, lat]'),

  body('exactLocation.point.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('exactLocation coordinates must be [lng, lat]'),
  body('exactLocation.address').optional().trim(),
  body('exactLocation.meetingPoint').optional().trim(),
  body('exactLocation.mapUrl').optional().trim(),

  body('cost.isFree').optional().isBoolean(),
  body('cost.amount').optional().isNumeric(),

  body('capacity.max').isInt({ min: 1, max: 500 }).withMessage('Capacity must be between 1 and 500'),
  body('capacity.min').optional().isInt({ min: 1 }).withMessage('Minimum capacity must be at least 1'),
];
