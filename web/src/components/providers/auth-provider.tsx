'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '@/lib/api';
import type { MeUser, PermissionSpec } from '@/lib/api';

interface AuthState {
  user: MeUser | null;
  permissions: PermissionSpec[];
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (resource: string, action: string) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeUser | null>(null);
  const [permissions, setPermissions] = useState<PermissionSpec[]>([]);
  const [loading, setLoading] = useState(true);

  // يقرأ البروفايل عند فتح التطبيق (إن وُجد توكن محفوظ) — يبني منه قوائم الواجهة
  const loadMe = useCallback(async () => {
    if (!tokenStore.access) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get<{ user: MeUser; permissions: PermissionSpec[] }>('/auth/me');
      setUser(data.user);
      setPermissions(data.permissions);
    } catch {
      tokenStore.clear();
      setUser(null);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<{ accessToken: string; refreshToken: string; user: MeUser }>(
      '/auth/login',
      { email, password },
    );
    tokenStore.set(data.accessToken, data.refreshToken);
    try {
      const me = await api.get<{ user: MeUser; permissions: PermissionSpec[] }>('/auth/me');
      setUser(me.data.user);
      setPermissions(me.data.permissions);
    } catch (error) {
      tokenStore.clear();
      setUser(null);
      setPermissions([]);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    const rt = tokenStore.refresh;
    if (rt) await api.post('/auth/logout', { refreshToken: rt }).catch(() => undefined);
    tokenStore.clear();
    setUser(null);
    setPermissions([]);
  }, []);

  const hasPermission = useCallback(
    (resource: string, action: string) =>
      permissions.some((p) => p.resource === resource && p.action === action),
    [permissions],
  );

  const value = useMemo(
    () => ({ user, permissions, loading, login, logout, hasPermission }),
    [user, permissions, loading, login, logout, hasPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
