import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import * as friendController from '../controllers/friend.controller.js';

const router = Router();
router.use(requireAuth);

router.post('/request/:recipientId', friendController.sendRequest);
router.post('/accept/:requestId', friendController.acceptRequest);
router.post('/reject/:requestId', friendController.rejectRequest);
router.get('/requests', friendController.listRequests);
router.get('/', friendController.listFriends);
router.delete('/:friendId', friendController.removeFriend);

export default router;
