import axios from 'axios';
import { Platform } from 'react-native';

/**
 * Resolve the correct API base URL:
 * - Env var EXPO_PUBLIC_API_URL takes priority
 * - Android emulator uses 10.0.2.2 (loopback to host machine)
 * - All other platforms (web, iOS simulator) use localhost
 * - Backend runs on port 8000 (FastAPI/Uvicorn)
 */
const getBaseURL = (): string => {
  return '';
};

export const apiClient = axios.create({
  baseURL: '',
  timeout: 1000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let currentAuthToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  currentAuthToken = token;
};

let isBackendOnline: boolean | null = false;
let lastFailureTime = 0;
const OFFLINE_COOLDOWN_MS = 30000;
const offlineQueue: Array<{ method: string; url: string; data?: any }> = [];

export const checkBackendHealth = async (): Promise<boolean> => {
  // Standalone offline APK: backend is intentionally disabled
  isBackendOnline = false;
  return false;
};

const flushOfflineQueue = async () => {
  if (!isBackendOnline || offlineQueue.length === 0) return;
  const items = [...offlineQueue];
  offlineQueue.length = 0;
  for (const item of items) {
    try {
      await apiClient.request({ method: item.method as any, url: item.url, data: item.data });
    } catch {
      break;
    }
  }
};

// Automatically inject Bearer auth token if active and check offline status
apiClient.interceptors.request.use((config) => {
  if (currentAuthToken) {
    config.headers.Authorization = `Bearer ${currentAuthToken}`;
  }

  // Circuit breaker: skip firing network requests if known offline within cooldown
  if (isBackendOnline === false && Date.now() - lastFailureTime < OFFLINE_COOLDOWN_MS) {
    if (config.method?.toLowerCase() === 'post') {
      offlineQueue.push({ method: config.method, url: config.url || '', data: config.data });
      const cancelSource = axios.CancelToken.source();
      config.cancelToken = cancelSource.token;
      cancelSource.cancel('Backend offline: cached locally in offline queue');
    }
  }

  return config;
});

// Suppress unhandled network rejections for offline/background sync
apiClient.interceptors.response.use(
  (response) => {
    isBackendOnline = true;
    return response;
  },
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.resolve({ data: null, offline: true, error: error.message });
    }
    // Track connection failure to prevent repeated network spam
    if (!error.response || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      isBackendOnline = false;
      lastFailureTime = Date.now();
    }
    return Promise.resolve({ data: null, offline: true, error: error?.message || 'Network unavailable' });
  }
);

