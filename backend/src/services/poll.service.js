import { Poll } from '../models/Poll.js';
import { ApiError } from '../utils/ApiError.js';
import { assertRoomAccess } from './room.service.js';

export async function createPoll(activityId, userId, { question, options, allowMultiple, closesAt }) {
  const { activity } = await assertRoomAccess(activityId, userId);
  if (activity.status === 'cancelled') {
    throw new ApiError(400, 'Cannot create polls for a cancelled activity');
  }

  const poll = await Poll.create({
    activity: activityId,
    question,
    options: options.map((text) => ({ text, votes: [] })),
    allowMultiple: Boolean(allowMultiple),
    closesAt: closesAt || null,
    createdBy: userId,
  });

  return poll;
}

export async function listPolls(activityId, userId) {
  const { isHost } = await assertRoomAccess(activityId, userId);
  const polls = await Poll.find({ activity: activityId }).sort({ createdAt: -1 });
  return {
    polls: polls.map((p) => p.toPublicJSON(userId)),
    isHost,
  };
}

function isPollOpen(poll) {
  if (poll.isClosed) return false;
  if (poll.closesAt && poll.closesAt < new Date()) return false;
  return true;
}

export async function voteOnPoll(activityId, pollId, userId, optionIds) {
  await assertRoomAccess(activityId, userId);

  const poll = await Poll.findOne({ _id: pollId, activity: activityId });
  if (!poll) {
    throw new ApiError(404, 'Poll not found');
  }
  if (!isPollOpen(poll)) {
    throw new ApiError(400, 'This poll is closed');
  }
  if (!poll.allowMultiple && optionIds.length > 1) {
    throw new ApiError(400, 'This poll only allows one choice');
  }

  const validIds = new Set(poll.options.map((o) => o._id.toString()));
  for (const id of optionIds) {
    if (!validIds.has(id)) throw new ApiError(400, 'Invalid option selected');
  }

  // Replace the viewer's previous vote(s) with the new selection.
  for (const option of poll.options) {
    option.votes = option.votes.filter((v) => v.toString() !== userId.toString());
    if (optionIds.includes(option._id.toString())) {
      option.votes.push(userId);
    }
  }

  await poll.save();
  return poll.toPublicJSON(userId);
}

export async function closePoll(activityId, pollId, userId) {
  const { isHost } = await assertRoomAccess(activityId, userId);

  const poll = await Poll.findOne({ _id: pollId, activity: activityId });
  if (!poll) {
    throw new ApiError(404, 'Poll not found');
  }
  if (!isHost && poll.createdBy.toString() !== userId.toString()) {
    throw new ApiError(403, 'Only the host or the poll creator can close it');
  }

  poll.isClosed = true;
  await poll.save();
  return poll.toPublicJSON(userId);
}
