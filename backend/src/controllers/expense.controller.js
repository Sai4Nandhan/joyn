import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as expenseService from '../services/expense.service.js';

export const create = asyncHandler(async (req, res) => {
  const expense = await expenseService.createExpense(req.params.id, req.user._id, req.body);
  return ApiResponse(res, 201, { expense: expense.toPublicJSON() }, 'Expense added');
});

export const list = asyncHandler(async (req, res) => {
  const data = await expenseService.listExpenses(req.params.id, req.user._id);
  return ApiResponse(res, 200, data);
});

export const remove = asyncHandler(async (req, res) => {
  await expenseService.deleteExpense(req.params.id, req.params.expenseId, req.user._id);
  return ApiResponse(res, 200, null, 'Expense deleted');
});
