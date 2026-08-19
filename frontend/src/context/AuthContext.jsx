import { createContext, useCallback, useEffect, useState } from 'react';
import { api, setAccessToken, setRefreshPromise, setOnSessionExpired } from '../lib/axios.js';
import * as authService from '../services/authService.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);
  const [isJustRegistered, setIsJustRegistered] = useState(() => {
    return sessionStorage.getItem('joyn_just_registered') === 'true';
  });

  const handleSessionExpired = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setSessionExpiredNotice(true);
    sessionStorage.removeItem('joyn_just_registered');
    setIsJustRegistered(false);
  }, []);

  useEffect(() => {
    setOnSessionExpired(handleSessionExpired);

    const handleStorageChange = (e) => {
      if (e.key === 'joyn_session_expired_event') {
        handleSessionExpired();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const initPromise = api.post('/auth/refresh')
      .then(({ data }) => {
        setAccessToken(data.data.accessToken);
        setUser(data.data.user);
        sessionStorage.removeItem('joyn_just_registered');
        setIsJustRegistered(false);
        return data;
      })
      .catch(() => {
        setUser(null);
        sessionStorage.removeItem('joyn_just_registered');
        setIsJustRegistered(false);
        return null;
      })
      .finally(() => {
        setIsLoading(false);
        setRefreshPromise(null);
      });

    setRefreshPromise(initPromise);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [handleSessionExpired]);

  const login = useCallback(async (credentials) => {
    const { user: loggedInUser, accessToken } = await authService.loginRequest(credentials);
    setAccessToken(accessToken);
    setUser(loggedInUser);
    sessionStorage.removeItem('joyn_just_registered');
    setIsJustRegistered(false);
    return loggedInUser;
  }, []);

  const register = useCallback(async (payload) => {
    const { user: newUser, accessToken } = await authService.registerRequest(payload);
    setAccessToken(accessToken);
    setUser(newUser);
    sessionStorage.setItem('joyn_just_registered', 'true');
    setIsJustRegistered(true);
    return newUser;
  }, []);

  const logout = useCallback(async () => {
    await authService.logoutRequest();
    setAccessToken(null);
    setUser(null);
    sessionStorage.removeItem('joyn_just_registered');
    setIsJustRegistered(false);
  }, []);

  const completeOnboarding = useCallback(async () => {
    sessionStorage.removeItem('joyn_just_registered');
    setIsJustRegistered(false);
    try {
      const { data } = await api.patch('/users/me', { hasCompletedOnboarding: true });
      if (data.data?.user) {
        setUser(data.data.user);
      } else {
        setUser((prev) => (prev ? { ...prev, hasCompletedOnboarding: true } : null));
      }
    } catch {
      setUser((prev) => (prev ? { ...prev, hasCompletedOnboarding: true } : null));
    }
  }, []);

  const clearSessionExpiredNotice = useCallback(() => {
    setSessionExpiredNotice(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, isJustRegistered, sessionExpiredNotice, clearSessionExpiredNotice, login, register, logout, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}
