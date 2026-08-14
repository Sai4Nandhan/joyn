import { api } from '../lib/axios.js';

export async function sendOtpRequest(payload) {
  const { data } = await api.post('/auth/send-otp', payload);
  return data;
}

export async function verifyOtpRequest(payload) {
  const { data } = await api.post('/auth/verify-otp', payload);
  return data;
}

export async function registerRequest(payload) {
  const { data } = await api.post('/auth/register', payload);
  return data.data;
}

export async function loginRequest(payload) {
  const { data } = await api.post('/auth/login', payload);
  return data.data;
}

export async function logoutRequest() {
  await api.post('/auth/logout');
}

export async function meRequest() {
  const { data } = await api.get('/auth/me');
  return data.data;
}

export async function forgotPasswordRequest(payload) {
  const { data } = await api.post('/auth/forgot-password', payload);
  return data;
}

export async function verifyResetOtpRequest(payload) {
  const { data } = await api.post('/auth/verify-reset-otp', payload);
  return data;
}

export async function resetPasswordRequest(payload) {
  const { data } = await api.post('/auth/reset-password', payload);
  return data;
}
