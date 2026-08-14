import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as friendService from '../services/friend.service.js';

export const sendRequest = asyncHandler(async (req, res) => {
  const request = await friendService.sendFriendRequest(req.user._id, req.params.recipientId);
  return ApiResponse(res, 201, { request }, 'Friend request sent');
});

export const acceptRequest = asyncHandler(async (req, res) => {
  const request = await friendService.acceptFriendRequest(req.user._id, req.params.requestId);
  return ApiResponse(res, 200, { request }, 'Friend request accepted');
});

export const rejectRequest = asyncHandler(async (req, res) => {
  const request = await friendService.rejectFriendRequest(req.user._id, req.params.requestId);
  return ApiResponse(res, 200, { request }, 'Friend request declined');
});

export const listRequests = asyncHandler(async (req, res) => {
  const data = await friendService.listFriendRequests(req.user._id);
  return ApiResponse(res, 200, data);
});

export const listFriends = asyncHandler(async (req, res) => {
  const friends = await friendService.listFriends(req.user._id);
  return ApiResponse(res, 200, { friends });
});

export const removeFriend = asyncHandler(async (req, res) => {
  await friendService.removeFriend(req.user._id, req.params.friendId);
  return ApiResponse(res, 200, null, 'Friend removed');
});
