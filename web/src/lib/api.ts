'use client';

import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

export interface PermissionSpec {
  resource: string;
  action: string;
  scope?: string;
}

export interface MeUser {
  id: number;
  email: string;
  fullName: string;
  roleCode: string;
}

/** عميل HTTP موحّد مع اعتراض JWT وتجديد تلقائي عند انتهاء التوكن */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
});
const refreshApi = axios.create({ baseURL: api.defaults.baseURL });

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const ACCESS_KEY = 'sgba_access';
const REFRESH_KEY = 'sgba_refresh';

export const tokenStore = {
  get access() {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh: string) {
    window.localStorage.setItem(ACCESS_KEY, access);
    window.localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  },
};

// إرفاق توكن الوصول في كل طلب
api.interceptors.request.use((config) => {
  const token = tokenStore.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string> | null = null;

async function refreshAccess(): Promise<string> {
  const rt = tokenStore.refresh;
  if (!rt) throw new Error('no refresh token');
  const { data } = await refreshApi.post<{ accessToken: string; refreshToken: string }>(
    '/auth/refresh',
    { refreshToken: rt },
  );
  tokenStore.set(data.accessToken, data.refreshToken);
  return data.accessToken;
}

// عند استجابة 401: جرّب تجديدًا واحدًا ثم أعد الطلب الأصلي
api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as RetryableRequestConfig | undefined;
    if (error.response?.status === 401 && original && !original._retry && tokenStore.refresh) {
      original._retry = true;
      try {
        refreshing = refreshing ?? refreshAccess();
        const token = await refreshing;
        refreshing = null;
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        refreshing = null;
        tokenStore.clear();
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
