import { Router } from 'express';
import * as dmController from '../controllers/dm.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  sendMessageValidator,
  listMessagesValidator,
  markAsReadValidator,
} from '../validators/dm.validator.js';

const router = Router();

router.use(requireAuth);

router.post('/', sendMessageValidator, validate, dmController.sendMessage);
router.get('/conversations', dmController.listConversations);
router.get('/user/:recipientId', listMessagesValidator, validate, dmController.listMessages);
router.patch('/read/:senderId', markAsReadValidator, validate, dmController.markAsRead);

export default router;
