import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as ratingService from '../services/rating.service.js';

export const create = asyncHandler(async (req, res) => {
  const rating = await ratingService.createRating(req.params.id, req.user._id, req.body);
  return ApiResponse(res, 201, { rating: rating.toPublicJSON() }, 'Rating submitted');
});

export const listPending = asyncHandler(async (req, res) => {
  const users = await ratingService.listPendingRatings(req.params.id, req.user._id);
  return ApiResponse(res, 200, { users });
});
