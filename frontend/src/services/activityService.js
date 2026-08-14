import { api } from '../lib/axios.js';

export const CATEGORY_OPTIONS = [
  { value: 'trips', label: 'Trips' },
  { value: 'sports', label: 'Sports' },
  { value: 'social', label: 'Social' },
  { value: 'travel', label: 'Travel' },
  { value: 'photography', label: 'Photography' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'study_groups', label: 'Study Groups' },
  { value: 'events', label: 'Events' },
  { value: 'trekking', label: 'Trekking' },
];

export async function discoverActivitiesRequest(params) {
  const { data } = await api.get('/activities/discover', { params });
  return data.data.activities;
}

export async function createActivityRequest(payload) {
  const { data } = await api.post('/activities', payload);
  return data.data.activity;
}

export async function getMyActivitiesRequest() {
  const { data } = await api.get('/activities/mine');
  return data.data.activities;
}

export async function getActivityRequest(id) {
  const { data } = await api.get(`/activities/${id}`);
  return data.data.activity;
}

export async function cancelActivityRequest(id) {
  const { data } = await api.patch(`/activities/${id}/cancel`);
  return data.data.activity;
}
