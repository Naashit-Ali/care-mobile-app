import { AxiosError, create } from 'axios';
import { API_URL, TUNNEL_HEADERS } from '../config';
import { getSession } from '../storage/session';

export const api = create({ baseURL: API_URL, timeout: 10000, headers: TUNNEL_HEADERS });

api.interceptors.request.use(async (cfg) => {
  const s = await getSession();
  if (s) cfg.headers['x-auth-token'] = s.token;
  return cfg;
});

let onUnauthorized: (() => void) | null = null;
/** Called when the server rejects the saved session token (logged out elsewhere, account reset…). */
export const setOnUnauthorized = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

api.interceptors.response.use(undefined, (e) => {
  if (e instanceof AxiosError && e.response?.status === 401 && e.config?.headers?.['x-auth-token']) {
    onUnauthorized?.();
  }
  return Promise.reject(e);
});

export function errorMessage(e: unknown): string {
  if (e instanceof AxiosError) {
    if (!e.response) return `Can't reach the server at ${API_URL}. Is the backend / ngrok running?`;
    if (e.response.status === 429) return 'Too many tries. Wait a minute and try again.';
    const msg = (e.response.data as { message?: string | string[] })?.message;
    if (msg) return Array.isArray(msg) ? msg.join('\n') : msg;
  }
  return e instanceof Error ? e.message : 'Something went wrong';
}
