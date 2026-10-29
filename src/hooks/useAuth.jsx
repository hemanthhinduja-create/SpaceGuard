import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../services/apiClient';

const AuthContext = createContext(null);

// Authentication lives on the server: an HTTP-only cookie holds the session token.
// Nothing sensitive (passwords, tokens) is ever written to localStorage.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the session after a page refresh.
  const refresh = useCallback(async (signal) => {
    try {
      const data = await apiRequest('/auth/me', { signal });
      setUser(data.user);
      return data.user;
    } catch (error) {
      if (signal?.aborted) return null;
      setUser(null); // 401 = not signed in; network errors also land on the login page
      return null;
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  const login = useCallback(async (email, password) => {
    const data = await apiRequest('/auth/login', { method: 'POST', body: { email, password } });
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const data = await apiRequest('/auth/register', { method: 'POST', body: { name, email, password } });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST', body: {} });
    } finally {
      setUser(null); // always leave the signed-in UI, even if the request failed
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh }),
    [user, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
