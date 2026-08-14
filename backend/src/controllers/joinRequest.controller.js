import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as joinRequestService from '../services/joinRequest.service.js';

export const createForActivity = asyncHandler(async (req, res) => {
  const joinRequest = await joinRequestService.createJoinRequest(
    req.params.id,
    req.user._id,
    req.body.message
  );
  return ApiResponse(res, 201, { joinRequest: joinRequest.toPublicJSON() }, 'Join request sent');
});

export const listForActivity = asyncHandler(async (req, res) => {
  const requests = await joinRequestService.listRequestsForActivity(req.params.id, req.user._id);
  return ApiResponse(res, 200, {
    joinRequests: requests.map((r) => ({ ...r.toPublicJSON(), requester: r.requester })),
  });
});

export const listMine = asyncHandler(async (req, res) => {
  const requests = await joinRequestService.listMyRequests(req.user._id);
  return ApiResponse(res, 200, {
    joinRequests: requests.map((r) => ({ ...r.toPublicJSON(), activity: r.activity })),
  });
});

export const approve = asyncHandler(async (req, res) => {
  const joinRequest = await joinRequestService.approveJoinRequest(req.params.id, req.user._id);
  return ApiResponse(res, 200, { joinRequest: joinRequest.toPublicJSON() }, 'Request approved');
});

export const reject = asyncHandler(async (req, res) => {
  const joinRequest = await joinRequestService.rejectJoinRequest(req.params.id, req.user._id);
  return ApiResponse(res, 200, { joinRequest: joinRequest.toPublicJSON() }, 'Request rejected');
});

export const cancel = asyncHandler(async (req, res) => {
  const joinRequest = await joinRequestService.cancelJoinRequest(req.params.id, req.user._id);
  return ApiResponse(res, 200, { joinRequest: joinRequest.toPublicJSON() }, 'Request cancelled');
});
