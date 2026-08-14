import { api } from '../lib/axios.js';

export async function getVerificationStatus() {
  const response = await api.get('/verification/status');
  return response.data.data.verification;
}

export async function submitVerification(selfieFile, documentFile, simulateInstantVerify = false) {
  const formData = new FormData();
  if (selfieFile) formData.append('selfie', selfieFile);
  if (documentFile) formData.append('document', documentFile);
  if (simulateInstantVerify) formData.append('simulateInstantVerify', 'true');

  const response = await api.post('/verification/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function adminListVerifications() {
  const response = await api.get('/verification/admin/list');
  return response.data.data.verifications;
}

export async function adminReviewVerification(userId, status, rejectionReason = '') {
  const response = await api.post(`/verification/admin/review/${userId}`, {
    status,
    rejectionReason,
  });
  return response.data;
}
