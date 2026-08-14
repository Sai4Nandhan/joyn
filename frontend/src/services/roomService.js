import { api } from '../lib/axios.js';

export async function getRoomMessages(activityId, before) {
  const { data } = await api.get(`/activities/${activityId}/room/messages`, {
    params: before ? { before } : undefined,
  });
  return data.data.messages;
}

export async function getRoomMembers(activityId) {
  const { data } = await api.get(`/activities/${activityId}/room/members`);
  return data.data;
}
