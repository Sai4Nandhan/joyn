import { Rating } from '../models/Rating.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { assertRoomAccess, listMembers } from './room.service.js';
import { recalculateTrustScore } from './trust.service.js';
import { evaluateUserChallenges } from './challenge.service.js';

async function getAttendeeIds(activityId, userId) {
  const { activity } = await assertRoomAccess(activityId, userId);
  const { host, members } = await listMembers(activityId, userId);
  return { activity, attendeeIds: [host._id.toString(), ...members.map((m) => m._id.toString())] };
}

export async function createRating(activityId, raterId, { rateeId, stars, comment, behavioralFeedback }) {
  const { activity, attendeeIds } = await getAttendeeIds(activityId, raterId);

  if (activity.status !== 'completed') {
    throw new ApiError(400, 'You can only rate people after the activity is completed');
  }
  if (raterId.toString() === rateeId.toString()) {
    throw new ApiError(400, "You can't rate yourself");
  }
  if (!attendeeIds.includes(rateeId.toString())) {
    throw new ApiError(400, 'That person was not part of this activity');
  }

  const feedback = {
    reliable: behavioralFeedback?.reliable ?? true,
    onTime: behavioralFeedback?.onTime ?? true,
    respectful: behavioralFeedback?.respectful ?? true,
    goodCommunication: behavioralFeedback?.goodCommunication ?? true,
    matchedExpectations: behavioralFeedback?.matchedExpectations ?? true,
  };

  let rating;
  try {
    rating = await Rating.create({
      activity: activityId,
      rater: raterId,
      ratee: rateeId,
      stars,
      comment,
      behavioralFeedback: feedback,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, "You've already rated this person for this activity");
    }
    throw err;
  }

  const incUpdate = {
    'stats.ratingSum': stars,
    'stats.ratingCount': 1,
  };

  if (feedback.reliable) incUpdate['stats.reliableSum'] = 1;
  if (feedback.onTime) incUpdate['stats.onTimeSum'] = 1;
  if (feedback.respectful) incUpdate['stats.respectfulSum'] = 1;
  if (feedback.goodCommunication) incUpdate['stats.goodCommunicationSum'] = 1;
  if (feedback.matchedExpectations) incUpdate['stats.matchedExpectationsSum'] = 1;

  await User.updateOne({ _id: rateeId }, { $inc: incUpdate });
  await recalculateTrustScore(rateeId);
  await evaluateUserChallenges(rateeId);
  await evaluateUserChallenges(raterId);

  return rating;
}

// Attendees the viewer still hasn't rated for a completed activity.
export async function listPendingRatings(activityId, userId) {
  const { activity, attendeeIds } = await getAttendeeIds(activityId, userId);
  if (activity.status !== 'completed') return [];

  const alreadyRated = await Rating.find({ activity: activityId, rater: userId }).distinct('ratee');
  const ratedSet = new Set(alreadyRated.map(String));

  const pendingIds = attendeeIds.filter((id) => id !== userId.toString() && !ratedSet.has(id));
  return User.find({ _id: { $in: pendingIds } }).select('name avatarUrl');
}

export async function listRatingsReceived(userId) {
  const ratings = await Rating.find({ ratee: userId })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('rater', 'name avatarUrl')
    .populate('activity', 'title');

  return ratings;
}

export async function voidRating(ratingId) {
  const rating = await Rating.findById(ratingId);
  if (!rating) {
    throw new ApiError(404, 'Rating not found');
  }

  const decUpdate = {
    'stats.ratingSum': -rating.stars,
    'stats.ratingCount': -1,
  };
  if (rating.behavioralFeedback?.reliable) decUpdate['stats.reliableSum'] = -1;
  if (rating.behavioralFeedback?.onTime) decUpdate['stats.onTimeSum'] = -1;
  if (rating.behavioralFeedback?.respectful) decUpdate['stats.respectfulSum'] = -1;
  if (rating.behavioralFeedback?.goodCommunication) decUpdate['stats.goodCommunicationSum'] = -1;
  if (rating.behavioralFeedback?.matchedExpectations) decUpdate['stats.matchedExpectationsSum'] = -1;

  await User.updateOne({ _id: rating.ratee }, { $inc: decUpdate });
  await Rating.findByIdAndDelete(ratingId);
  await recalculateTrustScore(rating.ratee);

  return { message: 'Rating voided successfully' };
}
