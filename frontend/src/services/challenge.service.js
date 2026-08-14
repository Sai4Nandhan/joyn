import { api } from '../lib/axios.js';

export async function getMyChallengeProgress() {
  const response = await api.get('/challenges/my-progress');
  return response.data;
}
