import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as checklistService from '../services/checklist.service.js';

export const create = asyncHandler(async (req, res) => {
  const item = await checklistService.createItem(req.params.id, req.user._id, req.body);
  return ApiResponse(res, 201, { item: item.toPublicJSON() }, 'Item added');
});

export const list = asyncHandler(async (req, res) => {
  const items = await checklistService.listItems(req.params.id, req.user._id);
  return ApiResponse(res, 200, { items });
});

export const update = asyncHandler(async (req, res) => {
  const item = await checklistService.updateItem(req.params.id, req.params.itemId, req.user._id, req.body);
  return ApiResponse(res, 200, { item: item.toPublicJSON() }, 'Item updated');
});

export const remove = asyncHandler(async (req, res) => {
  await checklistService.deleteItem(req.params.id, req.params.itemId, req.user._id);
  return ApiResponse(res, 200, null, 'Item deleted');
});
