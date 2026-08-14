import { api } from '../lib/axios.js';

export async function uploadProfilePhoto(file) {
  const formData = new FormData();
  formData.append('photo', file);
  const response = await api.post('/users/me/photos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data.user;
}

export async function deleteProfilePhoto(photoId) {
  const response = await api.delete(`/users/me/photos/${photoId}`);
  return response.data.data.user;
}

export async function setPrimaryPhoto(photoId) {
  const response = await api.patch(`/users/me/photos/${photoId}/primary`);
  return response.data.data.user;
}

export async function reorderPhotos(photoIds) {
  const response = await api.put('/users/me/photos/reorder', { photoIds });
  return response.data.data.user;
}
