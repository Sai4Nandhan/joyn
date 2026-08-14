import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as pollService from '../services/poll.service.js';

export const create = asyncHandler(async (req, res) => {
  const poll = await pollService.createPoll(req.params.id, req.user._id, req.body);
  return ApiResponse(res, 201, { poll: poll.toPublicJSON(req.user._id) }, 'Poll created');
});

export const list = asyncHandler(async (req, res) => {
  const data = await pollService.listPolls(req.params.id, req.user._id);
  return ApiResponse(res, 200, data);
});

export const vote = asyncHandler(async (req, res) => {
  const poll = await pollService.voteOnPoll(req.params.id, req.params.pollId, req.user._id, req.body.optionIds);
  return ApiResponse(res, 200, { poll }, 'Vote recorded');
});

export const close = asyncHandler(async (req, res) => {
  const poll = await pollService.closePoll(req.params.id, req.params.pollId, req.user._id);
  return ApiResponse(res, 200, { poll }, 'Poll closed');
});
