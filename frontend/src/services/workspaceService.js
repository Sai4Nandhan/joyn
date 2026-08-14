import { api } from '../lib/axios.js';

const base = (activityId) => `/activities/${activityId}/workspace`;

// Expenses
export const getExpenses = (activityId) => api.get(`${base(activityId)}/expenses`).then((r) => r.data.data);
export const addExpense = (activityId, payload) =>
  api.post(`${base(activityId)}/expenses`, payload).then((r) => r.data.data.expense);
export const deleteExpense = (activityId, expenseId) =>
  api.delete(`${base(activityId)}/expenses/${expenseId}`).then((r) => r.data.data);

// Polls
export const getPolls = (activityId) => api.get(`${base(activityId)}/polls`).then((r) => r.data.data);
export const createPoll = (activityId, payload) =>
  api.post(`${base(activityId)}/polls`, payload).then((r) => r.data.data.poll);
export const voteOnPoll = (activityId, pollId, optionIds) =>
  api.post(`${base(activityId)}/polls/${pollId}/vote`, { optionIds }).then((r) => r.data.data.poll);
export const closePoll = (activityId, pollId) =>
  api.patch(`${base(activityId)}/polls/${pollId}/close`).then((r) => r.data.data.poll);

// Checklist
export const getChecklist = (activityId) => api.get(`${base(activityId)}/checklist`).then((r) => r.data.data.items);
export const addChecklistItem = (activityId, payload) =>
  api.post(`${base(activityId)}/checklist`, payload).then((r) => r.data.data.item);
export const updateChecklistItem = (activityId, itemId, payload) =>
  api.patch(`${base(activityId)}/checklist/${itemId}`, payload).then((r) => r.data.data.item);
export const deleteChecklistItem = (activityId, itemId) =>
  api.delete(`${base(activityId)}/checklist/${itemId}`).then((r) => r.data.data);
