import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as notificationService from '../services/notification.service.js';

export const list = asyncHandler(async (req, res) => {
  const data = await notificationService.listNotifications(req.user._id, req.query);
  return ApiResponse(res, 200, data);
});

export const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user._id);
  return ApiResponse(res, 200, null, 'All notifications marked as read');
});

export const markRead = asyncHandler(async (req, res) => {
  const notif = await notificationService.markAsRead(req.user._id, req.params.id);
  return ApiResponse(res, 200, { notification: notif }, 'Notification marked as read');
});

export const remove = asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.user._id, req.params.id);
  return ApiResponse(res, 200, null, 'Notification deleted');
});
