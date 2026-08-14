import mongoose from 'mongoose';
import { Activity } from '../models/Activity.js';
import { JoinRequest } from '../models/JoinRequest.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { hasApprovedAccess } from './joinRequest.service.js';
import { createNotification } from './notification.service.js';
import { isUserInSocketRoom } from '../sockets/room.socket.js';

export async function assertRoomAccess(activityId, userId) {
  const activity = await Activity.findOne({ _id: activityId, isDeleted: { $ne: true } });
  if (!activity) {
    throw new ApiError(404, 'Activity not found');
  }

  const isHost = activity.host.toString() === userId.toString();
  if (!isHost && !(await hasApprovedAccess(activityId, userId))) {
    throw new ApiError(403, 'Only the host and approved participants can access this room');
  }

  return { activity, isHost };
}

export async function listMessages(activityId, userId, { before, limit = 50 } = {}) {
  await assertRoomAccess(activityId, userId);

  const query = { activity: activityId };
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 100))
    .populate('sender', 'name avatarUrl');

  return messages.reverse();
}

export async function listMembers(activityId, userId) {
  const { activity } = await assertRoomAccess(activityId, userId);

  const approved = await JoinRequest.find({ activity: activityId, status: 'approved' }).populate(
    'requester',
    'name avatarUrl trustScore'
  );

  await activity.populate('host', 'name avatarUrl trustScore');

  return {
    host: activity.host,
    members: approved.map((r) => r.requester),
  };
}

export async function toggleMuteRoom(userId, activityId) {
  await assertRoomAccess(activityId, userId);

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  const mutedSet = new Set((user.mutedRooms || []).map((id) => id.toString()));
  const isMuted = mutedSet.has(activityId.toString());

  if (isMuted) {
    await User.updateOne({ _id: userId }, { $pull: { mutedRooms: activityId } });
    return { isMuted: false };
  } else {
    await User.updateOne({ _id: userId }, { $addToSet: { mutedRooms: activityId } });
    return { isMuted: true };
  }
}

export async function getMuteStatus(userId, activityId) {
  const user = await User.findById(userId);
  if (!user) return { isMuted: false };

  const mutedSet = new Set((user.mutedRooms || []).map((id) => id.toString()));
  return { isMuted: mutedSet.has(activityId.toString()) };
}

/**
 * Creates message document and triggers intelligent notifications based on preference hierarchy:
 * Global Enabled -> Category Enabled (roomMessages) -> Room Muted -> Active Viewer Socket check.
 */
export async function createMessage(activityId, userId, { content, type = 'message', voiceUrl = null, duration = null, mimeType = null, fileSize = null }) {
  const { activity, isHost } = await assertRoomAccess(activityId, userId);

  if (activity.status === 'cancelled') {
    throw new ApiError(400, 'Cannot post messages in a cancelled activity');
  }

  if (type === 'announcement' && !isHost) {
    throw new ApiError(403, 'Only the host can post announcements');
  }

  const message = await Message.create({
    activity: activityId,
    sender: userId,
    type,
    content,
    voiceUrl,
    duration,
    mimeType,
    fileSize,
  });

  const senderUser = await User.findById(userId);
  const senderName = senderUser ? senderUser.name : 'A member';

  // Find all room members (Host + approved participants)
  const approvedRequests = await JoinRequest.find({ activity: activityId, status: 'approved' });
  const memberUserIds = new Set();

  if (activity.host.toString() !== userId.toString()) {
    memberUserIds.add(activity.host.toString());
  }

  approvedRequests.forEach((req) => {
    const reqId = req.requester.toString();
    if (reqId !== userId.toString()) {
      memberUserIds.add(reqId);
    }
  });

  const recipientIds = Array.from(memberUserIds);

  // Evaluate Notification Preference Hierarchy for each recipient
  if (recipientIds.length > 0) {
    const recipients = await User.find({ _id: { $in: recipientIds } });

    for (const recipient of recipients) {
      const recId = recipient._id.toString();
      const settings = recipient.settings || {};

      // 1. Check Global Notifications Enabled
      const globalEnabled = settings.notificationsEnabled !== false;
      if (!globalEnabled) continue;

      // 2. Check Category Enabled (roomMessages or announcements)
      const categoryKey = type === 'announcement' ? 'announcements' : 'roomMessages';
      const categoryEnabled = settings.notificationCategories?.[categoryKey] !== false;
      if (!categoryEnabled) continue;

      // 3. Check Room Muted
      const mutedSet = new Set((recipient.mutedRooms || []).map((id) => id.toString()));
      const isMuted = mutedSet.has(activityId.toString());
      if (isMuted) continue;

      // 4. Check if recipient is actively in socket room (don't spam active room viewers)
      const isViewingRoom = isUserInSocketRoom(recId, activityId.toString());
      if (isViewingRoom) continue;

      // Generate Persistent Notification
      const notifType = type === 'announcement' ? 'announcement' : 'info';
      const notifTitle = type === 'announcement' ? 'New Announcement' : type === 'voice' ? 'New Voice Message' : 'New Room Message';
      const notifContent = type === 'voice'
        ? `${senderName} sent a voice message in "${activity.title}".`
        : type === 'announcement'
        ? `${senderName} posted an announcement in "${activity.title}": "${content}"`
        : `${senderName}: "${content.length > 80 ? content.substring(0, 80) + '...' : content}" in "${activity.title}"`;

      await createNotification(recipient._id, {
        type: notifType,
        title: notifTitle,
        content: notifContent,
        link: `/activities/${activityId}/room`,
      });
    }
  }

  return Message.findById(message._id).populate('sender', 'name avatarUrl');
}
