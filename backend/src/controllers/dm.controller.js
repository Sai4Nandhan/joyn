import { DirectMessage } from '../models/DirectMessage.js';
import { User } from '../models/User.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { emitToUser } from '../sockets/room.socket.js';

export const sendMessage = asyncHandler(async (req, res) => {
  const { recipientId, content } = req.body;
  const senderId = req.user._id;

  if (senderId.toString() === recipientId.toString()) {
    throw new ApiError(400, "You cannot send messages to yourself");
  }

  const recipient = await User.findOne({ _id: recipientId, isDeleted: { $ne: true } });
  if (!recipient) {
    throw new ApiError(404, "Recipient not found");
  }

  const message = await DirectMessage.create({
    sender: senderId,
    recipient: recipientId,
    content,
  });

  const populated = await DirectMessage.findById(message._id)
    .populate('sender', 'name avatarUrl trustScore')
    .populate('recipient', 'name avatarUrl trustScore');

  const messageJSON = populated.toPublicJSON();
  emitToUser(recipientId, 'dm:new', messageJSON);

  return ApiResponse(res, 201, { message: messageJSON }, 'Message sent');
});

export const listMessages = asyncHandler(async (req, res) => {
  const senderId = req.user._id;
  const { recipientId } = req.params;

  const messages = await DirectMessage.find({
    $or: [
      { sender: senderId, recipient: recipientId },
      { sender: recipientId, recipient: senderId },
    ],
  })
    .sort({ createdAt: 1 })
    .populate('sender', 'name avatarUrl')
    .populate('recipient', 'name avatarUrl');

  return ApiResponse(res, 200, { messages: messages.map((m) => m.toPublicJSON()) });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { senderId } = req.params;

  await DirectMessage.updateMany(
    { sender: senderId, recipient: userId, isRead: false },
    { $set: { isRead: true } }
  );

  return ApiResponse(res, 200, null, 'Messages marked as read');
});

export const listConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const messages = await DirectMessage.find({
    $or: [{ sender: userId }, { recipient: userId }],
  })
    .sort({ createdAt: -1 })
    .populate('sender', 'name avatarUrl trustScore isIdentityVerified')
    .populate('recipient', 'name avatarUrl trustScore isIdentityVerified');

  const conversationsMap = new Map();

  for (const msg of messages) {
    if (!msg.sender || !msg.recipient) continue;
    
    const peer = msg.sender._id.toString() === userId.toString() ? msg.recipient : msg.sender;
    const peerId = peer._id.toString();

    if (!conversationsMap.has(peerId)) {
      conversationsMap.set(peerId, {
        id: peerId,
        name: peer.name,
        avatar: peer.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(peer.name)}`,
        trustScore: peer.trustScore,
        isIdentityVerified: peer.isIdentityVerified,
        lastMessage: msg.content,
        time: msg.createdAt,
        unread: !msg.isRead && msg.recipient._id.toString() === userId.toString(),
        unreadCount: !msg.isRead && msg.recipient._id.toString() === userId.toString() ? 1 : 0,
      });
    } else {
      if (!msg.isRead && msg.recipient._id.toString() === userId.toString()) {
        const conv = conversationsMap.get(peerId);
        conv.unreadCount += 1;
        conv.unread = true;
      }
    }
  }

  const conversations = Array.from(conversationsMap.values());
  return ApiResponse(res, 200, { conversations });
});
