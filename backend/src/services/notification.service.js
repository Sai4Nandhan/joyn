import { Notification } from '../models/Notification.js';
import { emitToUser } from '../sockets/room.socket.js';

export async function createNotification(userId, { type = 'info', title, content, link }) {
  const notif = await Notification.create({
    user: userId,
    type,
    title,
    content,
    link,
  });

  emitToUser(userId, 'notification:new', notif.toPublicJSON());
  return notif;
}

export async function listNotifications(userId, { page = 1, limit = 20 } = {}) {
  const skip = (Number(page) - 1) * Number(limit);
  const [notifications, total] = await Promise.all([
    Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Notification.countDocuments({ user: userId }),
  ]);

  return {
    notifications,
    total,
    page: Number(page),
    limit: Number(limit),
  };
}

export async function markAllAsRead(userId) {
  await Notification.updateMany({ user: userId, unread: true }, { $set: { unread: false } });
}

export async function markAsRead(userId, notificationId) {
  const notif = await Notification.findOne({ _id: notificationId, user: userId });
  if (notif) {
    notif.unread = false;
    await notif.save();
  }
  return notif;
}

export async function deleteNotification(userId, notificationId) {
  await Notification.deleteOne({ _id: notificationId, user: userId });
}
