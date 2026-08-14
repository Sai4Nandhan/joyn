import { api } from '../lib/axios.js';

export const completeActivity = (activityId, noShowUserIds = []) =>
  api.patch(`/activities/${activityId}/complete`, { noShowUserIds }).then((r) => r.data.data.activity);

export const listPendingRatings = (activityId) =>
  api.get(`/activities/${activityId}/ratings/pending`).then((r) => r.data.data.users);

export const submitRating = (activityId, { rateeId, stars, comment, behavioralFeedback }) =>
  api.post(`/activities/${activityId}/ratings`, { rateeId, stars, comment, behavioralFeedback }).then((r) => r.data.data.rating);
