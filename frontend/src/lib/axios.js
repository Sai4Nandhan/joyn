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

api.interceptors.request.use(async (config) => {
  // If an initial or queued session refresh is currently in progress and we don't have an accessToken yet, await it first!
  if (!accessToken && refreshPromise) {
    try {
      await refreshPromise;
    } catch {
      // Ignore error here; response interceptor or catch block handles unauthenticated state
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
          if (!refreshPromise) {
            refreshPromise = api.post('/auth/refresh').finally(() => {
              refreshPromise = null;
            });
          }
          const { data } = await refreshPromise;
          setAccessToken(data.data.accessToken);
          original.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(original);
        } catch (refreshErr) {
          // Refresh failed (e.g. 401 session expired) — clear token and notify listener
          notifySessionExpired();
        }
      } else if (isAuthRoute && original?.url?.includes('/auth/refresh')) {
        notifySessionExpired();
      }
    }

    return Promise.reject(error);
  }
);
