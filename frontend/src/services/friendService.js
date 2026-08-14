import { api } from '../lib/axios.js';

export async function sendFriendRequestApi(recipientId) {
  const { data } = await api.post(`/friends/request/${recipientId}`);
  return data.data.request;
}

export async function acceptFriendRequestApi(requestId) {
  const { data } = await api.post(`/friends/accept/${requestId}`);
  return data.data.request;
}

export async function rejectFriendRequestApi(requestId) {
  const { data } = await api.post(`/friends/reject/${requestId}`);
  return data.data.request;
}

export async function listFriendRequestsApi() {
  const { data } = await api.get('/friends/requests');
  return data.data; // { incoming, outgoing }
}

export async function listFriendsApi() {
  const { data } = await api.get('/friends');
  return data.data.friends;
}

export async function removeFriendApi(friendId) {
  const { data } = await api.delete(`/friends/${friendId}`);
  return data;
}
