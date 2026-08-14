import { Activity } from '../models/Activity.js';
import { JoinRequest } from '../models/JoinRequest.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { recalculateTrustScore } from './trust.service.js';
import { createNotification } from './notification.service.js';

async function getActiveActivityOrThrow(activityId) {
  const activity = await Activity.findOne({ _id: activityId, isDeleted: { $ne: true } });
  if (!activity) {
    throw new ApiError(404, 'Activity not found');
  }
  return activity;
}

export async function createJoinRequest(activityId, requesterId, message) {
  const activity = await getActiveActivityOrThrow(activityId);

  if (activity.host.toString() === requesterId.toString()) {
    throw new ApiError(400, "You can't request to join your own activity");
  }

  if (activity.status !== 'published') {
    throw new ApiError(400, 'This activity is not open for join requests');
  }

  if (activity.schedule.startAt <= new Date()) {
    throw new ApiError(400, 'This activity has already started');
  }

  if (activity.participantsCount >= activity.capacity.max) {
    throw new ApiError(400, 'This activity is full');
  }

  try {
    const joinRequest = await JoinRequest.create({
      activity: activity._id,
      requester: requesterId,
      host: activity.host,
      message,
    });
    const requester = await User.findById(requesterId);
    await createNotification(activity.host, {
      type: 'info',
      title: 'New Join Request',
      content: `${requester?.name || 'A member'} has requested to join your activity "${activity.title}".`,
      link: `/activities/${activity._id}`,
    });
    return joinRequest;
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, 'You already have an active request for this activity');
    }
    throw err;
  }
}

export async function listRequestsForActivity(activityId, hostId) {
  const activity = await getActiveActivityOrThrow(activityId);

  if (activity.host.toString() !== hostId.toString()) {
    throw new ApiError(403, 'Only the host can view join requests for this activity');
  }

  const requests = await JoinRequest.find({ activity: activityId })
    .sort({ createdAt: -1 })
    .populate('requester', 'name avatarUrl trustScore isIdentityVerified stats');

  return requests;
}

export async function listMyRequests(requesterId) {
  const requests = await JoinRequest.find({ requester: requesterId })
    .sort({ createdAt: -1 })
    .populate('activity', 'title category schedule status coverImageUrl');

  return requests;
}

async function getOwnedPendingRequest(requestId, hostId) {
  const joinRequest = await JoinRequest.findById(requestId);
  if (!joinRequest) {
    throw new ApiError(404, 'Join request not found');
  }
  if (joinRequest.host.toString() !== hostId.toString()) {
    throw new ApiError(403, 'Only the host can respond to this request');
  }
  if (joinRequest.status !== 'pending') {
    throw new ApiError(400, 'This request has already been handled');
  }
  return joinRequest;
}

export async function approveJoinRequest(requestId, hostId) {
  const joinRequest = await getOwnedPendingRequest(requestId, hostId);

  // Atomic capacity check: only increments if there's still room, avoiding overbooking races.
  const activity = await Activity.findOneAndUpdate(
    { _id: joinRequest.activity, status: 'published', $expr: { $lt: ['$participantsCount', '$capacity.max'] } },
    { $inc: { participantsCount: 1 } },
    { new: true }
  );

  if (!activity) {
    throw new ApiError(400, 'This activity is full');
  }

  joinRequest.status = 'approved';
  joinRequest.respondedAt = new Date();
  await joinRequest.save();

  await createNotification(joinRequest.requester, {
    type: 'success',
    title: 'Join Request Approved!',
    content: `Your request to join "${activity.title}" has been approved. You now have access to the Activity Room and Trip Workspace.`,
    link: `/activities/${activity._id}/room`,
  });

  return joinRequest;
}

export async function rejectJoinRequest(requestId, hostId) {
  const joinRequest = await getOwnedPendingRequest(requestId, hostId);
  joinRequest.status = 'rejected';
  joinRequest.respondedAt = new Date();
  await joinRequest.save();

  const activity = await Activity.findById(joinRequest.activity);
  const title = activity ? activity.title : 'Activity';
  await createNotification(joinRequest.requester, {
    type: 'alert',
    title: 'Join Request Declined',
    content: `Your request to join "${title}" was declined by the host.`,
    link: `/activities/${joinRequest.activity}`,
  });

  return joinRequest;
}

export async function cancelJoinRequest(requestId, requesterId) {
  const joinRequest = await JoinRequest.findById(requestId);
  if (!joinRequest) {
    throw new ApiError(404, 'Join request not found');
  }
  if (joinRequest.requester.toString() !== requesterId.toString()) {
    throw new ApiError(403, 'You can only cancel your own requests');
  }
  if (!['pending', 'approved'].includes(joinRequest.status)) {
    throw new ApiError(400, 'This request can no longer be cancelled');
  }

  const wasApproved = joinRequest.status === 'approved';
  joinRequest.status = 'cancelled';
  joinRequest.respondedAt = new Date();
  await joinRequest.save();

  if (wasApproved) {
    await Activity.updateOne({ _id: joinRequest.activity }, { $inc: { participantsCount: -1 } });
    await User.updateOne({ _id: requesterId }, { $inc: { 'stats.cancellations': 1 } });
    await recalculateTrustScore(requesterId);
  }

  return joinRequest;
}

export async function hasApprovedAccess(activityId, userId) {
  if (!userId) return false;
  const exists = await JoinRequest.exists({
    activity: activityId,
    requester: userId,
    status: 'approved',
  });
  return Boolean(exists);
}

export async function listApprovedRequesterIds(activityId) {
  const requests = await JoinRequest.find({ activity: activityId, status: 'approved' }).select('requester');
  return requests.map((r) => r.requester.toString());
}
