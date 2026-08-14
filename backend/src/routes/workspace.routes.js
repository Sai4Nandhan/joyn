import { Router } from 'express';
import * as expenseController from '../controllers/expense.controller.js';
import * as pollController from '../controllers/poll.controller.js';
import * as checklistController from '../controllers/checklist.controller.js';
import { createExpenseValidator } from '../validators/expense.validator.js';
import { createPollValidator, voteValidator } from '../validators/poll.validator.js';
import { createChecklistItemValidator, updateChecklistItemValidator } from '../validators/checklist.validator.js';
import { validate } from '../middleware/validate.middleware.js';

const router = Router({ mergeParams: true });

router.post('/expenses', createExpenseValidator, validate, expenseController.create);
router.get('/expenses', expenseController.list);
router.delete('/expenses/:expenseId', expenseController.remove);

router.post('/polls', createPollValidator, validate, pollController.create);
router.get('/polls', pollController.list);
router.post('/polls/:pollId/vote', voteValidator, validate, pollController.vote);
router.patch('/polls/:pollId/close', pollController.close);

router.post('/checklist', createChecklistItemValidator, validate, checklistController.create);
router.get('/checklist', checklistController.list);
router.patch('/checklist/:itemId', updateChecklistItemValidator, validate, checklistController.update);
router.delete('/checklist/:itemId', checklistController.remove);

export default router;
