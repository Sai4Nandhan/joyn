import { Router } from 'express';
import * as activityController from '../controllers/activity.controller.js';
import * as joinRequestController from '../controllers/joinRequest.controller.js';
import * as roomController from '../controllers/room.controller.js';
import * as ratingController from '../controllers/rating.controller.js';
import workspaceRoutes from './workspace.routes.js';
import { createActivityValidator } from '../validators/activity.validator.js';
import { createJoinRequestValidator } from '../validators/joinRequest.validator.js';
import { createRatingValidator } from '../validators/rating.validator.js';
import { discoverValidator } from '../validators/discover.validator.js';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware.js';

import * as userController from '../controllers/user.controller.js';

const router = Router();

// Require authentication for specific routes
router.get('/mine', requireAuth, activityController.listMyActivities);
router.get('/saved', requireAuth, userController.listSavedActivities);
router.post('/saved/:activityId', requireAuth, userController.saveActivity);
router.delete('/saved/:activityId', requireAuth, userController.unsaveActivity);

// Public/Optional auth routes
router.get('/discover', optionalAuth, discoverValidator, validate, activityController.discover);
router.get('/:id', optionalAuth, activityController.getActivity);

// Require authentication for remaining routes
router.use(requireAuth);

router.post('/', createActivityValidator, validate, activityController.createActivity);
router.patch('/:id/publish', activityController.publish);
router.patch('/:id/complete', activityController.complete);
router.patch('/:id/cancel', activityController.cancel);
router.delete('/:id', activityController.deleteActivity);

router.post('/:id/join-requests', createJoinRequestValidator, validate, joinRequestController.createForActivity);
router.get('/:id/join-requests', joinRequestController.listForActivity);

router.get('/:id/room/messages', roomController.getMessages);
router.get('/:id/room/members', roomController.getMembers);
router.get('/:id/room/mute', roomController.getMuteStatus);
router.post('/:id/room/mute', roomController.toggleMute);
router.post('/:id/room/voice', roomController.uploadVoiceMiddleware, roomController.uploadVoiceMessage);

router.use('/:id/workspace', workspaceRoutes);

router.post('/:id/ratings', createRatingValidator, validate, ratingController.create);
router.get('/:id/ratings/pending', ratingController.listPending);

export default router;
