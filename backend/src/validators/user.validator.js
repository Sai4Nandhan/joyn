import { body } from 'express-validator';

export const updateProfileValidator = [
  body('name').optional().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio must be under 500 characters'),
  body('avatarUrl')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (value === null || value === '') return true;
      if (value.startsWith('data:image/')) return true;
      if (value.startsWith('/')) return true;
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error('Avatar must be a valid URL or image path');
      }
    }),
  body('hasCompletedOnboarding').optional().isBoolean().withMessage('hasCompletedOnboarding must be a boolean'),
  body('settings').optional().isObject().withMessage('Settings must be an object'),
  body('settings.emailNotify').optional().isBoolean().withMessage('emailNotify must be a boolean'),
  body('settings.pushNotify').optional().isBoolean().withMessage('pushNotify must be a boolean'),
  body('settings.profilePrivate').optional().isBoolean().withMessage('profilePrivate must be a boolean'),
  body('settings.showLocation').optional().isBoolean().withMessage('showLocation must be a boolean'),
];
