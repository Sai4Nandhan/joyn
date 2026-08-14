import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { evaluateUserChallenges } from '../services/challenge.service.js';

export const getMyChallengeProgress = asyncHandler(async (req, res) => {
  const data = await evaluateUserChallenges(req.user._id);
  return ApiResponse(res, 200, data, 'Challenge progress fetched successfully');
});
