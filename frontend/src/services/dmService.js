import { api } from '../lib/axios.js';

export const sendDirectMessageRequest = (recipientId, content) =>
  api.post('/dms', { recipientId, content }).then((r) => r.data.data.message);

export const listDirectConversationsRequest = () =>
  api.get('/dms/conversations').then((r) => r.data.data.conversations);

export const listDirectMessagesRequest = (recipientId) =>
  api.get(`/dms/user/${recipientId}`).then((r) => r.data.data.messages);

export const markDirectMessagesReadRequest = (senderId) =>
  api.patch(`/dms/read/${senderId}`).then((r) => r.data.data);
