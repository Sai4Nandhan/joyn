import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  // Prevent infinite spinner on network failure or slow backend
  timeout: 10000,
});

let accessToken = null;
let refreshPromise = null;
let onSessionExpiredCallback = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function setRefreshPromise(promise) {
  refreshPromise = promise;
}

export function setOnSessionExpired(cb) {
  onSessionExpiredCallback = cb;
}

export function notifySessionExpired() {
  setAccessToken(null);
  // Broadcast to other open tabs
  try {
    localStorage.setItem('joyn_session_expired_event', Date.now().toString());
  } catch {}
  if (typeof onSessionExpiredCallback === 'function') {
    onSessionExpiredCallback();
  }
}

export async function refreshSession() {
  if (!refreshPromise) {
    const localRefreshToken = localStorage.getItem('joyn_refresh_token');
    const headers = localRefreshToken ? { 'x-refresh-token': localRefreshToken } : {};
    refreshPromise = api.post('/auth/refresh', { refreshToken: localRefreshToken }, { headers })
      .then(({ data }) => {
        setAccessToken(data.data.accessToken);
        if (data.data.refreshToken) {
          localStorage.setItem('joyn_refresh_token', data.data.refreshToken);
        }
        return data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.request.use(async (config) => {
  const isAuthRoute = config.url?.includes('/auth/');

  // Protected routes must await any pending session refresh before proceeding
  if (!isAuthRoute && !accessToken && refreshPromise) {
    try {
      await refreshPromise;
    } catch {
      // Ignore error; response interceptor handles unauthenticated state
    }
  }

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    const isAuthRoute = original?.url?.includes('/auth/');
    const alreadyRetried = original?._retry;
    const is401 = error.response?.status === 401;

    if (is401) {
      if (!alreadyRetried && !isAuthRoute) {
        original._retry = true;

        try {
          const { data } = await refreshSession();
          original.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(original);
        } catch (refreshErr) {
          localStorage.removeItem('joyn_refresh_token');
          notifySessionExpired();
        }
      } else if (isAuthRoute && original?.url?.includes('/auth/refresh')) {
        notifySessionExpired();
      }
    }

    return Promise.reject(error);
  }
);
