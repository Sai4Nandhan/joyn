import { FriendRequest } from '../models/FriendRequest.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { createNotification } from './notification.service.js';

export async function sendFriendRequest(senderId, recipientId) {
  if (senderId.toString() === recipientId.toString()) {
    throw new ApiError(400, "You cannot send a friend request to yourself");
  }

  const recipient = await User.findOne({ _id: recipientId, isDeleted: { $ne: true } });
  if (!recipient) {
    throw new ApiError(404, 'User not found');
  }

  // Check existing request
  const existing = await FriendRequest.findOne({
    $or: [
      { sender: senderId, recipient: recipientId },
      { sender: recipientId, recipient: senderId },
    ],
  });

  if (existing) {
    if (existing.status === 'accepted') {
      throw new ApiError(400, 'You are already connected as friends');
    }
    if (existing.status === 'pending') {
      if (existing.sender.toString() === senderId.toString()) {
        throw new ApiError(409, 'Friend request already sent');
      } else {
        // Automatically accept if reverse request exists
        existing.status = 'accepted';
        existing.respondedAt = new Date();
        await existing.save();

        await User.updateOne({ _id: senderId }, { $addToSet: { friends: recipientId } });
        await User.updateOne({ _id: recipientId }, { $addToSet: { friends: senderId } });

        const sender = await User.findById(senderId);
        await createNotification(senderId, {
          type: 'success',
          title: 'Friend Request Accepted',
          content: `You and ${recipient.name} are now friends!`,
        });
        await createNotification(recipientId, {
          type: 'success',
          title: 'Friend Request Accepted',
          content: `You and ${sender?.name || 'User'} are now friends!`,
        });

        return existing;
      }
    }
    // If rejected, allow re-sending by updating status
    existing.sender = senderId;
    existing.recipient = recipientId;
    existing.status = 'pending';
    existing.respondedAt = null;
    await existing.save();

    const sender = await User.findById(senderId);
    await createNotification(recipientId, {
      type: 'info',
      title: 'New Friend Request',
      content: `${sender?.name || 'A user'} sent you a friend request.`,
    });

    return existing;
  }

  const friendRequest = await FriendRequest.create({
    sender: senderId,
    recipient: recipientId,
    status: 'pending',
  });

  const sender = await User.findById(senderId);
  await createNotification(recipientId, {
    type: 'info',
    title: 'New Friend Request',
    content: `${sender?.name || 'A user'} sent you a friend request.`,
  });

  return friendRequest;
}

export async function acceptFriendRequest(userId, requestId) {
  const friendRequest = await FriendRequest.findById(requestId);
  if (!friendRequest) {
    throw new ApiError(404, 'Friend request not found');
  }

  if (friendRequest.recipient.toString() !== userId.toString()) {
    throw new ApiError(403, 'Only the recipient can accept this request');
  }

  if (friendRequest.status !== 'pending') {
    throw new ApiError(400, 'This request has already been processed');
  }

  friendRequest.status = 'accepted';
  friendRequest.respondedAt = new Date();
  await friendRequest.save();

  const senderId = friendRequest.sender;
  const recipientId = friendRequest.recipient;

  await User.updateOne({ _id: senderId }, { $addToSet: { friends: recipientId } });
  await User.updateOne({ _id: recipientId }, { $addToSet: { friends: senderId } });

  const recipient = await User.findById(recipientId);
  await createNotification(senderId, {
    type: 'success',
    title: 'Friend Request Accepted',
    content: `${recipient?.name || 'A user'} accepted your friend request!`,
  });

  return friendRequest;
}

export async function rejectFriendRequest(userId, requestId) {
  const friendRequest = await FriendRequest.findById(requestId);
  if (!friendRequest) {
    throw new ApiError(404, 'Friend request not found');
  }

  if (friendRequest.recipient.toString() !== userId.toString()) {
    throw new ApiError(403, 'Only the recipient can decline this request');
  }

  friendRequest.status = 'rejected';
  friendRequest.respondedAt = new Date();
  await friendRequest.save();

  return friendRequest;
}

export async function listFriendRequests(userId) {
  const [incoming, outgoing] = await Promise.all([
    FriendRequest.find({ recipient: userId, status: 'pending' })
      .sort({ createdAt: -1 })
      .populate('sender', 'name avatarUrl trustScore isIdentityVerified bio stats'),
    FriendRequest.find({ sender: userId, status: 'pending' })
      .sort({ createdAt: -1 })
      .populate('recipient', 'name avatarUrl trustScore isIdentityVerified bio stats'),
  ]);

  return { incoming, outgoing };
}

export async function listFriends(userId) {
  const acceptedRequests = await FriendRequest.find({
    $or: [{ sender: userId }, { recipient: userId }],
    status: 'accepted',
  })
    .populate('sender', 'name avatarUrl trustScore isIdentityVerified bio stats')
    .populate('recipient', 'name avatarUrl trustScore isIdentityVerified bio stats');

  const friends = acceptedRequests.map((req) => {
    const friendObj = req.sender._id.toString() === userId.toString() ? req.recipient : req.sender;
    return friendObj;
  }).filter(Boolean);

  return friends;
}

export async function removeFriend(userId, friendId) {
  await FriendRequest.deleteMany({
    $or: [
      { sender: userId, recipient: friendId },
      { sender: friendId, recipient: userId },
    ],
  });

  await User.updateOne({ _id: userId }, { $pull: { friends: friendId } });
  await User.updateOne({ _id: friendId }, { $pull: { friends: userId } });

  return { success: true };
}
