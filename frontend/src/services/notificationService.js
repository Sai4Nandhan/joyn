import { api } from '../lib/axios.js';

export const listNotificationsRequest = () =>
  api.get('/notifications').then((r) => r.data.data);

export const markAllNotificationsReadRequest = () =>
  api.post('/notifications/read-all').then((r) => r.data.data);

export const markNotificationReadRequest = (id) =>
  api.patch(`/notifications/${id}/read`).then((r) => r.data.data.notification);

export const deleteNotificationRequest = (id) =>
  api.delete(`/notifications/${id}`).then((r) => r.data.data);
