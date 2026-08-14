import { api } from '../lib/axios.js';

export async function getMyProfile() {
  const { data } = await api.get('/users/me');
  return data.data.user;
}

export async function updateMyProfile(payload) {
  const { data } = await api.patch('/users/me', payload);
  return data.data.user;
}

export async function getUserProfile(id) {
  const { data } = await api.get(`/users/${id}`);
  return data.data.user;
}

export async function getSavedActivitiesRequest() {
  const { data } = await api.get('/users/me/saved');
  return data.data.activities;
}

export async function saveActivityRequest(activityId) {
  const { data } = await api.post(`/users/me/saved/${activityId}`);
  return data.data.user;
}

export async function unsaveActivityRequest(activityId) {
  const { data } = await api.delete(`/users/me/saved/${activityId}`);
  return data.data.user;
}
