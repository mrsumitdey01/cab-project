import axios from 'axios';

const ACCESS_TOKEN_KEY = 'cab_access_token';
const REFRESH_TOKEN_KEY = 'cab_refresh_token';

let refreshing = null;

const RAW_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_PREFIX = '/api/v1';
const HAS_PREFIX = RAW_BASE_URL.endsWith(API_PREFIX);
const BASE_URL = HAS_PREFIX ? RAW_BASE_URL : `${RAW_BASE_URL}${API_PREFIX}`;

export const http = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
});

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setSessionTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearSessionTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (!config.headers['x-request-id']) {
    const requestId = crypto.randomUUID();
    config.headers['x-request-id'] = requestId;
    console.log(`requestId=${requestId} ${config.method?.toUpperCase()} ${config.baseURL || ''}${config.url || ''}`);
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (!error.response || error.response.status !== 401 || original._retry) {
      throw error;
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearSessionTokens();
      throw error;
    }

    if (!refreshing) {
      refreshing = axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
        .then((res) => {
          const session = res.data?.data;
          if (!session?.accessToken || !session?.refreshToken) {
            throw new Error('Invalid refresh response');
          }
          setSessionTokens(session);
          return session;
        })
        .finally(() => {
          refreshing = null;
        });
    }

    try {
      await refreshing;
      original._retry = true;
      original.headers.Authorization = `Bearer ${getAccessToken()}`;
      return http(original);
    } catch (refreshError) {
      clearSessionTokens();
      throw refreshError;
    }
  }
);
