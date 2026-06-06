import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, clearAuthStorage } from '../api/client';
import { connectSocket, disconnectSocket } from '../socket/socket';

const AuthContext = createContext(null);

const persistUser = (user) => {
  if (user) localStorage.setItem('user', JSON.stringify(user));
  else localStorage.removeItem('user');
};

const persistTokens = (token, refreshToken) => {
  localStorage.setItem('token', token);
  localStorage.setItem('refreshToken', refreshToken);
};

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(readStoredUser);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const res = await authAPI.me();
    const freshUser = res.data.data;
    setUser(freshUser);
    persistUser(freshUser);
    return freshUser;
  }, []);

  const completeAuthFromResponse = useCallback(async (data) => {
    if (data.token && data.refreshToken) {
      persistTokens(data.token, data.refreshToken);
      if (data.data) {
        setUser(data.data);
        persistUser(data.data);
      } else {
        await refreshUser();
      }
    }
    return data;
  }, [refreshUser]);

  // Verify session on mount and load fresh profile from server
  useEffect(() => {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    if (!token && !refreshToken) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 8000);

    refreshUser()
      .catch(() => {
        clearAuthStorage();
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
        clearTimeout(timeoutId);
      });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [refreshUser]);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    await completeAuthFromResponse(res.data);
    return res.data;
  }, [completeAuthFromResponse]);

  const register = useCallback(async (payload) => {
    const res = await authAPI.register(payload);
    if (res.data.requiresVerification) {
      return { requiresVerification: true, message: res.data.message, email: res.data.data?.email };
    }
    await completeAuthFromResponse(res.data);
    return res.data;
  }, [completeAuthFromResponse]);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) await authAPI.logout({ refreshToken });
    } catch {
      // Clear local session even if revoke fails
    }
    disconnectSocket();
    clearAuthStorage();
    setUser(null);
  }, []);

  // Real-time updates via Socket.io
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!user || !token) {
      disconnectSocket();
      return;
    }
    connectSocket(token);
  }, [user?._id]);

  const can = useCallback((roles) => roles.includes(user?.role), [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, can, refreshUser, completeAuthFromResponse }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
