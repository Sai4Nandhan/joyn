import { createContext, useCallback, useEffect, useState } from 'react';
import { api, setAccessToken, refreshSession, setOnSessionExpired } from '../lib/axios.js';
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

    refreshSession()
      .then(({ data }) => {
        setUser(data.data.user);
        sessionStorage.removeItem('joyn_just_registered');
        setIsJustRegistered(false);
        return data;
      })
      .catch(() => {
        setUser(null);
        localStorage.removeItem('joyn_refresh_token');
        sessionStorage.removeItem('joyn_just_registered');
        setIsJustRegistered(false);
        return null;
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [handleSessionExpired]);

  const login = useCallback(async (credentials) => {
    const res = await authService.loginRequest(credentials);
    const { user: loggedInUser, accessToken, refreshToken } = res;
    setAccessToken(accessToken);
    setUser(loggedInUser);
    if (refreshToken) {
      localStorage.setItem('joyn_refresh_token', refreshToken);
    }
    sessionStorage.removeItem('joyn_just_registered');
    setIsJustRegistered(false);
    return loggedInUser;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await authService.registerRequest(payload);
    const { user: newUser, accessToken, refreshToken } = res;
    setAccessToken(accessToken);
    setUser(newUser);
    if (refreshToken) {
      localStorage.setItem('joyn_refresh_token', refreshToken);
    }
    sessionStorage.setItem('joyn_just_registered', 'true');
    setIsJustRegistered(true);
    return newUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logoutRequest();
    } catch {
      // Ignore network error on logout
    }
    localStorage.removeItem('joyn_refresh_token');
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
