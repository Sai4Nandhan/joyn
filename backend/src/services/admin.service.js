import { User } from '../models/User.js';
import { Activity } from '../models/Activity.js';
import { JoinRequest } from '../models/JoinRequest.js';
import { ApiError } from '../utils/ApiError.js';
import { escapeRegex } from '../utils/sanitize.js';

export async function getStats() {
  const [totalUsers, suspendedUsers, totalActivities, publishedActivities, pendingJoinRequests] = await Promise.all([
    User.countDocuments({ isDeleted: { $ne: true } }),
    User.countDocuments({ isDeleted: { $ne: true }, isSuspended: true }),
    Activity.countDocuments({ isDeleted: { $ne: true } }),
    Activity.countDocuments({ isDeleted: { $ne: true }, status: 'published' }),
    JoinRequest.countDocuments({ status: 'pending' }),
  ]);

  return { totalUsers, suspendedUsers, totalActivities, publishedActivities, pendingJoinRequests };
}

export async function listUsers({ search, page = 1, limit = 20 }) {
  const filter = { isDeleted: { $ne: true } };
  if (search) {
    const safeSearch = escapeRegex(search);
    if (safeSearch) {
      filter.$or = [{ name: { $regex: safeSearch, $options: 'i' } }, { email: { $regex: safeSearch, $options: 'i' } }];
    }
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  return { users: users.map((u) => u.toSafeJSON()), total, page: Number(page), limit: Number(limit) };
}

export async function updateUser(adminId, targetId, { isSuspended, isIdentityVerified, role }) {
  if (adminId.toString() === targetId.toString() && (isSuspended !== undefined || role !== undefined)) {
    throw new ApiError(400, "You can't change your own suspension or role");
  }

  const user = await User.findOne({ _id: targetId, isDeleted: { $ne: true } });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (isSuspended !== undefined) {
    user.isSuspended = isSuspended;
    user.suspendedAt = isSuspended ? new Date() : null;
  }
  if (isIdentityVerified !== undefined) user.isIdentityVerified = isIdentityVerified;
  if (role !== undefined) user.role = role;

  await user.save();
  return user.toSafeJSON();
}

export async function deleteUser(adminId, targetId) {
  if (adminId.toString() === targetId.toString()) {
    throw new ApiError(400, "You can't delete your own account here");
  }

  const user = await User.findOne({ _id: targetId, isDeleted: { $ne: true } });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.isDeleted = true;
  await user.save();
}

export async function listActivities({ search, status, page = 1, limit = 20 }) {
  const filter = { isDeleted: { $ne: true } };
  if (status) filter.status = status;
  if (search) {
    const safeSearch = escapeRegex(search);
    if (safeSearch) {
      filter.title = { $regex: safeSearch, $options: 'i' };
    }
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [activities, total] = await Promise.all([
    Activity.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('host', 'name email trustScore'),
    Activity.countDocuments(filter),
  ]);

  return {
    activities: activities.map((a) => a.toPublicJSON(true)),
    total,
    page: Number(page),
    limit: Number(limit),
  };
}

export async function updateActivityStatus(activityId, status) {
  const activity = await Activity.findOne({ _id: activityId, isDeleted: { $ne: true } });
  if (!activity) {
    throw new ApiError(404, 'Activity not found');
  }
  activity.status = status;
  await activity.save();
  return activity.toPublicJSON(true);
}

export async function deleteActivity(activityId) {
  const activity = await Activity.findOne({ _id: activityId, isDeleted: { $ne: true } });
  if (!activity) {
    throw new ApiError(404, 'Activity not found');
  }
  activity.isDeleted = true;
  await activity.save();
}
