import { api } from '../lib/axios.js';

export const getAdminStats = () => api.get('/admin/stats').then((r) => r.data.data);

export const listAdminUsers = (params) => api.get('/admin/users', { params }).then((r) => r.data.data);
export const updateAdminUser = (id, payload) => api.patch(`/admin/users/${id}`, payload).then((r) => r.data.data.user);
export const deleteAdminUser = (id) => api.delete(`/admin/users/${id}`).then((r) => r.data.data);

export const listAdminActivities = (params) => api.get('/admin/activities', { params }).then((r) => r.data.data);
export const updateAdminActivityStatus = (id, status) =>
  api.patch(`/admin/activities/${id}/status`, { status }).then((r) => r.data.data.activity);
export const deleteAdminActivity = (id) => api.delete(`/admin/activities/${id}`).then((r) => r.data.data);
