import { api } from '../lib/axios.js';

export const submitReportRequest = (payload) =>
  api.post('/reports', payload).then((r) => r.data.data.report);

export const adminListReportsRequest = ({ status, page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  params.append('page', page);
  params.append('limit', limit);
  return api.get(`/reports/admin?${params.toString()}`).then((r) => r.data.data);
};

export const adminModerateReportRequest = (reportId, { action, actionTaken }) =>
  api.patch(`/reports/admin/${reportId}`, { action, actionTaken }).then((r) => r.data.data.report);
