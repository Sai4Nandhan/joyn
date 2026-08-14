import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as userService from '../services/user.service.js';
import { computeBadges } from '../services/badges.service.js';

export const getMyProfile = asyncHandler(async (req, res) => {
  const trustProfile = userService.calculateTrustStats(req.user);
  return ApiResponse(res, 200, { user: { ...req.user.toSafeJSON(), trustProfile } });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  return ApiResponse(res, 200, { user }, 'Profile updated');
});

export const getUserProfile = asyncHandler(async (req, res) => {
  const profile = await userService.getPublicProfile(req.params.id);
  return ApiResponse(res, 200, { user: profile });
});

export const saveActivity = asyncHandler(async (req, res) => {
  const user = await userService.saveActivity(req.user._id, req.params.activityId);
  return ApiResponse(res, 200, { user }, 'Activity bookmarked');
});

export const unsaveActivity = asyncHandler(async (req, res) => {
  const user = await userService.unsaveActivity(req.user._id, req.params.activityId);
  return ApiResponse(res, 200, { user }, 'Bookmark removed');
});

export const listSavedActivities = asyncHandler(async (req, res) => {
  const activities = await userService.listSavedActivities(req.user._id);
  return ApiResponse(res, 200, { activities });
});

export const listPublicUsers = asyncHandler(async (req, res) => {
  const users = await userService.listPublicUsers({
    search: req.query.search,
    excludeUserId: req.user._id,
  });
  return ApiResponse(res, 200, { users });
});
