import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as adminService from '../services/admin.service.js';

export const getStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getStats();
  return ApiResponse(res, 200, stats);
});

export const listUsers = asyncHandler(async (req, res) => {
  const data = await adminService.listUsers(req.query);
  return ApiResponse(res, 200, data);
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await adminService.updateUser(req.user._id, req.params.id, req.body);
  return ApiResponse(res, 200, { user }, 'User updated');
});

export const deleteUser = asyncHandler(async (req, res) => {
  await adminService.deleteUser(req.user._id, req.params.id);
  return ApiResponse(res, 200, null, 'User removed');
});

export const listActivities = asyncHandler(async (req, res) => {
  const data = await adminService.listActivities(req.query);
  return ApiResponse(res, 200, data);
});

export const updateActivityStatus = asyncHandler(async (req, res) => {
  const activity = await adminService.updateActivityStatus(req.params.id, req.body.status);
  return ApiResponse(res, 200, { activity }, 'Activity updated');
});

export const deleteActivity = asyncHandler(async (req, res) => {
  await adminService.deleteActivity(req.params.id);
  return ApiResponse(res, 200, null, 'Activity removed');
});
