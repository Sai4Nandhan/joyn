import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as activityService from '../services/activity.service.js';

export const createActivity = asyncHandler(async (req, res) => {
  const activity = await activityService.createActivity(req.user._id, req.body);
  return ApiResponse(res, 201, { activity: activity.toPublicJSON(true) }, 'Activity created');
});

export const getActivity = asyncHandler(async (req, res) => {
  const activity = await activityService.getActivityById(req.params.id, req.user?._id);
  return ApiResponse(res, 200, { activity });
});

export const listMyActivities = asyncHandler(async (req, res) => {
  const activities = await activityService.listMyActivities(req.user._id);
  return ApiResponse(res, 200, { activities });
});

export const discover = asyncHandler(async (req, res) => {
  const currentUserId = req.user?._id || req.user?.id;
  const activities = await activityService.discoverActivities({
    ...req.query,
    currentUserId,
  });
  return ApiResponse(res, 200, { activities, page: Number(req.query.page) || 1 });
});

export const complete = asyncHandler(async (req, res) => {
  const noShowUserIds = req.body.noShowUserIds || [];
  const activity = await activityService.completeActivity(req.params.id, req.user._id, noShowUserIds);
  return ApiResponse(res, 200, { activity }, 'Activity marked as completed');
});

export const cancel = asyncHandler(async (req, res) => {
  const activity = await activityService.cancelActivity(req.params.id, req.user._id);
  return ApiResponse(res, 200, { activity }, 'Activity cancelled successfully');
});

export const publish = asyncHandler(async (req, res) => {
  const activity = await activityService.publishActivity(req.params.id, req.user._id);
  return ApiResponse(res, 200, { activity }, 'Activity published');
});

export const deleteActivity = asyncHandler(async (req, res) => {
  await activityService.deleteActivity(req.params.id, req.user._id);
  return ApiResponse(res, 200, {}, 'Activity deleted');
});
