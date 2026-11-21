const clean = (url?: string) => url?.trim().replace(/\/+$/, '') || undefined;

// Expo inlines EXPO_PUBLIC_* at bundle time: after editing frontend/.env, restart with `npx expo start --clear`.
const apiUrl = clean(process.env.EXPO_PUBLIC_API_URL);
if (!apiUrl) {
  throw new Error('EXPO_PUBLIC_API_URL is missing. Copy frontend/.env.example to frontend/.env and set your backend/ngrok URL.');
}

export const API_URL = apiUrl;
export const SOCKET_URL = clean(process.env.EXPO_PUBLIC_SOCKET_URL) ?? apiUrl;

/** Minutes before a scheduled dose when TAKEN unlocks. Keep in sync with backend TAKE_WINDOW_BEFORE_MINUTES. */
const takeWindow = Number(process.env.EXPO_PUBLIC_TAKE_WINDOW_BEFORE_MINUTES ?? 15);
export const TAKE_WINDOW_BEFORE_MINUTES = Number.isFinite(takeWindow) && takeWindow >= 0 ? takeWindow : 15;

/** Skips ngrok's free-tier browser warning page; harmless for any other host. */
export const TUNNEL_HEADERS = { 'ngrok-skip-browser-warning': 'true' };
