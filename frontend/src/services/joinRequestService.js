import { api } from '../lib/axios.js';

export async function createJoinRequest(activityId, message) {
  const { data } = await api.post(`/activities/${activityId}/join-requests`, { message });
  return data.data.joinRequest;
}

export async function getRequestsForActivity(activityId) {
  const { data } = await api.get(`/activities/${activityId}/join-requests`);
  return data.data.joinRequests;
}

export async function getMyRequests() {
  const { data } = await api.get('/join-requests/mine');
  return data.data.joinRequests;
}

export async function approveRequest(requestId) {
  const { data } = await api.patch(`/join-requests/${requestId}/approve`);
  return data.data.joinRequest;
}

export async function rejectRequest(requestId) {
  const { data } = await api.patch(`/join-requests/${requestId}/reject`);
  return data.data.joinRequest;
}

export async function cancelRequest(requestId) {
  const { data } = await api.delete(`/join-requests/${requestId}`);
  return data.data.joinRequest;
}
